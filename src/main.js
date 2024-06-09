import Mini from "../Mini/lib";
import Home from "./pages/Home/home";
import "./global.css"

function Main() {
  return (
    <>
      <Mini.Routes path="*" element={Home} />
    </>
  );
}

Mini.render(<Main />, document.getElementById("app"));
