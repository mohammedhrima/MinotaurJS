import Ura, { State, useNavigate } from "ura";
import Navbar from "../../components/Navbar.js";
import CodeBlock from "../../components/CodeBlock.js";

const GITHUB = "https://github.com/mohammedhrima/UraJS";

const stateCode = `const [count, setCount] = State(0);

<button onclick={() => setCount(count() + 1)}>
  {count()}
</button>`;

const ifCode = `<ura-if cond={bright()}>
  <p>The room is bright.</p>
</ura-if>
<ura-else>
  <p>Lights are off.</p>
</ura-else>`;

const loopCode = `<ura-loop on={items()}>
  {(item) => <li key={item}>{item}</li>}
</ura-loop>`;

const startCode = `npm install
npm start            # dev server, live reload
npm run route notes  # scaffold a page
npm run build        # static build`;

const pages = [
  ["/notes", "Notes", "A real little app — lists, search, persistence, and state that survives navigation."],
  ["/reads", "Reads", "Directory routing with dynamic :slug pages that fetch their own data."],
  ["/play", "Play", "Reactive, generative SVG — state you can see move."],
];

function Home() {
  const navigate = useNavigate();
  const [count, setCount] = State(3);
  const [bright, setBright] = State(true);
  const [items, setItems] = State(["Reactivity", "Routing", "Keep-alive"]);
  const shuffle = () => setItems([...items()].sort(() => Math.random() - 0.5));

  return (
    <div className="page">
      <Navbar />
      <main className="container">
        <section className="hero">
          <span className="hero-eyebrow reveal">Reactive UI, from scratch</span>
          <h1 className="hero-title reveal d1">
            <span className="grad">UraJS</span>
          </h1>
          <p className="hero-sub reveal d2">
            A reactive UI framework built from nothing but functions and JSX. No
            virtual-DOM library, no dependencies — just you and the DOM.
          </p>
          <div className="cta reveal d3">
            <button className="btn lg" onclick={() => navigate("/notes")}>
              See it in action
            </button>
            <a className="btn lg outline" href={GITHUB} target="_blank">
              GitHub
            </a>
          </div>
        </section>

        <div className="example reveal">
          <div className="example-demo">
            <h3>State you can feel</h3>
            <p>
              Call the setter and only what changed re-renders. The number
              breathes every time it updates.
            </p>
          </div>
          <div className="example-demo">
            <div className="row" style={{ justifyContent: "center", gap: "18px" }}>
              <button className="btn ghost" onclick={() => setCount(count() - 1)}>
                -
              </button>
              <span key={count()} className="big pop grad">
                {count()}
              </span>
              <button className="btn" onclick={() => setCount(count() + 1)}>
                +
              </button>
            </div>
            <CodeBlock label="state" code={stateCode} />
          </div>
        </div>

        <div className="example reveal">
          <div className="example-demo">
            <div className="row">
              <button className="btn" onclick={() => setBright(!bright())}>
                Flip the switch
              </button>
            </div>
            <div className="banner">
              <ura-if cond={bright()}>The room is bright.</ura-if>
              <ura-else>Lights are off.</ura-else>
            </div>
            <CodeBlock label="conditions" code={ifCode} />
          </div>
          <div className="example-demo">
            <h3>Branches that read like markup</h3>
            <p>
              ura-if, ura-elif and ura-else mount and unmount real DOM — no
              ternary soup, no hidden nodes.
            </p>
          </div>
        </div>

        <div className="example reveal">
          <div className="example-demo">
            <h3>Lists that keep their place</h3>
            <p>
              Keyed reconciliation moves DOM and state by identity. Shuffle —
              nothing is rebuilt, everything just glides.
            </p>
          </div>
          <div className="example-demo">
            <button className="btn" onclick={shuffle}>
              Shuffle
            </button>
            <ul className="list">
              <ura-loop on={items()}>
                {(item) => (
                  <li key={item} className="list-item">
                    <span className="grow">{item}</span>
                  </li>
                )}
              </ura-loop>
            </ul>
            <CodeBlock label="loops" code={loopCode} />
          </div>
        </div>

        <section className="reveal">
          <h2 className="section-title">Start in seconds</h2>
          <p className="section-lead">
            One command to run, one to scaffold a page, one to build.
          </p>
          <CodeBlock label="terminal" code={startCode} />
        </section>

        <section className="reveal">
          <h2 className="section-title">Built with UraJS</h2>
          <p className="section-lead">
            Three small things, each a story about one idea.
          </p>
          <div className="grid">
            <ura-loop on={pages}>
              {(p) => (
                <a
                  key={p[0]}
                  className="feature tilt"
                  onclick={() => navigate(p[0])}
                >
                  <h3>{p[1]}</h3>
                  <p>{p[2]}</p>
                  <span className="feature-go">Open</span>
                </a>
              )}
            </ura-loop>
          </div>
        </section>

        <footer className="footer reveal">
          Built by Mohammed Hrima ·{" "}
          <a href={GITHUB} target="_blank">
            github.com/mohammedhrima/UraJS
          </a>
        </footer>
      </main>
    </div>
  );
}

export default {
  page: Home,
  route: "/home",
  title: "UraJS",
};
