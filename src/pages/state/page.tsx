import Ura, { State } from "ura";
import Navbar from "../../components/Navbar.js";
import Card from "../../components/Card.js";
import Counter from "../../components/Counter.js";

function StatePage() {
  document.title = "UraJS — State";
  const [count, setCount] = State(0);
  const [name, setName] = State("");

  return (
    <div className="page">
      <Navbar />
      <main className="container">
        <h1 className="title">State</h1>

        <Card title="Counter" desc="A single State() value, updated immutably.">
          <div className="row">
            <button className="btn" onclick={() => setCount(count() - 1)}>
              -1
            </button>
            <span className="big">{count()}</span>
            <button className="btn" onclick={() => setCount(count() + 1)}>
              +1
            </button>
            <button className="btn ghost" onclick={() => setCount(0)}>
              reset
            </button>
          </div>
          <p className="muted">Derived value (doubled): {count() * 2}</p>
        </Card>

        <Card title="Controlled input" desc="State bound to an input value.">
          <input
            className="input"
            placeholder="Type your name"
            value={name()}
            oninput={(e) => setName(e.target.value)}
          />
          <p className="muted">
            <ura-if cond={name().length > 0}>Hello, {name()}!</ura-if>
            <ura-else>Nothing typed yet.</ura-else>
          </p>
        </Card>

        <Card
          title="Independent component state"
          desc="Each Counter owns its state — and it survives this page re-rendering whenever the counter at the top changes."
        >
          <div className="row wrap">
            <Counter start={10} />
            <Counter start={100} />
            <Counter start={1000} />
          </div>
        </Card>
      </main>
    </div>
  );
}

export const keepAlive = true;
export default StatePage;
