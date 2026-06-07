export const capitalize = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);

export const pascal = (s: string): string =>
  s.split(/[-_]/).filter(Boolean).map(capitalize).join("");

const segments = (raw: string): string[] =>
  raw
    .split("/")
    .map((s) => s.trim().replace(/^\[(.+)\]$/, "$1"))
    .filter(Boolean);

export function deriveNames(raw: string) {
  const segs = segments(raw);
  return {
    Name: segs.map(pascal).join("") || "Page",
    className: segs.join("-").toLowerCase() || "page",
    title: segs.length ? pascal(segs[segs.length - 1]) : "Home",
  };
}

export const routeId = (segs: string[]): string =>
  segs
    .map((s) => s.replace(/^:(.+)$/, "$1"))
    .flatMap((s) => s.split(/[-_]/))
    .filter(Boolean)
    .map(capitalize)
    .join("") || "Index";
