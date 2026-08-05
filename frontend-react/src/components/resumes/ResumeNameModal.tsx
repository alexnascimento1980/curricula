import { type FormEvent, useState } from "react";
import { Modal } from "../Modal";

interface ResumeNameModalProps {
  open: boolean;
  onClose: () => void;
  modo: "criar" | "renomear";
  nomeInicial: string;
  onConfirmar: (nome: string) => void;
}

export function ResumeNameModal({
  open,
  onClose,
  modo,
  nomeInicial,
  onConfirmar,
}: ResumeNameModalProps) {
  const [nome, setNome] = useState(nomeInicial);

  const [abertoAnterior, setAbertoAnterior] = useState(open);
  if (open !== abertoAnterior) {
    setAbertoAnterior(open);
    if (open) setNome(nomeInicial);
  }

  function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) return;
    onConfirmar(nomeLimpo);
  }

  return (
    <Modal
      id="resumeModal"
      titleId="resumeModalTitle"
      open={open}
      onClose={onClose}
      title={
        <>
          <i className="fas fa-file-alt me-2" aria-hidden="true"></i>
          {modo === "criar" ? "Novo Currículo" : "Renomear Currículo"}
        </>
      }
    >
      <form onSubmit={aoSubmeter}>
        <label className="form-label fw-bold" htmlFor="resumeNameInput">
          Nome do Currículo
        </label>
        <input
          type="text"
          className="form-control"
          id="resumeNameInput"
          placeholder="Ex: Currículo para TI, Vaga Designer..."
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <div className="modal-footer px-0 pb-0 pt-4">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  );
}
