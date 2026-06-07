import Ura from "ura";
import Navbar from "../../components/Navbar.js";
import posts from "../../services/posts.js";

function Blog() {
  document.title = "UraJS — Blog";
  return (
    <div className="page">
      <Navbar />
      <main className="container">
        <h1 className="title">Blog</h1>
        <p className="muted">
          Each post routes to <code>/blog/:slug</code> — a dynamic param route.
        </p>
        <div className="grid">
          <ura-loop on={posts}>
            {(post) => (
              <a
                key={post.slug}
                className="feature"
                onclick={() => Ura.navigate("/blog/" + post.slug)}
              >
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <span className="feature-go">Read</span>
              </a>
            )}
          </ura-loop>
        </div>
      </main>
    </div>
  );
}

export default Blog;
