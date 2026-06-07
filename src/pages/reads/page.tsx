import Ura, { useNavigate } from "ura";
import Navbar from "../../components/Navbar.js";
import { useQuery } from "../../services/query.js";
import { fetchReads } from "../../services/reads.js";

function Reads() {
  const navigate = useNavigate();
  const { data, error, loading, refetch } = useQuery(["reads"], fetchReads);

  return (
    <div className="page">
      <Navbar />
      <main className="container">
        <section className="reveal">
          <h1 className="title">Reads</h1>
          <p className="section-lead">
            The list and every article are fetched over HTTP through a tiny api
            helper and useQuery — no data library. Open one and it loads on
            demand, caches, and is kept alive per slug, so going back and
            reopening is instant.
          </p>
        </section>

        <ura-if cond={loading}>
          <div className="card reveal">
            <p className="muted">Loading reads…</p>
          </div>
        </ura-if>
        <ura-elif cond={!!error}>
          <div className="card reveal">
            <p className="muted">Could not load reads.</p>
            <button className="btn" onclick={refetch}>
              Try again
            </button>
          </div>
        </ura-elif>
        <ura-else>
          <div className="grid">
            <ura-loop on={data}>
              {(r) => (
                <a
                  key={r.slug}
                  className="feature tilt reveal"
                  onclick={() => navigate("/reads/" + r.slug)}
                >
                  <h3>{r.title}</h3>
                  <p>{r.excerpt}</p>
                  <span className="feature-go">{r.minutes} min read</span>
                </a>
              )}
            </ura-loop>
          </div>
        </ura-else>
      </main>
    </div>
  );
}

export default {
  page: Reads,
  route: "/reads",
  title: "UraJS — Reads",
};
