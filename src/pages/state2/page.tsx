import Ura, { State } from "ura";
import Navbar from "../../components/Navbar.js";
import Card from "../../components/Card.js";
import Counter from "../../components/Counter.js";

function State2() {
  document.title = "UraJS — State 2";
  const [count, setCount] = State(50);
  const [note, setNote] = State("");
  const [likes, setLikes] = State(0);

  return (
    <div className="page">
      <Navbar />
      <main className="container">
        <h1 className="title">State 2</h1>

        <Card
          title="A different page with its own state"
          desc="Bump these, switch to the State tab (or anywhere), come back — this page resumes exactly where you left it, independently from State."
        >
          <div className="row">
            <button className="btn" onclick={() => setCount(count() - 5)}>
              -5
            </button>
            <span className="big">{count()}</span>
            <button className="btn" onclick={() => setCount(count() + 5)}>
              +5
            </button>
          </div>
          <div className="row">
            <button className="btn ghost" onclick={() => setLikes(likes() + 1)}>
              Like ({likes()})
            </button>
          </div>
          <input
            className="input"
            placeholder="A note that survives navigation…"
            value={note()}
            oninput={(e) => setNote(e.target.value)}
          />
          <ura-if cond={note().length > 0}>
            <p className="muted">Note: {note()}</p>
          </ura-if>
        </Card>

        <Card title="Independent counter" desc="Starts at 500 here.">
          <div className="row wrap">
            <Counter start={500} />
          </div>
        </Card>
      </main>
    </div>
  );
}

export const keepAlive = true;
export default State2;
