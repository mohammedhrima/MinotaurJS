import Ura, { State } from "ura";
import Navbar from "../../components/Navbar.js";
import Card from "../../components/Card.js";

function Conditions() {
  document.title = "UraJS — Conditions";
  const [score, setScore] = State(75);
  const [show, setShow] = State(true);

  const grade = () => {
    const s = score();
    return s >= 90 ? "A" : s >= 70 ? "B" : s >= 50 ? "C" : "F";
  };

  return (
    <div className="page">
      <Navbar />
      <main className="container">
        <h1 className="title">Conditions</h1>

        <Card title="ura-if / ura-elif / ura-else">
          <div className="row">
            <button
              className="btn"
              onclick={() => setScore(Math.max(0, score() - 10))}
            >
              -10
            </button>
            <span className="big">{score()}</span>
            <button
              className="btn"
              onclick={() => setScore(Math.min(100, score() + 10))}
            >
              +10
            </button>
          </div>
          <div className="banner">
            <ura-if cond={score() >= 90}>Excellent — top marks.</ura-if>
            <ura-elif cond={score() >= 70}>Good, keep going.</ura-elif>
            <ura-elif cond={score() >= 50}>
              Passing, but room to improve.
            </ura-elif>
            <ura-else>Failing — let's review.</ura-else>
          </div>
          <p className="muted">Ternary expression for grade: {grade()}</p>
        </Card>

        <Card title="Toggle (mount / unmount)">
          <button className="btn" onclick={() => setShow(!show())}>
            {show() ? "Hide" : "Show"} details
          </button>
          <ura-if cond={show()}>
            <p className="muted">
              This paragraph is mounted only while shown, and removed from the
              DOM when hidden.
            </p>
          </ura-if>
        </Card>
      </main>
    </div>
  );
}

export default Conditions;
