import { useContext } from "react";
import { AuthContext } from "../context/auth";

export function useAuth() {
  const valor = useContext(AuthContext);
  if (!valor) throw new Error("useAuth precisa estar dentro do <AuthProvider>");
  return valor;
}
