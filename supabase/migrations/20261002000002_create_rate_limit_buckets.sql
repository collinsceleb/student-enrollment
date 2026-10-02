CREATE TABLE public.rate_limit_buckets (
  rate_key TEXT PRIMARY KEY
    CHECK (rate_key ~ '^[0-9a-f]{64}$'),
  window_started_at TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count > 0),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX rate_limit_buckets_expires_at_idx
  ON public.rate_limit_buckets (expires_at);

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.rate_limit_buckets FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.rate_limit_buckets TO service_role;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS TABLE(allowed BOOLEAN, retry_after_seconds INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_now TIMESTAMPTZ := clock_timestamp();
  v_window_started_at TIMESTAMPTZ;
  v_request_count INTEGER;
  v_window INTERVAL;
BEGIN
  IF p_key !~ '^[0-9a-f]{64}$'
    OR p_limit < 1
    OR p_window_seconds < 1
    OR p_window_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid rate limit parameters'
      USING ERRCODE = '22023';
  END IF;

  v_window := make_interval(secs => p_window_seconds);

  INSERT INTO public.rate_limit_buckets AS bucket (
    rate_key,
    window_started_at,
    request_count,
    expires_at
  )
  VALUES (p_key, v_now, 1, v_now + v_window)
  ON CONFLICT (rate_key) DO UPDATE
    SET window_started_at = CASE
          WHEN bucket.window_started_at + v_window <= v_now THEN v_now
          ELSE bucket.window_started_at
        END,
        request_count = CASE
          WHEN bucket.window_started_at + v_window <= v_now THEN 1
          ELSE bucket.request_count + 1
        END,
        expires_at = CASE
          WHEN bucket.window_started_at + v_window <= v_now THEN v_now + v_window
          ELSE bucket.expires_at
        END
  RETURNING bucket.request_count, bucket.window_started_at
    INTO v_request_count, v_window_started_at;

  IF random() < 0.01 THEN
    DELETE FROM public.rate_limit_buckets WHERE expires_at <= v_now;
  END IF;

  RETURN QUERY
    SELECT
      v_request_count <= p_limit,
      GREATEST(
        1,
        CEIL(EXTRACT(EPOCH FROM (v_window_started_at + v_window - v_now)))::INTEGER
      );
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(TEXT, INTEGER, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(TEXT, INTEGER, INTEGER)
  TO service_role;