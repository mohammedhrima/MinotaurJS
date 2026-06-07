export enum Type {
  ELEMENT = "element",
  COMPONENT = "component",
  TEXT = "text",
  EXEC = "exec",
}

export function loadCSS(filename: string): void {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = filename;
  document.head.appendChild(link);
}

export function deepEqual(a: any, b: any): boolean {
  if (a !== a && b !== b) return true; // NaN is the only value not equal to itself
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (a instanceof Date && b instanceof Date)
    return a.getTime() === b.getTime();
  if (a instanceof RegExp && b instanceof RegExp)
    return a.toString() === b.toString();
  if (typeof a === "function" && typeof b === "function")
    return a.toString() === b.toString();
  if (typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
}

export function deepCopy<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj) as T;
  if (obj instanceof RegExp) return new RegExp(obj) as T;
  const clone: any = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key))
      clone[key] = deepCopy(obj[key]);
  }
  return clone;
}

export const svgElements = new Set<string>([
  // structure
  "svg",
  "g",
  "defs",
  "symbol",
  "use",
  "switch",
  "view",
  "foreignObject",
  "desc",
  "metadata",
  // shapes
  "path",
  "circle",
  "rect",
  "line",
  "polyline",
  "polygon",
  "ellipse",
  // text
  "text",
  "tspan",
  "textPath",
  // images / misc
  "image",
  "marker",
  "pattern",
  "clipPath",
  "mask",
  // gradients
  "linearGradient",
  "radialGradient",
  "stop",
  // filters
  "filter",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  // animation
  "animate",
  "animateMotion",
  "animateTransform",
  "set",
  "mpath",
]);
