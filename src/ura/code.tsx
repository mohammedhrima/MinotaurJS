import { Type, deepEqual, deepCopy, loadCSS, svgElements } from "./utils.js";
import { VDOM, Props, Tag, Frame } from "./types.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function check(children: any): any[] {
  const result: any[] = [];
  children.forEach((child: any) => {
    const types = ["string", "number", "boolean", "bigint", "symbol"];
    if (types.includes(typeof child)) {
      result.push({ type: Type.TEXT, props: { value: String(child) } });
    } else if (Array.isArray(child)) {
      result.push(...check(child));
    } else if (child !== null && child !== undefined) {
      result.push(child);
    }
  });
  return result;
}

let conds: { cond: any }[] = [];
let curr_comp: Frame | null = null;

function e(tag: Tag, props: any = {}, ...children: any): any {
  if (typeof tag === "function") {
    return {
      type: Type.COMPONENT,
      tag,
      key: props?.key,
      props: props || {},
      children,
      comp: null,
    };
  }

  if (tag === "ura-if") {
    conds.push({ cond: props.cond });
    if (props.cond === true) return check(children || []);
    return [];
  } else if (tag === "ura-elif") {
    const last = conds[conds.length - 1];
    if (!last) {
      console.error("ura-elif must follow a ura-if/ura-elif tag");
      return [];
    }
    if (last.cond) return [];
    conds.pop();
    conds.push({ cond: props.cond });
    if (!props.cond) return [];
    return check(children || []);
  } else if (tag === "ura-else") {
    const last = conds[conds.length - 1];
    if (!last) {
      console.error("ura-else must follow a ura-if/ura-elif tag");
      return [];
    }
    conds.pop();
    if (last.cond) return [];
    return check(children || []);
  } else if (tag === "exec") {
    return { type: Type.EXEC, tag: "exec", call: props.call, children: [] };
  } else if (tag === "ura-loop") {
    const loopChildren = (props.on || []).flatMap((elem: any, id: number) =>
      (children || []).map((child: any) => {
        const evaluated = typeof child === "function" ? child(elem, id) : child;
        return deepCopy(evaluated);
      }),
    );
    return check(loopChildren || []);
  } else if (props && props["ura-if"] !== undefined) {
    conds.push({ cond: props["ura-if"] });
    if (!props["ura-if"]) return [];
    return element(tag, props, children);
  } else if (props && props["ura-elif"] !== undefined) {
    const last = conds[conds.length - 1];
    if (!last) {
      console.error("ura-elif must follow a ura-if/ura-elif tag");
      return [];
    }
    if (last.cond) return [];
    conds.pop();
    conds.push({ cond: props["ura-elif"] });
    if (!props["ura-elif"]) return [];
    return element(tag, props, children);
  } else if (props && props["ura-else"] !== undefined) {
    const last = conds[conds.length - 1];
    if (!last) {
      console.error(tag, "with ura-else must follow a ura-if/ura-elif tag");
      return [];
    }
    conds.pop();
    if (last.cond) return [];
    return element(tag, props, children);
  }

  return element(tag, props, children);
}

function element(tag: Tag, props: any, children: any): VDOM {
  return {
    type: Type.ELEMENT,
    tag,
    key: props?.key,
    props: props || {},
    children: check(children || []),
  };
}

function fr(_props: Props = {}, ...children: any) {
  return check(children);
}

function withFrame<T>(frame: Frame, fn: () => T): T {
  const prevComp = curr_comp;
  const prevConds = conds;
  curr_comp = frame;
  conds = [];
  try {
    return fn();
  } finally {
    curr_comp = prevComp;
    conds = prevConds;
  }
}

function renderComponent(node: VDOM): void {
  const frame: Frame =
    node.comp ||
    ({ func: node.tag as Function, states: [], index: 0 } as Frame);
  node.comp = frame;
  frame.node = node;
  frame.func = node.tag as Function;
  frame.props = node.props;
  frame.children = node.children;
  frame.index = 0;
  const out = withFrame(frame, () =>
    (node.tag as Function)(node.props, node.children),
  );
  frame.rendered = check(Array.isArray(out) ? out : [out]);
}

function addListener(dom: any, key: string, fn: any) {
  const ev = key.slice(2).toLowerCase();
  if (ev === "hover") {
    dom.addEventListener("mouseover", fn);
    dom.addEventListener("mouseout", fn);
  } else dom.addEventListener(ev, fn);
}

function removeListener(dom: any, key: string, fn: any) {
  const ev = key.slice(2).toLowerCase();
  if (ev === "hover") {
    dom.removeEventListener("mouseover", fn);
    dom.removeEventListener("mouseout", fn);
  } else dom.removeEventListener(ev, fn);
}

function applyStyle(dom: any, style: any) {
  if (!style) {
    dom.style.cssText = "";
    return;
  }
  dom.style.cssText = Object.keys(style)
    .map((p) => {
      const k = p.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      return `${k}:${style[p]}`;
    })
    .join(";");
}

function setAttr(vdom: VDOM, key: string, value: any) {
  const dom = vdom.dom;
  if (key === "class") {
    console.warn("use 'className' instead of 'class'", vdom);
    key = "className";
  }
  if (svgElements.has(vdom.tag as string)) dom.setAttribute(key, value);
  else {
    if ((key === "value" || key === "checked") && dom[key] === value) return;
    dom[key] = value;
  }
}

function applyAllProps(vdom: VDOM) {
  const props = vdom.props || {};
  for (const key of Object.keys(props)) {
    if (key === "key") continue;
    if (key.startsWith("on")) addListener(vdom.dom, key, props[key]);
    else if (key === "style") applyStyle(vdom.dom, props[key]);
    else setAttr(vdom, key, props[key]);
  }
}

function patchProps(prev: VDOM, next: VDOM) {
  const dom = prev.dom;
  const oldProps = prev.props || {};
  const newProps = next.props || {};

  for (const key of Object.keys(oldProps)) {
    if (key === "key" || key in newProps) continue;
    if (key.startsWith("on")) removeListener(dom, key, oldProps[key]);
    else if (key === "style") applyStyle(dom, null);
    else if (dom) {
      if (dom[key] !== undefined) dom[key] = "";
      else dom.removeAttribute?.(key);
    }
  }

  for (const key of Object.keys(newProps)) {
    if (key === "key") continue;
    const ov = oldProps[key];
    const nv = newProps[key];
    if (key.startsWith("on")) {
      if (ov !== nv) {
        if (ov) removeListener(dom, key, ov);
        addListener(dom, key, nv);
      }
    } else if (key === "style") {
      if (!deepEqual(ov, nv)) applyStyle(dom, nv);
    } else if (ov !== nv) {
      setAttr(prev, key, nv);
    }
  }
  prev.props = newProps;
}

function createElementDom(vdom: VDOM): boolean {
  if (vdom.tag === "root") {
    vdom.dom = document.getElementById("root");
    return false;
  }
  if (vdom.tag === "get") {
    vdom.dom = document.querySelector(vdom.props.by);
    return false;
  }
  if (svgElements.has(vdom.tag as string))
    vdom.dom = document.createElementNS(SVG_NS, vdom.tag as string);
  else vdom.dom = document.createElement(vdom.tag as string);
  applyAllProps(vdom);
  return true;
}

let effects: Function[] = [];

function mount(parentDom: any, vdom: VDOM, anchor: any) {
  switch (vdom.type) {
    case Type.ELEMENT: {
      const doInsert = createElementDom(vdom);
      for (const child of vdom.children || []) mount(vdom.dom, child, null);
      if (doInsert && vdom.dom && parentDom)
        parentDom.insertBefore(vdom.dom, anchor);
      break;
    }
    case Type.TEXT: {
      vdom.dom = document.createTextNode(String(vdom.props.value));
      if (parentDom) parentDom.insertBefore(vdom.dom, anchor);
      break;
    }
    case Type.COMPONENT: {
      renderComponent(vdom);
      (vdom.comp as Frame).parentDom = parentDom;
      for (const child of (vdom.comp as Frame).rendered || [])
        mount(parentDom, child, anchor);
      break;
    }
    case Type.EXEC: {
      if (vdom.call) effects.push(vdom.call);
      break;
    }
  }
}

function unmount(vdom: VDOM) {
  if (!vdom) return;
  switch (vdom.type) {
    case Type.ELEMENT: {
      const props = vdom.props || {};
      for (const key of Object.keys(props))
        if (key.startsWith("on")) removeListener(vdom.dom, key, props[key]);
      for (const child of vdom.children || []) unmount(child);
      vdom.dom?.remove();
      vdom.dom = null;
      break;
    }
    case Type.TEXT: {
      vdom.dom?.remove();
      vdom.dom = null;
      break;
    }
    case Type.COMPONENT: {
      for (const child of vdom.comp?.rendered || []) unmount(child);
      vdom.comp = undefined;
      break;
    }
  }
}

function collectDoms(vdom: VDOM, out: any[] = []): any[] {
  if (!vdom) return out;
  if (vdom.type === Type.ELEMENT || vdom.type === Type.TEXT) {
    if (vdom.dom) out.push(vdom.dom);
  } else if (vdom.type === Type.COMPONENT) {
    for (const c of vdom.comp?.rendered || []) collectDoms(c, out);
  }
  return out;
}

// Keep-alive helpers: detach removes a subtree's DOM from the document but
// keeps the vdom (Frame + .dom refs) intact so it can be reattached later.
function detach(vdom: VDOM) {
  for (const d of collectDoms(vdom)) d.remove();
}

function reattach(parentDom: any, vdom: VDOM, anchor: any = null) {
  for (const d of collectDoms(vdom)) parentDom.insertBefore(d, anchor);
}

function sameNode(a: VDOM, b: VDOM): boolean {
  return a.type === b.type && a.tag === b.tag && a.key === b.key;
}

function patch(
  parentDom: any,
  prev: VDOM,
  next: VDOM,
  anchor: any = null,
): VDOM {
  switch (prev.type) {
    case Type.TEXT: {
      if (prev.props.value !== next.props.value) {
        prev.props.value = next.props.value;
        if (prev.dom) prev.dom.nodeValue = String(next.props.value);
      }
      return prev;
    }
    case Type.EXEC: {
      if (next.call) effects.push(next.call);
      prev.call = next.call;
      return prev;
    }
    case Type.COMPONENT: {
      const frame = prev.comp as Frame;
      frame.parentDom = parentDom;
      prev.props = next.props;
      prev.children = next.children;
      const prevRendered = frame.rendered;
      renderComponent(prev);
      frame.rendered = reconcileChildren(
        parentDom,
        prevRendered,
        frame.rendered,
        anchor,
      );
      return prev;
    }
    default: {
      patchProps(prev, next);
      prev.children = reconcileChildren(
        prev.dom,
        prev.children || [],
        next.children || [],
      );
      return prev;
    }
  }
}

function reconcileChildren(
  parentDom: any,
  prevs: any,
  nexts: any,
  anchor: any = null,
): VDOM[] {
  prevs = (prevs || []).filter(Boolean);
  nexts = nexts || [];

  const keyedPrev = new Map<any, VDOM>();
  for (const p of prevs) if (p.key != null) keyedPrev.set(p.key, p);

  const matched = new Set<VDOM>();
  const pairs: [VDOM | null, VDOM][] = [];
  let cursor = 0;

  for (const next of nexts) {
    let prev: VDOM | null = null;
    if (next.key != null && keyedPrev.has(next.key)) {
      const cand = keyedPrev.get(next.key)!;
      if (sameNode(cand, next)) {
        prev = cand;
        matched.add(cand);
      }
    } else {
      while (cursor < prevs.length) {
        const cand = prevs[cursor++];
        if (matched.has(cand) || cand.key != null) continue;
        if (sameNode(cand, next)) {
          prev = cand;
          matched.add(cand);
        }
        break;
      }
    }
    pairs.push([prev, next]);
  }

  for (const p of prevs) if (!matched.has(p)) unmount(p);

  const result: VDOM[] = new Array(pairs.length);
  let cur = anchor;
  for (let i = pairs.length - 1; i >= 0; i--) {
    const [prev, next] = pairs[i];
    let node: VDOM;
    if (prev) node = patch(parentDom, prev, next, cur);
    else {
      mount(parentDom, next, cur);
      node = next;
    }
    result[i] = node;
    const doms = collectDoms(node);
    for (let j = doms.length - 1; j >= 0; j--) {
      const d = doms[j];
      if (d.nextSibling !== cur) parentDom.insertBefore(d, cur);
      cur = d;
    }
  }
  return result;
}

function reconciliate(prev: VDOM, next: VDOM) {
  if (sameNode(prev, next)) patch(prev.dom?.parentNode || null, prev, next);
}

const dirty = new Set<Frame>();
let scheduled = false;

function scheduleRender(frame: Frame) {
  dirty.add(frame);
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(flushRenders);
}

function flushRenders() {
  scheduled = false;
  const frames = [...dirty];
  dirty.clear();
  for (const frame of frames) rerender(frame);
  flushEffects();
}

function rerender(frame: Frame) {
  const node = frame.node;
  if (!node || !node.comp) return;
  const prevRendered = frame.rendered;
  const doms: any[] = [];
  for (const r of prevRendered || []) collectDoms(r, doms);
  const anchor = doms.length ? doms[doms.length - 1].nextSibling : null;
  renderComponent(node);
  frame.rendered = reconcileChildren(
    frame.parentDom,
    prevRendered,
    frame.rendered,
    anchor,
  );
}

function flushEffects() {
  const fx = effects;
  effects = [];
  for (const fn of fx) {
    try {
      fn?.();
    } catch (error) {
      console.error("exec error:", error);
    }
  }
}

let globalVODM: VDOM | null = null;
function display(vdom: VDOM) {
  if (!globalVODM) {
    mount(null, vdom, null);
    globalVODM = vdom;
  } else {
    patch(null, globalVODM, vdom);
  }
  flushEffects();
  return globalVODM;
}

const State = (
  initValue: any,
): [() => any, (value: any) => void] => {
  const frame = curr_comp as Frame;
  const index = frame.index;
  const states = frame.states;

  if (states[index] === undefined) states[index] = initValue;

  const getter = () => states[index];
  const setter = (value: any) => {
    states[index] = value;
    scheduleRender(frame);
  };
  frame.index++;
  return [getter, setter];
};

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

const Routes: { [path: string]: Function } = {};

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

function setRoute(path: string, call: Function) {
  Routes[path] = call;
}

function matchRoute(path: string): {
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

function getRoute(path = window.location.pathname) {
  return matchRoute(path).fn;
}

function getRouteParams(path = window.location.pathname) {
  return matchRoute(path).params;
}

function setRoutes(currRoutes: { [path: string]: Function }) {
  resetRoutes();
  Object.keys(currRoutes).forEach((key) =>
    setRoute(cleanPath(key), currRoutes[key]),
  );
}

let navigate_handler: Function | null = null;

export function onNavigate(callback: Function) {
  navigate_handler = callback;
}

function normalizePath(path: string) {
  if (!path || path == "") return "/";
  path = path.replace(/^\s+|\s+$/gm, "");
  if (!path.startsWith("/") && !path.startsWith("./")) path = "/" + path;
  path = path.replace(/\/{2,}/g, "/");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path;
}

function getParams() {
  const res: Record<string, string> = {};
  const urlParams = new URLSearchParams(window.location.search);
  for (const [key, value] of urlParams) res[key] = value;
  return res;
}

function setQuery(key: string, value: any) {
  const url = new URL(window.location.href);
  const urlParams = url.searchParams;
  if (value === null || value === undefined) urlParams.delete(key);
  else urlParams.set(key, value);
  window.history.replaceState({}, "", `${url.pathname}?${urlParams}`);
}

// KEEP-ALIVE — opt-in per route; cache the route instance (Frame + DOM) so
// navigating away and back resumes its state instead of remounting fresh.
const KeepAlive = new Set<string>();

function setKeepAlive(map: { [path: string]: any }) {
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

// Keyed by full path (not pattern) so dynamic routes (/blog/a vs /blog/b)
// keep separate cached instances; membership in KeepAlive is checked by pattern.
let currentPattern: string | null = null;
let currentPath: string | null = null;

function showRoute(fn: Function, props: Props, pattern: string, path: string) {
  const rootDom = document.getElementById("root");

  // First render: mount via display.
  if (!globalVODM) {
    display(e("root", null, e(fn, props)));
    currentPattern = pattern;
    currentPath = path;
    return;
  }

  const rootVdom = globalVODM;
  const prevNode = (rootVdom.children || [])[0];

  // outgoing route: cache it (keep-alive) or destroy it
  if (prevNode) {
    if (currentPattern && currentPath && KeepAlive.has(currentPattern)) {
      scrollCache[currentPath] = window.scrollY;
      detach(prevNode);
      cachePut(currentPath, prevNode);
    } else {
      unmount(prevNode);
    }
  }

  // incoming route: restore from cache or mount fresh
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

function refresh(extra: any = null) {
  if (navigate_handler) navigate_handler();
  const path = normalizePath(window.location.pathname || "*");
  const { fn, params: routeParams, pattern } = matchRoute(path);
  const props = { ...routeParams, ...getParams(), ...(extra || {}) };
  showRoute(fn, props, pattern, path);
}

function navigate(route: string, params: Record<string, any> = {}) {
  route = normalizePath(route);
  if (Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    route = `${route}?${queryString}`;
  }
  window.history.pushState({}, "", route);
  return refresh();
}

const useNavigate = () => navigate;

function setEventListeners() {
  window.addEventListener("DOMContentLoaded", () => Ura.refresh());
  window.addEventListener("popstate", () => Ura.refresh());
}

function handleCSSUpdate(filename: string) {
  const path = normalizePath(filename);
  let found = false;
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link: any) => {
    const linkUri = new URL(link.href).pathname;
    if (linkUri === path) {
      found = true;
      const newLink = link.cloneNode();
      newLink.href = link.href.split("?")[0] + "?t=" + new Date().getTime();
      link.parentNode.replaceChild(newLink, link);
      return;
    }
  });
  if (!found) loadCSS(path);
}

function sync() {
  const es = new EventSource("/__ura/reload");
  es.onmessage = (message) => {
    const event = JSON.parse(message.data);
    if (event.action === "reload") {
      window.location.reload();
    } else if (event.action === "update") {
      if (event.ext === ".css") handleCSSUpdate(event.pathname);
      else window.location.reload();
    }
  };
}

function setStyles(list: string[]) {
  list.forEach((elem) => handleCSSUpdate(elem));
}

function start() {
  setEventListeners();
  // @ts-ignore
  if (window.mode !== "prod") {
    console.log(Ura.Routes);
    if (window.location.protocol === "http:") sync();
  }
}

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
  document.cookie = domain ? `${name}=; path=${path}; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT` : base;
}

function getCurrentRoute() {
  return normalizePath(window.location.pathname || "*");
}

function In(path: string) {
  return normalizePath(path) === getCurrentRoute();
}

const Ura = {
  e,
  fr,
  setRoute,
  getRoute,
  getRouteParams,
  matchRoute,
  display,
  sync,
  loadCSS,
  State,
  Routes,
  reconciliate,
  deepEqual,
  normalizePath,
  refresh,
  navigate,
  useNavigate,
  setRoutes,
  setStyles,
  In,
  start,
  getCookie,
  setCookie,
  rmCookie,
  onNavigate,
  getParams,
  setQuery,
  getCurrentRoute,
  setKeepAlive,
};

export {
  State,
  e,
  fr,
  navigate,
  useNavigate,
  getParams,
  getRouteParams,
  setQuery,
  getCurrentRoute,
  In,
  setKeepAlive,
};
export { Ura };
export default Ura;
