import { useContext } from "react";
import { AuthContext } from "../context/auth";

export function useAuth() {
  const valor = useContext(AuthContext);
  if (!valor) throw new Error("useAuth precisa estar dentro do <AuthProvider>");
  return valor;
}

// Para onde mandar a pessoa depois de entrar, se ela não estava indo para lugar nenhum
export function destinoAposLogin(permissoes: string[]) {
  return permissoes.includes("admin:acessar") ? "/admin" : "/perfil";
}
