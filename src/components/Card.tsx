import Ura from "ura";

function Card(props, children) {
  return (
    <section className="card">
      <ura-if cond={!!props.title}>
        <h3 className="card-title">{props.title}</h3>
      </ura-if>
      <ura-if cond={!!props.desc}>
        <p className="card-desc">{props.desc}</p>
      </ura-if>
      <div className="card-body">{children}</div>
    </section>
  );
}

export default Card;
