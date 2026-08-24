import {
  assert,
  hostFromHostId,
  MOCK_HOST_ID,
  ParsedSdkKey,
  retryLoop,
} from "./utils";

export type ErrorResponse = {
  error_code: string;
  message: string;
  error_content?: {
    title: string;
    message_1: string;
    message_2?: string;
  };
};

export class NetworkError extends Error {
  constructor(public errorResponse: ErrorResponse) {
    super(errorResponse.message);
  }
}

/** Retries fetch on connection errors, other errors throw immediately. */
export async function fetchWithRetry(
  url: URL,
  options: RequestInit,
  mult: number,
  tries: number,
): Promise<Response> {
  let lastError: unknown;
  for await (const _attempt of retryLoop(mult, tries)) {
    try {
      return await fetch(url, options);
    } catch (error) {
      // AbortError from a cancelled request or an unexpected bug not worth to retry, so give up immediately.
      if (!(error instanceof TypeError)) {
        throw error;
      }
      lastError = error;
    }
  }
  throw lastError;
}

/**
 * Encode data for x-www-form-urlencoded content type
 */
function convertDataToUrlSearchParams<T extends object>(data: T) {
  const params = new URLSearchParams();
  params.append("payload", JSON.stringify(data));
  return params;
}

// GET with path param
export function endpoint<ResponseBody, PathArg>(
  method: "GET",
  getPath: (pathArg: PathArg) => string,
): (
  sdkKey: ParsedSdkKey,
  pathArg: PathArg,
  queryArg?: null,
  abortSignal?: AbortSignal,
) => Promise<ResponseBody>;

// GET with path param and query param
export function endpoint<ResponseBody, PathArg, QueryArg = never>(
  method: "GET",
  getPath: (pathArg: PathArg) => string,
  getQuery: (queryArg: QueryArg) => URLSearchParams,
): (
  sdkKey: ParsedSdkKey,
  pathArg: PathArg,
  queryArg?: QueryArg,
  abortSignal?: AbortSignal,
) => Promise<ResponseBody>;

// POST with path param
export function endpoint<RequestBody, ResponseBody, PathArg>(
  method: "POST",
  getPath: (pathArg: PathArg) => string,
): (
  sdkKey: ParsedSdkKey,
  requestBody: RequestBody,
  pathArg: PathArg,
  queryArg?: null,
  abortSignal?: AbortSignal,
) => Promise<ResponseBody>;

// POST with path param and query param
export function endpoint<RequestBody, ResponseBody, PathArg, QueryArg = never>(
  method: "POST",
  getPath: (pathArg: PathArg) => string,
  getQuery: (queryArg: QueryArg) => URLSearchParams,
): (
  sdkKey: ParsedSdkKey,
  requestBody: RequestBody,
  pathArg: PathArg,
  queryArg?: QueryArg,
  abortSignal?: AbortSignal,
) => Promise<ResponseBody>;

/**
 * Declares an endpoint in checkout-ui-gateway and returns a function to call it.
 *
 * @example
 * ```
 * // declare
 * const myEndpoint = endpoint<
 *   { userId: string }, // Request body type
 *   { name: string; age: number }, // Response body type
 *   string, // Type of arg passed to getPath
 *   string, // Type of arg passed to getQuery
 * >(
 *   "POST",
 *   (pathArg) => `/api/users/${pathArg}`, // getPath function
 *   (queryArg) => new UrlSearchParams({id: queryArg}) // getQuery function
 * );
 *
 * // usage
 * await myEndpoint({userId: "123"}, "456", "789");
 * ```
 */
export function endpoint(
  method: "GET" | "POST",
  getPath: (pathArg: unknown) => string,
  getQuery?: (queryArg: unknown) => URLSearchParams,
) {
  return async function (...rest: unknown[]): Promise<unknown> {
    let sdkKey: unknown;
    let pathArg: unknown;
    let queryArg: unknown;
    let requestBody: unknown;
    let abortSignal: unknown;

    switch (method) {
      case "GET":
        [sdkKey, pathArg, queryArg, abortSignal] = rest;
        break;
      case "POST":
        [sdkKey, requestBody, pathArg, queryArg, abortSignal] = rest;
        break;
      default:
        throw new Error(
          `Unable to call endpoint with method ${method}; this is a bug, please contact support.`,
        );
    }

    const versionNumber = process.env.XENDIT_COMPONENTS_VERSION;
    assert(versionNumber);
    assert(versionNumber.startsWith("v"));

    const hostId = (sdkKey as ParsedSdkKey).hostId;
    if (hostId === MOCK_HOST_ID) {
      throw new Error(
        "A network request was made in mock mode; this is a bug.",
      );
    }
    const host = hostFromHostId(hostId);
    if (!host) {
      throw new Error(
        `Unknown hostId ${hostId} in sdkKey; this is a bug, please contact support.`,
      );
    }

    const url = new URL(getPath(pathArg), host);
    if (getQuery && !queryArg) {
      throw new Error(
        "Query string argument is missing; this is a bug, please contact support.",
      );
    }
    const query = getQuery?.(queryArg) ?? new URLSearchParams();
    query.set("components_version", versionNumber);
    url.search = query.toString();

    const options: RequestInit = {
      method,
      body: requestBody ? convertDataToUrlSearchParams(requestBody) : undefined,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      signal: abortSignal as AbortSignal | undefined,
    };

    // Retry GETs on connection errors since they're safe to repeat.
    const response =
      method === "GET"
        ? await fetchWithRetry(url, options, 500, 3)
        : await fetch(url, options);
    if (!response.ok) {
      const errorData = (await response.json()) as ErrorResponse;
      if (!errorData || !errorData.error_code) {
        throw new Error("Unexpected error response from server");
      }
      throw new NetworkError(errorData);
    }

    return response.json();
  };
}
