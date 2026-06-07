import Ura, { State } from "ura";
import Navbar from "../../components/Navbar.js";
import Card from "../../components/Card.js";

function Effects() {
  document.title = "UraJS — Effects";
  const [tick, setTick] = State(0);
  const [draft, setDraft] = State("");
  const [saved, setSaved] = State(Ura.getCookie("ura_demo") || "");

  const save = () => {
    Ura.setCookie("ura_demo", draft());
    setSaved(draft());
  };
  const clear = () => {
    Ura.rmCookie("ura_demo");
    setSaved("");
  };

  return (
    <div className="page">
      <Navbar />
      <main className="container">
        <h1 className="title">Effects</h1>

        <Card
          title="exec — run a side effect after render"
          desc="The <exec> tag runs a function after the DOM is in place. This one keeps the browser tab title in sync with the tick."
        >
          <div className="row">
            <span className="big">{tick()}</span>
            <button className="btn" onclick={() => setTick(tick() + 1)}>
              tick +1
            </button>
          </div>
          <exec call={() => document.title = `UraJS — tick ${tick()}`} />
          <p className="muted">Watch the browser tab title update on each tick.</p>
        </Card>

        <Card
          title="Cookies"
          desc="getCookie / setCookie / rmCookie. Save a value, then reload — it persists."
        >
          <div className="row">
            <input
              className="input"
              placeholder="value to store"
              value={draft()}
              oninput={(e) => setDraft(e.target.value)}
            />
            <button className="btn" onclick={save}>
              Save
            </button>
            <button className="btn ghost" onclick={clear}>
              Clear
            </button>
          </div>
          <p className="muted">
            <ura-if cond={saved().length > 0}>
              Stored cookie: <b>{saved()}</b>
            </ura-if>
            <ura-else>No cookie set.</ura-else>
          </p>
        </Card>
      </main>
    </div>
  );
}

export default Effects;
