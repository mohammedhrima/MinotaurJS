export function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  for (const part of document.cookie.split(";")) {
    const i = part.indexOf("=");
    if (part.slice(0, i).trim() === name)
      return decodeURIComponent(part.slice(i + 1));
  }
  return null;
}

export function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}`;
}

export function rmCookie(name: string, path = "/", domain?: string) {
  if (typeof document === "undefined") return;
  const base = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = domain
    ? `${name}=; path=${path}; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    : base;
}
