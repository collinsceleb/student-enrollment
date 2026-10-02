export class RequestBodyTooLargeError extends Error {
  constructor() {
    super("Request body exceeds the configured limit.");
    this.name = "RequestBodyTooLargeError";
  }
}

export class InvalidJsonBodyError extends Error {
  constructor() {
    super("Request body must contain valid JSON.");
    this.name = "InvalidJsonBodyError";
  }
}

function validateDeclaredLength(request: Request, maxBytes: number) {
  const contentLength = request.headers.get("content-length");
  if (contentLength === null) return;

  const declaredLength = Number(contentLength);
  if (!Number.isSafeInteger(declaredLength) || declaredLength < 0) {
    throw new InvalidJsonBodyError();
  }
  if (declaredLength > maxBytes) throw new RequestBodyTooLargeError();
}

async function collectLimitedBytes(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  maxBytes: number
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      void reader.cancel().catch(() => undefined);
      throw new RequestBodyTooLargeError();
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return bytes;
}

async function readLimitedBytes(
  body: ReadableStream<Uint8Array>,
  maxBytes: number
): Promise<Uint8Array> {
  const reader = body.getReader();
  try {
    return await collectLimitedBytes(reader, maxBytes);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) throw error;
    throw new InvalidJsonBodyError();
  } finally {
    reader.releaseLock();
  }
}

export async function readLimitedJson(
  request: Request,
  maxBytes: number
): Promise<unknown> {
  validateDeclaredLength(request, maxBytes);
  if (!request.body) throw new InvalidJsonBodyError();

  const bytes = await readLimitedBytes(request.body, maxBytes);
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return JSON.parse(text) as unknown;
  } catch {
    throw new InvalidJsonBodyError();
  }
}
