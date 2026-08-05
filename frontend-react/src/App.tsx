import { AccessibilityPanel } from "./components/AccessibilityPanel";
import { NotificacaoContainer } from "./components/NotificacaoContainer";
import { AuthModals } from "./components/auth/AuthModals";
import { ResumeWorkspace } from "./components/resumes/ResumeWorkspace";
import { AuthProvider } from "./contexts/AuthContext";
import { useNotificacoes } from "./hooks/useNotificacoes";

function App() {
  const { notificacoes, notificar, dispensar } = useNotificacoes();

  return (
    <AuthProvider>
      <NotificacaoContainer
        notificacoes={notificacoes}
        onDispensar={dispensar}
      />

      <main className="container mt-4 mb-5" style={{ maxWidth: 900 }}>
        <div className="row justify-content-center mb-3">
          <div className="col-md-10">
            <AuthModals />
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-md-10">
            <div className="card shadow-lg">
              <div className="card-body p-4 p-md-5">
                <ResumeWorkspace notificar={notificar} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <AccessibilityPanel />
    </AuthProvider>
  );
}

export default App;
