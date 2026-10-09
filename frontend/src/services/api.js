// Access tokens stay in memory: re-authenticate after a full page reload.
const API_BASE_URL = import.meta.env.VITE_API_URL || "";
let token = null;
export async function apiRequest(path, options = {}) {
  const { blob = false, timeoutMs = options.body instanceof FormData ? 120000 : 15000,
    signal, ...request } = options;
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort();
  if (signal?.aborted) cancel();
  signal?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...request,
      signal: controller.signal,
      headers: {
        ...(request.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...request.headers,
      },
    });
    if (response.status === 401) {
      token = null;
      window.dispatchEvent(new Event("estrade:unauthorized"));
    }
    if (response.ok && blob) return await response.blob();
    const body = await response.text();
    let data;
    try { data = body ? JSON.parse(body) : null; } catch {
      if (response.ok) throw new Error("Estrade returned an unexpected response. Please retry loading the page.");
    }
    if (!response.ok) {
      const detail = data?.detail;
      const fallback = {
        401: "Your session has expired. Please sign in again.",
        403: "You do not have permission to perform this action.",
        404: "The requested resource was not found. Refresh and try again.",
        409: "This conflicts with an existing record. Check the details and try again.",
        422: "Please check the form values and try again.",
      }[response.status] || `The server could not complete the request (${response.status}). Please try again.`;
      const error = new Error(typeof detail === "string" ? detail : Array.isArray(detail)
        ? detail.map(item => `${(item.loc || []).slice(1).join(".")}: ${item.msg}`).join("; ") : fallback);
      error.status = response.status;
      throw error;
    }
    return data;
  } catch (error) {
    if (controller.signal.aborted) {
      const aborted = new Error(timedOut
        ? "Request timed out. Check the event list before submitting again; the server may have saved your request."
        : "Request cancelled. Check the event list before submitting again.");
      aborted.code = timedOut ? "TIMEOUT" : "ABORTED";
      throw aborted;
    }
    if (error instanceof TypeError) throw new Error("Cannot reach Estrade. Check your connection and the API server.", {cause: error});
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}
export const authAPI = {
  setToken: (value) => { token = value; sessionStorage.removeItem("estrade_token"); },
  me: () => apiRequest("/api/v1/auth/me"),
  register: (body) => apiRequest("/api/v1/auth/register", {method: "POST", body: JSON.stringify(body)}),
  login: (body) => apiRequest("/api/v1/auth/login", {method: "POST", body: JSON.stringify(body)}),
};
export const eventAPI = {
  list: () => apiRequest("/api/v1/events"),
  create: (body, options = {}) => apiRequest("/api/v1/events", {...options, method: "POST", body: JSON.stringify(body)}),
};
