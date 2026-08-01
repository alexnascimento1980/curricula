import { AccessibilityPanel } from "./components/AccessibilityPanel";
import { AuthModals } from "./components/auth/AuthModals";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <main className="container mt-4 mb-5" style={{ maxWidth: 900 }}>
        <div className="row justify-content-center mb-3">
          <div className="col-md-10">
            <AuthModals />
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-md-10">
            <p className="text-muted">
              Migração para React em andamento — Fase 2 (autenticação)
              completa. O formulário principal ainda vive em{" "}
              <code>frontend/</code>.
            </p>
          </div>
        </div>
      </main>
      <AccessibilityPanel />
    </AuthProvider>
  );
}

export default App;
