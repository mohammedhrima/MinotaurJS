import { Type, deepCopy } from "./utils.js";
import { VDOM, Props, Tag, Frame } from "./types.js";

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
export let curr_comp: Frame | null = null;

export function e(tag: Tag, props: any = {}, ...children: any): any {
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

export function fr(_props: Props = {}, ...children: any) {
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

export function renderComponent(node: VDOM): void {
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
