{{tsIgnore}}import { State{{importExtras}} } from 'ura';

function Layout(props{{propsType}}, children{{childrenType}}){{vdomType}} {
  return (
    <div className="layout">
      <header className="layout-nav">
        <a className="layout-logo" href="/">UraJS</a>
      </header>
      <main className="layout-content">{children}</main>
      <footer className="layout-footer">Built with 💙 using UraJS</footer>
    </div>
  );
}

export default Layout
