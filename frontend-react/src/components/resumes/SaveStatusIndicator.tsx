interface SaveStatusIndicatorProps {
  status: "oculto" | "salvando" | "salvo";
}

export function SaveStatusIndicator({ status }: SaveStatusIndicatorProps) {
  if (status === "oculto") return null;

  return (
    <div
      className={
        "position-fixed bottom-0 end-0 p-3" +
        (status === "salvando" ? " saving" : "")
      }
      style={{ zIndex: 1000 }}
      aria-live="polite"
      role="status"
    >
      <div className="badge bg-info p-2 shadow">
        <i className="fas fa-cloud-upload-alt me-2" aria-hidden="true"></i>
        <span>{status === "salvando" ? "Salvando..." : "Salvo"}</span>
      </div>
    </div>
  );
}
