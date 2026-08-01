import type { AuthError, User } from "@supabase/supabase-js";
import { createContext } from "react";

export interface AuthContextValue {
  user: User | null;
  carregandoSessaoInicial: boolean;
  /** true quando a pessoa chegou aqui por um link de recuperação de
   * senha — os componentes de UI usam isso pra abrir o modal de nova
   * senha automaticamente. */
  emRecuperacaoDeSenha: boolean;
  emailParaRecuperacao: string;
  fecharFluxoDeRecuperacao: () => void;
  login: (
    email: string,
    password: string,
  ) => Promise<{ error: AuthError | null }>;
  cadastrar: (
    email: string,
    password: string,
  ) => Promise<{ error: AuthError | null }>;
  loginComGoogle: () => Promise<{ error: AuthError | null }>;
  logout: () => Promise<void>;
  enviarLinkRecuperacao: (
    email: string,
  ) => Promise<{ error: AuthError | null }>;
  salvarNovaSenha: (novaSenha: string) => Promise<{ error: AuthError | null }>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
