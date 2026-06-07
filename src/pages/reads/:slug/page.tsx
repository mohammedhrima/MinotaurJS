import Ura, { useNavigate } from "ura";
import Navbar from "../../../components/Navbar.js";
import { useQuery } from "../../../services/query.js";
import { fetchRead } from "../../../services/reads.js";

function Read(props) {
  const navigate = useNavigate();
  const { data, error, loading, refetch } = useQuery(
    ["read", props.slug],
    () => fetchRead(props.slug),
  );

  return (
    <div className="page">
      <Navbar />
      <main className="container narrow">
        <a className="back reveal" onclick={() => navigate("/reads")}>
          Back to reads
        </a>

        <ura-if cond={loading}>
          <div className="card reveal">
            <p className="muted">Fetching the article…</p>
          </div>
        </ura-if>
        <ura-elif cond={!!error}>
          <div className="card reveal">
            <p className="muted">Something went wrong loading this read.</p>
            <button className="btn" onclick={refetch}>
              Try again
            </button>
          </div>
        </ura-elif>
        <ura-elif cond={!!data}>
          <article className="card reveal">
            <h1 className="title">{data?.title}</h1>
            <p className="muted">
              {data?.minutes} min read · fetched on demand
            </p>
            <p className="read-body">{data?.body}</p>
            <button className="btn ghost" onclick={refetch}>
              Refetch
            </button>
          </article>
        </ura-elif>
        <ura-else>
          <div className="card reveal">
            <p className="muted">No article matches “{props.slug}”.</p>
          </div>
        </ura-else>
      </main>
    </div>
  );
}

export default {
  page: Read,
  route: "/reads/:slug",
  title: (props) => "UraJS — " + props.slug.replace(/-/g, " "),
  keepAlive: true,
};
