// TODO: inject hostname from environment variable
const BACKEND_HOST = "https://checkout-ui-gateway-dev.stg.tidnex.dev";

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
): (pathArg: PathArg) => Promise<ResponseBody>;

// GET with path param and query param
export function endpoint<ResponseBody, PathArg, QueryArg = never>(
  method: "GET",
  getPath: (pathArg: PathArg) => string,
  getQuery: (queryArg: QueryArg) => URLSearchParams,
): (pathArg: PathArg, queryArg?: QueryArg) => Promise<ResponseBody>;

// POST with path param
export function endpoint<RequestBody, ResponseBody, PathArg>(
  method: "POST",
  getPath: (pathArg: PathArg) => string,
): (requestBody: RequestBody, pathArg: PathArg) => Promise<ResponseBody>;

// POST with path param and query param
export function endpoint<RequestBody, ResponseBody, PathArg, QueryArg = never>(
  method: "POST",
  getPath: (pathArg: PathArg) => string,
  getQuery: (queryArg: QueryArg) => URLSearchParams,
): (
  requestBody: RequestBody,
  pathArg: PathArg,
  queryArg?: QueryArg,
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
    let pathArg: unknown;
    let queryArg: unknown;
    let requestBody: unknown;

    switch (method) {
      case "GET":
        [pathArg, queryArg] = rest;
        break;
      case "POST":
        [requestBody, pathArg, queryArg] = rest;
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }

    const url = new URL(getPath(pathArg), BACKEND_HOST);
    if (getQuery) {
      if (queryArg === undefined) {
        throw new Error("queryArg is required but was not provided");
      }
      url.search = getQuery(queryArg).toString();
    }
    const options: RequestInit = {
      method,
      body: requestBody ? convertDataToUrlSearchParams(requestBody) : undefined,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    };
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Failed to call ${method} ${getPath(pathArg)}`);
    }
    return response.json();
  };
}
