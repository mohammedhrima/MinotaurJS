import Ura, { State } from "ura";

function CodeBlock(props) {
  const [copied, setCopied] = State(false);

  const copy = () => {
    navigator.clipboard?.writeText(props.code)?.catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="code">
      <div className="code-head">
        <span className="code-label">{props.label || "code"}</span>
        <button className="code-copy" onclick={copy}>
          {copied() ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>{props.code}</pre>
    </div>
  );
}

export default CodeBlock;
