import { deepEqual, svgElements } from "./utils.js";
import { VDOM } from "./types.js";

export const SVG_NS = "http://www.w3.org/2000/svg";

export function addListener(dom: any, key: string, fn: any) {
  const ev = key.slice(2).toLowerCase();
  if (ev === "hover") {
    dom.addEventListener("mouseover", fn);
    dom.addEventListener("mouseout", fn);
  } else dom.addEventListener(ev, fn);
}

export function removeListener(dom: any, key: string, fn: any) {
  const ev = key.slice(2).toLowerCase();
  if (ev === "hover") {
    dom.removeEventListener("mouseover", fn);
    dom.removeEventListener("mouseout", fn);
  } else dom.removeEventListener(ev, fn);
}

export function applyStyle(dom: any, style: any) {
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

export function setAttr(vdom: VDOM, key: string, value: any) {
  const dom = vdom.dom;
  if (key === "class") {
    console.warn("use 'className' instead of 'class'", vdom);
    key = "className";
  }
  if (svgElements.has(vdom.tag as string)) {
    dom.setAttribute(key === "className" ? "class" : key, value);
  } else {
    if ((key === "value" || key === "checked") && dom[key] === value) return;
    dom[key] = value;
  }
}

export function applyAllProps(vdom: VDOM) {
  const props = vdom.props || {};
  for (const key of Object.keys(props)) {
    if (key === "key") continue;
    if (key.startsWith("on")) addListener(vdom.dom, key, props[key]);
    else if (key === "style") applyStyle(vdom.dom, props[key]);
    else setAttr(vdom, key, props[key]);
  }
}

export function patchProps(prev: VDOM, next: VDOM) {
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

export function createElementDom(vdom: VDOM): boolean {
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
