{{tsIgnore}}import { State{{importExtras}} } from 'ura';

function {{Name}}(props{{propsType}}){{vdomType}} {
  const [count, setCount] = State(0);

  return (
    <div className="{{className}}">
      <h1>{{title}}</h1>
      <p>A fresh UraJS page. Edit src/pages/{{name}}/page to make it yours.</p>
      <button onclick={() => setCount(count() + 1)}>
        Clicked {count()} times
      </button>
    </div>
  );
}

export default {
  page: {{Name}},
  route: "{{route}}",
  title: "{{title}}",
};
