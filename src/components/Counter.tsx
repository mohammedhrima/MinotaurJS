import Ura, { State } from "ura";

function Counter(props) {
  const [n, setN] = State(props.start ?? 0);
  return (
    <div className="counter">
      <button className="btn ghost" onclick={() => setN(n() - 1)}>
        -
      </button>
      <span className="counter-value">{n()}</span>
      <button className="btn ghost" onclick={() => setN(n() + 1)}>
        +
      </button>
    </div>
  );
}

export default Counter;
