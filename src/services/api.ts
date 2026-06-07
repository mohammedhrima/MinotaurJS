type ReqOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

async function request<T = unknown>(
  url: string,
  { method = "GET", body, headers }: ReqOptions = {},
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const type = res.headers.get("content-type") || "";
  return (type.includes("json") ? res.json() : res.text()) as Promise<T>;
}

const api = {
  get: <T = unknown>(url: string, opts?: ReqOptions) =>
    request<T>(url, { ...opts, method: "GET" }),
  post: <T = unknown>(url: string, body?: unknown, opts?: ReqOptions) =>
    request<T>(url, { ...opts, method: "POST", body }),
  put: <T = unknown>(url: string, body?: unknown, opts?: ReqOptions) =>
    request<T>(url, { ...opts, method: "PUT", body }),
  patch: <T = unknown>(url: string, body?: unknown, opts?: ReqOptions) =>
    request<T>(url, { ...opts, method: "PATCH", body }),
  del: <T = unknown>(url: string, opts?: ReqOptions) =>
    request<T>(url, { ...opts, method: "DELETE" }),
};

export default api;
