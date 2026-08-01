import { AccessibilityPanel } from "./components/AccessibilityPanel";

function App() {
  return (
    <>
      <main style={{ maxWidth: 640, margin: "3rem auto", padding: "0 1.5rem" }}>
        <h1>Currícula</h1>
        <p>
          Migração para React em andamento — esta é a Fase 1 (barra de
          acessibilidade). O formulário completo ainda vive em{" "}
          <code>frontend/</code>.
        </p>
      </main>
      <AccessibilityPanel />
    </>
  );
}

export default App;
