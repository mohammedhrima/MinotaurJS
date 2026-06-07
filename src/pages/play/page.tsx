import Ura, { State } from "ura";
import Navbar from "../../components/Navbar.js";

function breathe() {
  const svg: any = document.getElementById("bloom");
  if (!svg || svg._breathing) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  svg._breathing = true;
  let t = 0;
  const tick = () => {
    if (!svg.isConnected) {
      svg._breathing = false;
      return;
    }
    t += 0.018;
    svg.style.setProperty("--breathe", String(1 + Math.sin(t) * 0.06));
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function Play() {
  const [count, setCount] = State(8);
  const [spread, setSpread] = State(92);
  const [size, setSize] = State(42);
  const [hue, setHue] = State(204);
  const [speed, setSpeed] = State(18);

  const petals = () => Array.from({ length: count() }, (_, i) => i);
  const step = () => 360 / count();

  return (
    <div className="page">
      <exec call={breathe} />
      <Navbar />
      <main className="container">
        <section className="reveal">
          <h1 className="title">Play</h1>
          <p className="section-lead">
            Native SVG, driven entirely by State. Move a slider and the bloom
            rebuilds instantly; it turns on pure CSS and breathes on a single
            requestAnimationFrame loop wired through exec. No canvas, no
            library.
          </p>
        </section>

        <div className="play reveal">
          <div className="play-stage">
            <svg
              id="bloom"
              viewBox="0 0 400 400"
              className="bloom"
              style={{ "--spin-dur": speed() + "s" }}
            >
              <g className="bloom-spin">
                <g className="bloom-breathe">
                  <ura-loop on={petals()}>
                    {(i) => (
                      <ellipse
                        key={i}
                        cx="200"
                        cy="200"
                        rx={size()}
                        ry={size() / 2.6}
                        fill={`hsl(${(hue() + i * step()) % 360} 88% 62% / 0.55)`}
                        transform={`rotate(${i * step()} 200 200) translate(0 -${spread()})`}
                      />
                    )}
                  </ura-loop>
                  <circle
                    cx="200"
                    cy="200"
                    r="13"
                    fill={`hsl(${hue()} 90% 66%)`}
                  />
                </g>
              </g>
            </svg>
          </div>

          <div className="play-controls card">
            <label className="ctrl">
              <span className="ctrl-name">Petals</span>
              <span className="ctrl-val">{count()}</span>
              <input
                type="range"
                min="3"
                max="16"
                value={count()}
                oninput={(e) => setCount(+e.target.value)}
              />
            </label>
            <label className="ctrl">
              <span className="ctrl-name">Spread</span>
              <span className="ctrl-val">{spread()}</span>
              <input
                type="range"
                min="40"
                max="140"
                value={spread()}
                oninput={(e) => setSpread(+e.target.value)}
              />
            </label>
            <label className="ctrl">
              <span className="ctrl-name">Size</span>
              <span className="ctrl-val">{size()}</span>
              <input
                type="range"
                min="16"
                max="70"
                value={size()}
                oninput={(e) => setSize(+e.target.value)}
              />
            </label>
            <label className="ctrl">
              <span className="ctrl-name">Hue</span>
              <span className="ctrl-val">{hue()}</span>
              <input
                type="range"
                min="160"
                max="300"
                value={hue()}
                oninput={(e) => setHue(+e.target.value)}
              />
            </label>
            <label className="ctrl">
              <span className="ctrl-name">Speed</span>
              <span className="ctrl-val">{speed()}s</span>
              <input
                type="range"
                min="4"
                max="40"
                value={speed()}
                oninput={(e) => setSpeed(+e.target.value)}
              />
            </label>
          </div>
        </div>
      </main>
    </div>
  );
}

export default {
  page: Play,
  route: "/play",
  title: "UraJS — Play",
  keepAlive: true,
};
