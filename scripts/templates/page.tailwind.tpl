{{tsIgnore}}import { State{{importExtras}} } from 'ura';

function {{Name}}(props{{propsType}}){{vdomType}} {
  const [count, setCount] = State(0);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <h1 className="text-3xl font-semibold text-text">{{title}}</h1>
      <button className="bg-accent text-white py-2 px-5 rounded-lg shadow-lg hover:bg-blue-500 active:scale-95 transition" onclick={() => setCount(count() + 1)}>
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
