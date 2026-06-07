import { loadCSS } from "./utils.js";
import { refresh, normalizePath } from "./router.js";

function setEventListeners() {
  window.addEventListener("DOMContentLoaded", () => refresh());
  window.addEventListener("popstate", () => refresh());
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

export function sync() {
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

export function setStyles(list: string[]) {
  list.forEach((elem) => handleCSSUpdate(elem));
}

export function start() {
  setEventListeners();
  // @ts-ignore
  if (window.mode !== "prod") {
    if (window.location.protocol === "http:") sync();
  }
}
