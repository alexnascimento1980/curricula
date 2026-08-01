import { useAuth } from "../../hooks/useAuth";

interface AuthBannerProps {
  onAbrirLogin: () => void;
}

export function AuthBanner({ onAbrirLogin }: AuthBannerProps) {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="alert alert-warning d-flex justify-content-between align-items-center shadow-sm">
        <div>
          <i className="fas fa-info-circle me-2" aria-hidden="true"></i>
          <strong>Atenção:</strong> Faça login para gerenciar múltiplos
          currículos.
        </div>
        <button
          className="btn btn-sm btn-dark fw-bold px-4"
          type="button"
          onClick={onAbrirLogin}
        >
          Fazer Login
        </button>
      </div>
    );
  }

  return (
    <div className="alert alert-success d-flex justify-content-between align-items-center shadow-sm">
      <div className="d-flex align-items-center">
        <i className="fas fa-check-circle me-2" aria-hidden="true"></i>
        <div>
          <strong>Logado!</strong> (
          <span className="fw-bold">{user.email}</span>)
        </div>
      </div>
      <button
        className="btn btn-sm btn-outline-danger"
        type="button"
        onClick={() => logout()}
      >
        Sair
      </button>
    </div>
  );
}
