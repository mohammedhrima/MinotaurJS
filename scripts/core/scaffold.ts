import { ura } from "./logger.ts";
import { config } from "./config.ts";
import { render } from "./template.ts";
import { deriveNames } from "./names.ts";

function vars(raw: string) {
  const isTS = config.typescript === "enable";
  const { Name, className, title } = deriveNames(raw);
  return {
    name: raw,
    Name,
    className,
    title,
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
  kind: "layout" | "component",
): string => {
  if (config.styling === "Tailwind CSS") return "";
  return render(
    kind === "layout" ? "style-layout.tpl" : "style-component.tpl",
    vars(name),
  );
};
