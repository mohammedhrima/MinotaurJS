import Ura, { useNavigate } from "ura";

const links = [
  ["/home", "Home"],
  ["/state", "State"],
  ["/state2", "State 2"],
  ["/conditions", "Conditions"],
  ["/loops", "Loops"],
  ["/todos", "Todos"],
  ["/effects", "Effects"],
  ["/blog", "Blog"],
  ["/search", "Search"],
  ["/svg", "SVG"],
];

function Navbar() {
  const navigate = useNavigate();
  return (
    <header className="nav">
      <div className="nav-brand" onclick={() => navigate("/home")}>
        <span className="brand-ura">Ura</span>
        <span className="brand-js">JS</span>
      </div>
      <nav className="nav-links">
        <ura-loop on={links}>
          {(link) => (
            <a
              key={link[0]}
              className={Ura.In(link[0]) ? "nav-link active" : "nav-link"}
              onclick={() => navigate(link[0])}
            >
              {link[1]}
            </a>
          )}
        </ura-loop>
      </nav>
    </header>
  );
}

export default Navbar;
