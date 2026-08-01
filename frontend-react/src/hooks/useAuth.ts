import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContextObject";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth precisa ser usado dentro de um <AuthProvider>");
  }
  return context;
}
