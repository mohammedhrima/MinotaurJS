export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
};

const posts: Post[] = [
  {
    slug: "hello-ura",
    title: "Hello, UraJS",
    excerpt: "A first look at a from-scratch UI framework.",
    body: "UraJS is a tiny framework with its own JSX runtime, a reactive State hook, directory-based routing, and a reconciler — no external UI libraries.",
  },
  {
    slug: "keyed-lists",
    title: "Why keys matter",
    excerpt: "Keyed reconciliation keeps component state glued to its row.",
    body: "When a list reorders, keys let the reconciler match old nodes to new ones by identity instead of position, so each row's DOM and state move with it.",
  },
  {
    slug: "no-build-magic",
    title: "A framework with no magic",
    excerpt: "Everything is plain functions and a small virtual DOM.",
    body: "Components are functions that return a virtual DOM. The runtime mounts, patches, and unmounts it — that is the whole model.",
  },
];

export default posts;
