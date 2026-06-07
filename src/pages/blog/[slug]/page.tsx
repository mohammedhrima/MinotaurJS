import Ura, { State } from "ura";
import Navbar from "../../../components/Navbar.js";
import Card from "../../../components/Card.js";
import posts from "../../../services/posts.js";

function Post(props) {
  const post = posts.find((p) => p.slug === props.slug);
  document.title = post ? `UraJS — ${post.title}` : "UraJS — Not found";
  const [likes, setLikes] = State(0);

  return (
    <div className="page">
      <Navbar />
      <main className="container">
        <a className="back" onclick={() => Ura.navigate("/blog")}>
          Back to blog
        </a>

        <ura-if cond={!!post}>
          <Card title={post?.title}>
            <p className="muted">
              Route param <code>:slug</code> = <code>{props.slug}</code>
            </p>
            <p>{post?.body}</p>
            <button className="btn" onclick={() => setLikes(likes() + 1)}>
              Like ({likes()})
            </button>
          </Card>
        </ura-if>
        <ura-else>
          <Card title="Post not found">
            <p className="muted">No post matches slug "{props.slug}".</p>
          </Card>
        </ura-else>
      </main>
    </div>
  );
}

export const keepAlive = true;
export default Post;
