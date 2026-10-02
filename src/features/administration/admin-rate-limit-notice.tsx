const messages: Record<string, string> = {
  "rate-limited": "Too many administrative changes. Please wait and try again.",
  unavailable:
    "Administrative changes are temporarily unavailable. Please try again.",
};

export function AdminRateLimitNotice({ error }: Readonly<{ error?: string }>) {
  const message = error ? messages[error] : undefined;
  if (!message) return null;

  return (
    <p
      role="alert"
      className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      {message}
    </p>
  );
}
