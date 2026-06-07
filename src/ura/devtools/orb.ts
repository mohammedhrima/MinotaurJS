// UraJS dev orb — a draggable, dev-only control panel. Self-contained (no
// framework runtime), loaded from index.html only when window.mode === "dev".

type Comp = { name: string; scope: string };
type State = {
  mode: string;
  config: Record<string, any>;
  configComplete: boolean;
  routes: string[];
  components: Comp[];
};

const POS_KEY = "ura.orb.pos";
const OPEN_KEY = "ura.orb.open";
const TAB_KEY = "ura.orb.tab";

const GEAR =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>' +
  '<circle cx="12" cy="12" r="3"/></svg>';

let state: State | null = null;
let activeTab = localStorage.getItem(TAB_KEY) || "setup";
let buildLines: string[] = [];
let building = false;

let root: any, body: any, logEl: any;

function h(tag: string, attrs: any = {}, ...kids: any[]): any {
  const el: any = document.createElement(tag);
  for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v;
    else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid instanceof Node ? kid : String(kid));
  }
  return el;
}

const j = (r: any) => r.json();
const getState = (): Promise<State> => fetch("/__ura/state").then(j);
const send = (method: string, path: string, b?: any) =>
  fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(b || {}),
  }).then(j);

async function refresh() {
  state = await getState();
  render();
}

function field(label: string, control: any) {
  return h(
    "label",
    { class: "ura-field" },
    h("span", { class: "ura-flabel" }, label),
    control,
  );
}

function seg(value: string, options: string[][], onPick: (v: string) => void) {
  const wrap = h("div", { class: "ura-seg" });
  for (const [val, label] of options) {
    const b = h(
      "button",
      {
        class: "ura-seg-btn" + (value === val ? " active" : ""),
        onclick: () => {
          onPick(val);
          for (const c of wrap.children) c.classList.remove("active");
          b.classList.add("active");
        },
      },
      label,
    );
    wrap.append(b);
  }
  return wrap;
}

function renderSetup() {
  const c: any = { ...(state!.config || {}) };
  const wrap = h("div", { class: "ura-form" });
  if (!state!.configComplete)
    wrap.append(h("div", { class: "ura-hint" }, "Finish setup to start the app."));
  wrap.append(
    field(
      "TypeScript",
      seg(c.typescript ?? "enable", [["enable", "Yes"], ["disable", "No"]], (v) => (c.typescript = v)),
    ),
  );
  wrap.append(
    field(
      "Directory routing",
      seg(c.dirRouting ?? "enable", [["enable", "Yes"], ["disable", "No"]], (v) => (c.dirRouting = v)),
    ),
  );
  wrap.append(
    field(
      "Default route",
      h("input", {
        class: "ura-input",
        value: c.defaultRoute ?? "home",
        oninput: (e: any) => (c.defaultRoute = e.target.value),
      }),
    ),
  );
  const styling = h("select", {
    class: "ura-select",
    onchange: (e: any) => (c.styling = e.target.value),
  });
  for (const s of ["CSS", "SCSS", "Tailwind CSS"])
    styling.append(h("option", { value: s, selected: (c.styling ?? "CSS") === s }, s));
  wrap.append(field("Styling", styling));
  wrap.append(
    field(
      "Port",
      h("input", {
        class: "ura-input",
        type: "number",
        value: c.port ?? 17000,
        oninput: (e: any) => (c.port = e.target.value),
      }),
    ),
  );
  const status = h("div", { class: "ura-hint" });
  const save = h(
    "button",
    {
      class: "ura-btn primary",
      onclick: async () => {
        save.setAttribute("disabled", "");
        status.textContent = "Saving…";
        try {
          state = await send("POST", "/__ura/config", c);
          status.textContent = "Saved.";
          render();
        } catch {
          status.textContent = "Failed.";
          save.removeAttribute("disabled");
        }
      },
    },
    "Save configuration",
  );
  wrap.append(h("div", { class: "ura-actions" }, save), status);
  return wrap;
}

function renderRoutes() {
  const wrap = h("div", { class: "ura-form" });
  const list = h("div", { class: "ura-list" });
  if (!state!.routes.length)
    list.append(h("div", { class: "ura-empty" }, "No routes yet."));
  for (const path of state!.routes) {
    const actions = h("div", { class: "ura-item-actions" });
    if (!path.includes(":"))
      actions.append(
        h("button", { class: "ura-btn ghost", onclick: () => (location.href = path) }, "open"),
      );
    actions.append(
      h(
        "button",
        {
          class: "ura-btn danger",
          onclick: async () => {
            if (!confirm(`Delete route ${path}? This removes its folder.`)) return;
            await send("DELETE", "/__ura/route", { path });
            refresh();
          },
        },
        "delete",
      ),
    );
    list.append(
      h("div", { class: "ura-item" }, h("span", { class: "ura-item-label" }, path), actions),
    );
  }
  wrap.append(list);
  const input = h("input", { class: "ura-input", placeholder: "reads/:slug" });
  const add = h(
    "button",
    {
      class: "ura-btn primary",
      onclick: async () => {
        const p = input.value.trim();
        if (!p) return;
        const r = await send("POST", "/__ura/route", { path: p });
        if (r.ok === false) return alert(r.error || "failed");
        input.value = "";
        refresh();
      },
    },
    "Create",
  );
  wrap.append(
    h(
      "div",
      { class: "ura-sticky" },
      h("div", { class: "ura-new" }, input, add),
      h("div", { class: "ura-hint" }, "Use :param for dynamic segments, e.g. blog/:id."),
    ),
  );
  return wrap;
}

function renderComponents() {
  const wrap = h("div", { class: "ura-form" });
  const list = h("div", { class: "ura-list" });
  if (!state!.components.length)
    list.append(h("div", { class: "ura-empty" }, "No components yet."));
  for (const c of state!.components) {
    const label = c.scope ? `${c.name}  ·  ${c.scope}` : c.name;
    list.append(h("div", { class: "ura-item" }, h("span", { class: "ura-item-label" }, label)));
  }
  wrap.append(list);

  const name = h("input", { class: "ura-input", placeholder: "Component name, e.g. Card" });
  const scope = h("select", { class: "ura-select" });
  scope.append(h("option", { value: "" }, "Global"));
  for (const r of state!.routes)
    if (!r.includes(":")) scope.append(h("option", { value: r.replace(/^\//, "") }, r));
  const add = h(
    "button",
    {
      class: "ura-btn primary",
      onclick: async () => {
        const n = name.value.trim();
        if (!n) return;
        const r = await send("POST", "/__ura/component", {
          name: n,
          scope: scope.value || undefined,
        });
        if (r.ok === false) return alert(r.error || "failed");
        name.value = "";
        refresh();
      },
    },
    "Create",
  );
  wrap.append(
    h(
      "div",
      { class: "ura-sticky" },
      field("New component", name),
      h("div", { class: "ura-new" }, scope, add),
      h(
        "div",
        { class: "ura-hint" },
        "Global lives in src/components; scoped lives beside its route.",
      ),
    ),
  );
  return wrap;
}

function renderBuild() {
  const wrap = h("div", { class: "ura-form" });
  const opt = h("input", { type: "checkbox", class: "ura-check" });
  const run = h(
    "button",
    {
      class: "ura-btn primary",
      onclick: async () => {
        if (building) return;
        building = true;
        buildLines = [];
        render();
        await send("POST", "/__ura/build", { optimize: opt.checked });
      },
    },
    building ? "Building…" : "Run build",
  );
  if (building) run.setAttribute("disabled", "");
  wrap.append(
    h(
      "div",
      { class: "ura-actions" },
      run,
      h("label", { class: "ura-checkrow" }, opt, h("span", {}, "Optimize")),
    ),
  );
  logEl = h("pre", { class: "ura-log" }, buildLines.join("\n"));
  wrap.append(logEl);
  return wrap;
}

function render() {
  if (!state) return;
  const locked = !state.configComplete; 
  if (locked) activeTab = "setup";
  for (const t of root.querySelectorAll(".ura-tab")) {
    t.classList.toggle("active", t.dataset.tab === activeTab);
    t.classList.toggle("disabled", locked && t.dataset.tab !== "setup");
  }
  body.innerHTML = "";
  logEl = null;
  body.append(
    activeTab === "routes"
      ? renderRoutes()
      : activeTab === "components"
        ? renderComponents()
        : activeTab === "build"
          ? renderBuild()
          : renderSetup(),
  );
}

function appendLog(line: string) {
  buildLines.push(line);
  if (logEl) {
    logEl.textContent += (logEl.textContent ? "\n" : "") + line;
    logEl.scrollTop = logEl.scrollHeight;
  }
}

function connectSSE() {
  const es = new EventSource("/__ura/reload");
  es.onmessage = (ev: any) => {
    let d: any;
    try {
      d = JSON.parse(ev.data);
    } catch {
      return;
    }
    if (d.action === "build-log") appendLog(d.line);
    else if (d.action === "build-done") {
      building = false;
      buildLines.push(`● build ${d.code === 0 ? "complete" : "failed (" + d.code + ")"}`);
      if (activeTab === "build") render();
    } else if (d.action === "reload") location.reload();
  };
}

function toggle(open?: boolean) {
  const next = open ?? !root.classList.contains("open");
  root.classList.toggle("open", next);
  localStorage.setItem(OPEN_KEY, next ? "1" : "0");
}

function applyPos() {
  try {
    const p = JSON.parse(localStorage.getItem(POS_KEY) || "null");
    if (p) {
      root.style.left = p.left + "px";
      root.style.top = p.top + "px";
      root.style.right = "auto";
      root.style.bottom = "auto";
    }
  } catch {}
}

function wireDrag(handle: any) {
  let sx = 0, sy = 0, ox = 0, oy = 0, moved = false, dragging = false;
  handle.addEventListener("pointerdown", (e: any) => {
    dragging = true;
    moved = false;
    sx = e.clientX;
    sy = e.clientY;
    const r = root.getBoundingClientRect();
    ox = r.left;
    oy = r.top;
    root.style.left = ox + "px";
    root.style.top = oy + "px";
    root.style.right = "auto";
    root.style.bottom = "auto";
    handle.setPointerCapture(e.pointerId);
    root.classList.add("dragging");
  });
  handle.addEventListener("pointermove", (e: any) => {
    if (!dragging) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
    root.style.left = Math.max(8, Math.min(window.innerWidth - 60, ox + dx)) + "px";
    root.style.top = Math.max(8, Math.min(window.innerHeight - 60, oy + dy)) + "px";
  });
  handle.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    root.classList.remove("dragging");
    const r = root.getBoundingClientRect();
    localStorage.setItem(POS_KEY, JSON.stringify({ left: r.left, top: r.top }));
    if (!moved) toggle();
  });
}

async function init() {
  if ((window as any).mode !== "dev") return;
  if (document.getElementById("ura-orb-root")) return;

  if (!document.getElementById("ura-orb-css"))
    document.head.append(
      h("link", { id: "ura-orb-css", rel: "stylesheet", href: "/ura/devtools/orb.css" }),
    );

  root = h("div", { id: "ura-orb-root", class: "ura-root" });
  const orb = h("button", { class: "ura-orb", "aria-label": "UraJS dev tools", html: GEAR });
  const tip = h("span", { class: "ura-tip" }, "Click to open · drag to move me");
  const head = h(
    "div",
    { class: "ura-panel-head" },
    h("span", { class: "ura-title" }, h("b", {}, "Ura"), "JS", h("span", { class: "ura-title-tag" }, "dev")),
    h("button", { class: "ura-close", title: "Collapse", onclick: () => toggle(false) }, "×"),
  );
  const tabs = h(
    "div",
    { class: "ura-tabs" },
    ...[
      ["setup", "Setup"],
      ["routes", "Routes"],
      ["components", "Components"],
      ["build", "Build"],
    ].map(([id, label]) =>
      h(
        "button",
        {
          class: "ura-tab",
          "data-tab": id,
          onclick: () => {
            if (id !== "setup" && !state?.configComplete) return;
            activeTab = id;
            localStorage.setItem(TAB_KEY, id);
            render();
          },
        },
        label,
      ),
    ),
  );
  body = h("div", { class: "ura-body" });
  root.append(h("div", { class: "ura-panel" }, head, tabs, body), orb, tip);
  document.body.append(root);

  applyPos();
  wireDrag(orb);
  connectSSE();

  try {
    await refresh();
  } catch {}

  if (state && !state.configComplete) {
    activeTab = "setup";
    render();
    toggle(true);
  } else if (localStorage.getItem(OPEN_KEY) === "1") {
    toggle(true);
  }
}

init();
