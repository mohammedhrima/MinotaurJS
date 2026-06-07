import Ura, { useNavigate } from "ura";
import { initMotion } from "../services/motion.js";

const links = [
  ["/home", "Home"],
  ["/notes", "Notes"],
  ["/reads", "Reads"],
  ["/play", "Play"],
];

function Navbar() {
  const navigate = useNavigate();
  return (
    <>
      <exec call={initMotion} />
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
    </>
  );
}

export default Navbar;
