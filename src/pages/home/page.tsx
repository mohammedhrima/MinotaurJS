import Ura, { State, useNavigate } from "ura";
import Navbar from "../../components/Navbar.js";
import CodeBlock from "../../components/CodeBlock.js";

const GITHUB = "https://github.com/mohammedhrima/UraJS";

const stateCode = `import { State } from "ura";

function Counter() {
  const [count, setCount] = State(0);

  return (
    <button onclick={() => setCount(count() + 1)}>
      Clicked {count()} times
    </button>
  );
}`;

const ifCode = `function Toggle() {
  const [on, setOn] = State(true);

  return (
    <div>
      <button onclick={() => setOn(!on())}>Toggle</button>

      <ura-if cond={on()}>
        <p>The light is on.</p>
      </ura-if>
      <ura-else>
        <p>The light is off.</p>
      </ura-else>
    </div>
  );
}`;

const loopCode = `function List() {
  const [items, setItems] = State(["Apple", "Banana"]);
  const add = () =>
    setItems([...items(), "Item " + (items().length + 1)]);

  return (
    <ul>
      <ura-loop on={items()}>
        {(item, i) => <li key={i}>{item}</li>}
      </ura-loop>
    </ul>
  );
}`;

const startCode = `npm install
npm start                  # dev server with live reload
npm run route blog/[slug]  # scaffold a dynamic route
npm run build              # static site in out/`;

const features = [
  ["/state", "State", "Reactive state with one small hook."],
  ["/conditions", "Conditions", "ura-if, ura-elif and ura-else."],
  ["/loops", "Loops", "ura-loop with keyed reconciliation."],
  ["/todos", "Todos", "Lists, inputs and derived values."],
  ["/effects", "Effects", "Side effects with exec, plus cookies."],
  ["/blog", "Blog", "Dynamic :slug route params."],
  ["/search", "Search", "State synced to URL query params."],
  ["/svg", "SVG", "Native, reactive SVG elements."],
];

function Home() {
  document.title = "UraJS";
  const navigate = useNavigate();

  const [hero, setHero] = State(0);
  const [count, setCount] = State(0);
  const [on, setOn] = State(true);
  const [items, setItems] = State(["Apple", "Banana"]);
  const addItem = () =>
    setItems([...items(), "Item " + (items().length + 1)]);

  const explore = () =>
    document.getElementById("features").scrollIntoView({ behavior: "smooth" });

  return (
    <div className="page">
      <Navbar />
      <main className="container">
        <section className="hero">
          <span className="hero-eyebrow">Reactive UI, from scratch</span>
          <h1 className="hero-title">
            <span className="grad">UraJS</span>
          </h1>
          <p className="hero-sub">
            A small reactive UI framework built from the ground up — JSX, a tiny
            runtime, directory routing, and zero dependencies.
          </p>
          <div className="cta">
            <button className="btn lg" onclick={explore}>
              Explore features
            </button>
            <a className="btn lg outline" href={GITHUB} target="_blank">
              View on GitHub
            </a>
          </div>
          <div className="live">
            <span className="live-label">Live and reactive</span>
            <span className="counter-value">{hero()}</span>
            <button className="btn" onclick={() => setHero(hero() + 1)}>
              Add one
            </button>
          </div>
        </section>

        <section>
          <h2 className="section-title">Learn it in three examples</h2>
          <p className="section-lead">
            Every example below is running on this page. Read the code, click the
            demo, see it react.
          </p>
        </section>

        <div className="example">
          <div className="example-demo">
            <h3>State</h3>
            <p>State() returns a getter and a setter. Call the setter and the UI updates.</p>
            <button className="btn" onclick={() => setCount(count() + 1)}>
              Clicked {count()} times
            </button>
          </div>
          <CodeBlock label="counter.jsx" code={stateCode} />
        </div>

        <div className="example">
          <div className="example-demo">
            <h3>Conditions</h3>
            <p>Branch your markup with ura-if, ura-elif and ura-else.</p>
            <button className="btn ghost" onclick={() => setOn(!on())}>
              Toggle
            </button>
            <ura-if cond={on()}>
              <p className="muted">The light is on.</p>
            </ura-if>
            <ura-else>
              <p className="muted">The light is off.</p>
            </ura-else>
          </div>
          <CodeBlock label="toggle.jsx" code={ifCode} />
        </div>

        <div className="example">
          <div className="example-demo">
            <h3>Loops</h3>
            <p>ura-loop renders a list and reconciles it by key.</p>
            <button className="btn" onclick={addItem}>
              Add item
            </button>
            <ul className="list">
              <ura-loop on={items()}>
                {(item, i) => (
                  <li key={i} className="list-item">
                    <span className="grow">{item}</span>
                  </li>
                )}
              </ura-loop>
            </ul>
          </div>
          <CodeBlock label="list.jsx" code={loopCode} />
        </div>

        <section>
          <h2 className="section-title">Get started</h2>
          <p className="section-lead">
            One command to run, one to scaffold a route, one to build.
          </p>
          <CodeBlock label="terminal" code={startCode} />
        </section>

        <section id="features">
          <h2 className="section-title">Explore the framework</h2>
          <p className="section-lead">
            Each page is a focused, interactive demo of one feature.
          </p>
          <div className="grid">
            <ura-loop on={features}>
              {(f) => (
                <a
                  key={f[0]}
                  className="feature"
                  onclick={() => navigate(f[0])}
                >
                  <h3>{f[1]}</h3>
                  <p>{f[2]}</p>
                  <span className="feature-go">Open</span>
                </a>
              )}
            </ura-loop>
          </div>
        </section>

        <footer className="footer">
          Built by Mohammed Hrima ·{" "}
          <a href={GITHUB} target="_blank">
            github.com/mohammedhrima/UraJS
          </a>
        </footer>
      </main>
    </div>
  );
}

export default Home;
