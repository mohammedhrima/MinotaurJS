// Public entry for the framework. Internals live in ./core/*; this barrel
// assembles the `Ura` object and re-exports the public API. Imported as "ura".
import { e, fr } from "./core/vdom.js";
import { State, display, reconciliate } from "./core/render.js";
import { deepEqual, loadCSS } from "./core/utils.js";
import {
  setRoute,
  getRoute,
  getRouteParams,
  matchRoute,
  Routes,
  refresh,
  navigate,
  useNavigate,
  setRoutes,
  In,
  getParams,
  setQuery,
  getCurrentRoute,
  setKeepAlive,
  onNavigate,
  normalizePath,
} from "./core/router.js";
import { getCookie, setCookie, rmCookie } from "./core/cookies.js";
import { sync, setStyles, start } from "./core/live.js";

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
  onNavigate,
  getCookie,
  setCookie,
  rmCookie,
};
export { Ura };
export default Ura;
