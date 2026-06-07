import Ura, { State } from "ura";
import Navbar from "../../components/Navbar.js";
import Card from "../../components/Card.js";

function SvgDemo() {
  document.title = "UraJS — SVG";
  const [r, setR] = State(40);

  return (
    <div className="page">
      <Navbar />
      <main className="container">
        <h1 className="title">SVG</h1>
        <Card
          title="Native SVG elements"
          desc="UraJS creates SVG nodes in the correct namespace. Drag the slider to resize the circle."
        >
          <input
            className="input"
            type="range"
            min="10"
            max="90"
            value={String(r())}
            oninput={(e) => setR(Number(e.target.value))}
          />
          <p className="muted">radius: {r()}</p>
          <svg width="220" height="220" viewBox="0 0 220 220">
            <rect x="0" y="0" width="220" height="220" rx="12" fill="#1a1825" />
            <circle cx="110" cy="110" r={r()} fill="#8b5cf6" />
            <line x1="0" y1="110" x2="220" y2="110" stroke="#2e2b3d" />
            <line x1="110" y1="0" x2="110" y2="220" stroke="#2e2b3d" />
          </svg>
        </Card>
      </main>
    </div>
  );
}

export default SvgDemo;
