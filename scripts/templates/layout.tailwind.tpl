{{tsIgnore}}import { State{{importExtras}} } from 'ura';

function Layout(props{{propsType}}, children{{childrenType}}){{vdomType}} {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <header className="bg-nav px-8 py-4 border-b border-border">
        <a className="text-accent text-xl font-bold" href="/">UraJS</a>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-nav text-center p-4 text-sm border-t border-border text-text-muted">
        Built with 💙 using UraJS
      </footer>
    </div>
  );
}

export default Layout
