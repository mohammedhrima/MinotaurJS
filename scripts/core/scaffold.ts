import { ura } from "./logger.ts";
import { config } from "./config.ts";
import { render } from "./template.ts";
import { deriveNames } from "./names.ts";

function vars(raw: string) {
  const isTS = config.typescript === "enable";
  const { Name, className, title } = deriveNames(raw);
  const route =
    "/" +
    raw
      .split("/")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.replace(/^\[(.+)\]$/, ":$1"))
      .join("/");
  return {
    name: raw,
    Name,
    className,
    title,
    route,
    tsIgnore: isTS ? "//@ts-ignore\n" : "",
    importExtras: isTS ? ", Ura, VDOM, Props" : "",
    propsType: isTS ? ": Props" : "",
    vdomType: isTS ? ": VDOM" : "",
    childrenType: isTS ? ": any" : "",
  };
}

const variant = () =>
  config.styling === "Tailwind CSS" ? "tailwind" : "plain";

export const generatePage = (name: string): string => {
  ura.log("scaffold page", name);
  return render(`page.${variant()}.tpl`, vars(name));
};

export const generateLayout = (): string =>
  render(`layout.${variant()}.tpl`, vars("layout"));

export const generateComponent = (name: string): string => {
  ura.log("scaffold component", name);
  return render(`component.${variant()}.tpl`, vars(name));
};

export const generateStyle = (
  name: string,
  kind: "layout" | "component" | "page",
): string => {
  if (config.styling === "Tailwind CSS") return "";
  const tpl =
    kind === "layout"
      ? "style-layout.tpl"
      : kind === "page"
        ? "style-page.tpl"
        : "style-component.tpl";
  return render(tpl, vars(name));
};
