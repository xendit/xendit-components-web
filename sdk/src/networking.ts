// TODO
const BACKEND_HOST = process.env.BACKEND_HOST || "";

/**
 * Encode data for x-www-form-urlencoded content type
 */
function convertDataToUrlSearchParams<T extends object>(data: T) {
  const params = new URLSearchParams();
  params.append("payload", JSON.stringify(data));
  return params;
}

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
export function endpoint<
  RequestBody extends object | undefined,
  ResponseBody,
  PathArg,
  QueryArg = never,
>(
  method: "GET" | "POST",
  getPath: (pathArg: PathArg) => string,
  getQuery?: (queryArg: QueryArg) => URLSearchParams,
) {
  return async function (
    requestBody: RequestBody,
    pathArg: PathArg,
    queryArg?: QueryArg,
  ): Promise<ResponseBody> {
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
