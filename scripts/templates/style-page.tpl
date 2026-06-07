.{{className}} {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 48px 20px;
  text-align: center;
  background: #0b0f17;
  color: #e8edf6;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;

  h1 {
    margin: 0;
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: -0.5px;
  }

  p {
    margin: 0;
    max-width: 40ch;
    line-height: 1.6;
    color: #93a1bd;
  }

  button {
    margin-top: 6px;
    padding: 10px 18px;
    border: none;
    border-radius: 10px;
    background: #007acc;
    color: #fff;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    transition:
      transform 0.15s ease,
      filter 0.2s ease;

    &:hover {
      filter: brightness(1.08);
    }
    &:active {
      transform: scale(0.97);
    }
  }
}
