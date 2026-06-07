import Ura, { State } from "ura";
import Navbar from "../../components/Navbar.js";
import Card from "../../components/Card.js";
import Counter from "../../components/Counter.js";

let nextId = 4;

function Loops() {
  document.title = "UraJS — Loops";
  const [items, setItems] = State([
    { id: 1, label: "Apple" },
    { id: 2, label: "Banana" },
    { id: 3, label: "Cherry" },
  ]);

  const add = () => {
    const id = nextId++;
    setItems([...items(), { id, label: "Item " + id }]);
  };
  const remove = (id) => setItems(items().filter((it) => it.id !== id));
  const shuffle = () => setItems([...items()].sort(() => Math.random() - 0.5));

  return (
    <div className="page">
      <Navbar />
      <main className="container">
        <h1 className="title">Loops</h1>

        <Card
          title="ura-loop with keys"
          desc="Every row owns a Counter. Bump some counters, then Shuffle — keyed reconciliation keeps each counter's value glued to its row instead of its position."
        >
          <div className="row">
            <button className="btn" onclick={add}>
              Add
            </button>
            <button className="btn ghost" onclick={shuffle}>
              Shuffle
            </button>
          </div>

          <ul className="list">
            <ura-loop on={items()}>
              {(item) => (
                <li key={item.id} className="list-item">
                  <span className="tag">#{item.id}</span>
                  <span className="grow">{item.label}</span>
                  <Counter start={item.id} />
                  <button
                    className="btn ghost"
                    onclick={() => remove(item.id)}
                  >
                    Remove
                  </button>
                </li>
              )}
            </ura-loop>
          </ul>

          <ura-if cond={items().length === 0}>
            <p className="muted">List is empty — add something.</p>
          </ura-if>
        </Card>
      </main>
    </div>
  );
}

export const keepAlive = true;
export default Loops;
