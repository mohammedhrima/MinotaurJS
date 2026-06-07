:root {
  --bg: #0f172a;
  --nav: #1e293b;
  --accent: #26578d;
  --text: #e2e8f0;
  --text-muted: #94a3b8;
  --border: #334155;
}

* { box-sizing: border-box; }
body { margin: 0; }

.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, sans-serif;
}
.layout-nav {
  background-color: var(--nav);
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--border);
}
.layout-logo {
  color: var(--accent);
  font-size: 1.25rem;
  font-weight: bold;
  text-decoration: none;
}
.layout-content { flex: 1; padding: 2rem 1rem; }
.layout-footer {
  background-color: var(--nav);
  text-align: center;
  padding: 1rem;
  font-size: 0.9rem;
  border-top: 1px solid var(--border);
  color: var(--text-muted);
}

button {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.6rem 1.25rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s, transform 0.2s;
}
button:hover { background: #3c82c9; transform: translateY(-2px); }
button:active { transform: scale(0.97); }
