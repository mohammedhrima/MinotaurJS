import Ura, { State } from "ura";
import Navbar from "../../components/Navbar.js";

const COOKIE = "ura_notes";
let nextId = Date.now();

function load() {
  try {
    return JSON.parse(Ura.getCookie(COOKIE) || "[]");
  } catch {
    return [];
  }
}

function Notes() {
  const [notes, setNotes] = State(load());
  const [draft, setDraft] = State("");
  const [q, setQ] = State(Ura.getParams().q || "");

  const commit = (list) => {
    setNotes(list);
    Ura.setCookie(COOKIE, JSON.stringify(list));
  };
  const add = () => {
    const text = draft().trim();
    if (!text) return;
    commit([{ id: nextId++, text, pinned: false }, ...notes()]);
    setDraft("");
  };
  const remove = (id) => commit(notes().filter((n) => n.id !== id));
  const pin = (id) =>
    commit(notes().map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));

  const onSearch = (e) => {
    const v = e.target.value;
    setQ(v);
    Ura.setQuery("q", v || null);
  };

  const visible = () => {
    const term = q().toLowerCase();
    return notes()
      .filter((n) => n.text.toLowerCase().includes(term))
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  };

  return (
    <div className="page">
      <Navbar />
      <main className="container">
        <section className="reveal">
          <h1 className="title">Notes</h1>
          <p className="section-lead">
            A real little app — keyed lists, a search synced to the URL, cookie
            persistence, and keep-alive. Add a note, wander off to another page,
            come back: it is exactly where you left it. Reload the tab: still
            there.
          </p>
        </section>

        <div className="card reveal">
          <div className="row">
            <input
              className="input"
              placeholder="Write a note and press Enter"
              value={draft()}
              oninput={(e) => setDraft(e.target.value)}
              onkeyup={(e) => e.key === "Enter" && add()}
            />
            <button className="btn" onclick={add}>
              Add
            </button>
          </div>
          <input
            className="input"
            placeholder="Search notes"
            value={q()}
            oninput={onSearch}
          />
        </div>

        <section className="reveal">
          <ura-if cond={visible().length === 0}>
            <div className="card">
              <p className="muted">
                <ura-if cond={notes().length === 0}>
                  No notes yet — write your first one above.
                </ura-if>
                <ura-else>Nothing matches that search.</ura-else>
              </p>
            </div>
          </ura-if>
          <ura-else>
            <ul className="list">
              <ura-loop on={visible()}>
                {(n) => (
                  <li
                    key={n.id}
                    className={n.pinned ? "list-item pinned" : "list-item"}
                  >
                    <button className="btn ghost" onclick={() => pin(n.id)}>
                      <ura-if cond={n.pinned}>Pinned</ura-if>
                      <ura-else>Pin</ura-else>
                    </button>
                    <span className="grow">{n.text}</span>
                    <button className="btn ghost" onclick={() => remove(n.id)}>
                      Remove
                    </button>
                  </li>
                )}
              </ura-loop>
            </ul>
          </ura-else>
        </section>
      </main>
    </div>
  );
}

export default {
  page: Notes,
  route: "/notes",
  title: "UraJS — Notes",
  keepAlive: true,
};
