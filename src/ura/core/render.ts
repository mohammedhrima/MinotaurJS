import { Type } from "./utils.js";
import { VDOM, Frame } from "./types.js";
import { renderComponent, curr_comp } from "./vdom.js";
import { createElementDom, patchProps, removeListener } from "./dom.js";

let effects: Function[] = [];

export function mount(parentDom: any, vdom: VDOM, anchor: any) {
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

export function unmount(vdom: VDOM) {
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

export function collectDoms(vdom: VDOM, out: any[] = []): any[] {
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
export function detach(vdom: VDOM) {
  for (const d of collectDoms(vdom)) d.remove();
}

export function reattach(parentDom: any, vdom: VDOM, anchor: any = null) {
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

export function reconciliate(prev: VDOM, next: VDOM) {
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

export function rerender(frame: Frame) {
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

export function flushEffects() {
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

export let globalVODM: VDOM | null = null;

export function display(vdom: VDOM) {
  if (!globalVODM) {
    mount(null, vdom, null);
    globalVODM = vdom;
  } else {
    patch(null, globalVODM, vdom);
  }
  flushEffects();
  return globalVODM;
}

export const State = (initValue: any): [() => any, (value: any) => void] => {
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
