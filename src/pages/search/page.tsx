import Ura, { State } from "ura";
import Navbar from "../../components/Navbar.js";
import Card from "../../components/Card.js";

const fruits = [
  "Apple", "Banana", "Cherry", "Date", "Grape", "Mango", "Orange", "Pear",
];

function Search() {
  document.title = "UraJS — Search";
  const [q, setQ] = State(Ura.getParams().q || "");

  const onInput = (e) => {
    const v = e.target.value;
    setQ(v);
    Ura.setQuery("q", v || null);
  };

  const results = () =>
    fruits.filter((f) => f.toLowerCase().includes(q().toLowerCase()));

  return (
    <div className="page">
      <Navbar />
      <main className="container">
        <h1 className="title">Search</h1>
        <Card
          title="URL query params"
          desc="Typing updates ?q= in the address bar (setQuery). Reload keeps your query (getParams)."
        >
          <input
            className="input"
            placeholder="Filter fruits…"
            value={q()}
            oninput={onInput}
          />
          <p className="muted">
            Current query: <code>?q={q() || ""}</code>
          </p>
          <ul className="list">
            <ura-loop on={results()}>
              {(f) => (
                <li key={f} className="list-item">
                  <span className="grow">{f}</span>
                </li>
              )}
            </ura-loop>
          </ul>
          <ura-if cond={results().length === 0}>
            <p className="muted">No matches.</p>
          </ura-if>
        </Card>
      </main>
    </div>
  );
}

export default Search;
