import Ura, { State } from "ura";
import Navbar from "../../components/Navbar.js";
import Card from "../../components/Card.js";

function Todos() {
  document.title = "UraJS — Todos";
  const [todos, setTodos] = State([]);
  const [draft, setDraft] = State("");

  const add = () => {
    const text = draft().trim();
    if (!text) return;
    setTodos([...todos(), { id: Date.now(), text, done: false }]);
    setDraft("");
  };
  const toggle = (id) =>
    setTodos(todos().map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id) => setTodos(todos().filter((t) => t.id !== id));
  const remaining = () => todos().filter((t) => !t.done).length;

  return (
    <div className="page">
      <Navbar />
      <main className="container">
        <h1 className="title">Todos</h1>

        <Card
          title="A small app"
          desc="Lists, keyed rows, a controlled input that keeps focus across re-renders, and a derived count."
        >
          <div className="row">
            <input
              className="input"
              placeholder="What needs to be done?"
              value={draft()}
              oninput={(e) => setDraft(e.target.value)}
              onkeyup={(e) => e.key === "Enter" && add()}
            />
            <button className="btn" onclick={add}>
              Add
            </button>
          </div>

          <ura-if cond={todos().length === 0}>
            <p className="muted">Nothing yet — add your first todo above.</p>
          </ura-if>
          <ura-else>
            <ul className="list">
              <ura-loop on={todos()}>
                {(todo) => (
                  <li
                    key={todo.id}
                    className={todo.done ? "list-item todo done" : "list-item todo"}
                  >
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onclick={() => toggle(todo.id)}
                    />
                    <span className="todo-text">{todo.text}</span>
                    <button
                      className="btn ghost"
                      onclick={() => remove(todo.id)}
                    >
                      Remove
                    </button>
                  </li>
                )}
              </ura-loop>
            </ul>
            <p className="muted">
              {remaining()} of {todos().length} remaining
            </p>
          </ura-else>
        </Card>
      </main>
    </div>
  );
}

export default Todos;
