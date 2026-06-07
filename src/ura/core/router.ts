import { VDOM, Props } from "./types.js";
import { e } from "./vdom.js";
import {
  display,
  mount,
  unmount,
  detach,
  reattach,
  rerender,
  collectDoms,
  flushEffects,
  globalVODM,
} from "./render.js";

function ErrorPage(props: any) {
  const brand = "#007acc";
  return e(
    "div",
    {
      style: {
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "18px",
        padding: "24px",
        textAlign: "center",
        background:
          "radial-gradient(900px 500px at 50% -10%, #16243a 0%, #0f0e17 60%)",
        color: "#e6e4f0",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      },
    },
    e(
      "div",
      {
        style: {
          fontSize: "clamp(72px, 18vw, 170px)",
          fontWeight: "800",
          lineHeight: "1",
          letterSpacing: "-4px",
          color: brand,
          textShadow: `0 8px 40px ${brand}55`,
        },
      },
      "404",
    ),
    e(
      "h1",
      { style: { fontSize: "clamp(20px, 4vw, 30px)", fontWeight: "700", margin: "0" } },
      "Page not found",
    ),
    e(
      "p",
      {
        style: {
          margin: "0",
          maxWidth: "440px",
          lineHeight: "1.6",
          color: "#9b97b3",
        },
      },
      "No route matches ",
      e(
        "code",
        {
          style: {
            background: "#1a1825",
            border: "1px solid #2e2b3d",
            borderRadius: "6px",
            padding: "2px 8px",
            color: brand,
            fontFamily: "ui-monospace, Menlo, monospace",
          },
        },
        props.message,
      ),
    ),
    e(
      "a",
      {
        onclick: () => navigate("/"),
        style: {
          marginTop: "6px",
          cursor: "pointer",
          background: brand,
          color: "#fff",
          padding: "11px 22px",
          borderRadius: "10px",
          fontWeight: "600",
          boxShadow: `0 8px 24px ${brand}40`,
        },
      },
      "Back home",
    ),
  );
}

export const Routes: { [path: string]: Function } = {};

function resetRoutes() {
  Object.keys(Routes).forEach((key) => delete Routes[key]);
  Routes["*"] = () => ErrorPage({ message: window.location.pathname });
}

resetRoutes();

function cleanPath(path: string) {
  if (path === "*") return path;
  if (!path.startsWith("/")) path = "/" + path;
  path = path.replace(/\/+/g, "/");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path;
}

export function setRoute(path: string, call: Function) {
  Routes[path] = call;
}

export function matchRoute(path: string): {
  fn: Function;
  params: Record<string, string>;
  pattern: string;
} {
  path = cleanPath(path);
  if (Routes[path]) return { fn: Routes[path], params: {}, pattern: path };

  const segs = path.split("/").filter(Boolean);
  for (const pattern of Object.keys(Routes)) {
    if (pattern === "*" || !pattern.includes(":")) continue;
    const pSegs = pattern.split("/").filter(Boolean);
    if (pSegs.length !== segs.length) continue;

    const params: Record<string, string> = {};
    let ok = true;
    for (let i = 0; i < pSegs.length; i++) {
      if (pSegs[i].startsWith(":")) {
        params[pSegs[i].slice(1)] = decodeURIComponent(segs[i]);
      } else if (pSegs[i] !== segs[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return { fn: Routes[pattern], params, pattern };
  }
  return { fn: Routes["*"], params: {}, pattern: "*" };
}

export function getRoute(path = window.location.pathname) {
  return matchRoute(path).fn;
}

export function getRouteParams(path = window.location.pathname) {
  return matchRoute(path).params;
}

const Titles: { [path: string]: string | ((props: any) => string) } = {};

function normalizePage(mod: any): {
  component: Function | null;
  keepAlive?: boolean;
  title?: string | ((props: any) => string);
  route?: string;
} {
  if (!mod) return { component: null };
  const def =
    typeof mod === "object" && "default" in mod ? mod.default : mod;
  if (typeof def === "function") {
    return {
      component: def,
      keepAlive: mod.keepAlive ?? def.keepAlive,
      title: mod.title ?? def.title,
      route: mod.route ?? def.route,
    };
  }
  if (def && typeof def === "object") {
    return {
      component: def.page,
      keepAlive: def.keepAlive,
      title: def.title,
      route: def.route,
    };
  }
  return { component: null };
}

export function setRoutes(currRoutes: { [path: string]: any }) {
  resetRoutes();
  KeepAlive.clear();
  for (const k of Object.keys(Titles)) delete Titles[k];
  for (const key of Object.keys(currRoutes)) {
    const { component, keepAlive, title, route } = normalizePage(
      currRoutes[key],
    );
    if (typeof component !== "function") continue;
    const path = key === "/" ? "/" : cleanPath(route || key);
    Routes[path] = component;
    if (keepAlive) KeepAlive.add(path);
    if (title != null) Titles[path] = title;
  }
  // A user-defined /404 page overrides the built-in ErrorPage for unmatched URLs.
  if (Routes["/404"]) {
    Routes["*"] = Routes["/404"];
    if (Titles["/404"] != null) Titles["*"] = Titles["/404"];
  }
}

function applyTitle(pattern: string, props: any) {
  const title = Titles[pattern];
  if (title == null) return;
  document.title = typeof title === "function" ? title(props) : title;
}

let navigate_handler: Function | null = null;

export function onNavigate(callback: Function) {
  navigate_handler = callback;
}

export function normalizePath(path: string) {
  if (!path || path == "") return "/";
  path = path.replace(/^\s+|\s+$/gm, "");
  if (!path.startsWith("/") && !path.startsWith("./")) path = "/" + path;
  path = path.replace(/\/{2,}/g, "/");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path;
}

export function getParams() {
  const res: Record<string, string> = {};
  const urlParams = new URLSearchParams(window.location.search);
  for (const [key, value] of urlParams) res[key] = value;
  return res;
}

export function setQuery(key: string, value: any) {
  const url = new URL(window.location.href);
  const urlParams = url.searchParams;
  if (value === null || value === undefined) urlParams.delete(key);
  else urlParams.set(key, value);
  window.history.replaceState({}, "", `${url.pathname}?${urlParams}`);
}

// KEEP-ALIVE — opt-in per route; cache the route instance (Frame + DOM) so
// navigating away and back resumes its state instead of remounting fresh.
const KeepAlive = new Set<string>();

export function setKeepAlive(map: { [path: string]: any }) {
  KeepAlive.clear();
  for (const key of Object.keys(map)) if (map[key]) KeepAlive.add(cleanPath(key));
}

const routeCache: { map: Map<string, VDOM>; order: string[]; max: number } = {
  map: new Map(),
  order: [],
  max: 10,
};
const scrollCache: { [pattern: string]: number } = {};

function cachePut(key: string, node: VDOM) {
  routeCache.map.set(key, node);
  routeCache.order = routeCache.order.filter((k) => k !== key);
  routeCache.order.push(key);
  while (routeCache.order.length > routeCache.max) {
    const evicted = routeCache.order.shift()!;
    const evictedNode = routeCache.map.get(evicted);
    routeCache.map.delete(evicted);
    if (evictedNode) unmount(evictedNode); // true destroy on eviction
  }
}

function cacheTake(key: string): VDOM | undefined {
  const node = routeCache.map.get(key);
  routeCache.map.delete(key);
  routeCache.order = routeCache.order.filter((k) => k !== key);
  return node;
}

let currentPattern: string | null = null;
let currentPath: string | null = null;

function showRoute(fn: Function, props: Props, pattern: string, path: string) {
  const rootDom = document.getElementById("root");

  if (!globalVODM) {
    display(e("root", null, e(fn, props)));
    currentPattern = pattern;
    currentPath = path;
    return;
  }

  const rootVdom = globalVODM;
  const prevNode = (rootVdom.children || [])[0];

  if (prevNode) {
    if (currentPattern && currentPath && KeepAlive.has(currentPattern)) {
      scrollCache[currentPath] = window.scrollY;
      detach(prevNode);
      cachePut(currentPath, prevNode);
    } else {
      unmount(prevNode);
    }
  }

  let nextNode: VDOM;
  const cached = KeepAlive.has(pattern) ? cacheTake(path) : undefined;
  if (cached) {
    nextNode = cached;
    nextNode.props = props;
    reattach(rootDom, nextNode, null);
    if (nextNode.comp) rerender(nextNode.comp); // refresh props, keep state
    if (scrollCache[path] != null) window.scrollTo(0, scrollCache[path]);
  } else {
    nextNode = e(fn, props);
    mount(rootDom, nextNode, null);
  }

  rootVdom.children = [nextNode];
  currentPattern = pattern;
  currentPath = path;
  flushEffects();
}

export function refresh(extra: any = null) {
  if (navigate_handler) navigate_handler();
  const path = normalizePath(window.location.pathname || "*");
  const { fn, params: routeParams, pattern } = matchRoute(path);
  const props = { ...routeParams, ...getParams(), ...(extra || {}) };
  applyTitle(pattern, props);
  showRoute(fn, props, pattern, path);
}

export function navigate(route: string, params: Record<string, any> = {}) {
  route = normalizePath(route);
  if (Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    route = `${route}?${queryString}`;
  }
  window.history.pushState({}, "", route);
  return refresh();
}

export const useNavigate = () => navigate;

export function getCurrentRoute() {
  return normalizePath(window.location.pathname || "*");
}

export function In(path: string) {
  return normalizePath(path) === getCurrentRoute();
}
