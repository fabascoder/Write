import { useState, type FormEvent } from "react";
import type { ModoLogin } from "../../context/auth";
import { useAuth } from "../../hooks/useAuth";
import { SENHA_MINIMA, urlLoginGoogle, type Usuario } from "../../lib/autenticacao";
import { GoogleIcon, LockIcon, UserIcon } from "../icons";

type Props = {
  modo: ModoLogin;
  trocarModo: () => void;
  aoConcluir: (usuario: Usuario) => void;
  motivo?: string;
  /** Para onde voltar depois do login com Google */
  voltar?: string;
  erroInicial?: string;
  idTitulo?: string;
};

// Um formulário só para entrar e criar conta. Leitor e admin entram pelo mesmo
// lugar: quem decide o que cada um pode fazer é o back-end.
export default function AuthForm({
  modo,
  trocarModo,
  aoConcluir,
  motivo,
  voltar,
  erroInicial = "",
  idTitulo = "titulo-login",
}: Props) {
  const { entrar, cadastrar, google } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState(erroInicial);
  const [enviando, setEnviando] = useState(false);

  const cadastro = modo === "cadastro";

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro("");

    if (cadastro && senha.length < SENHA_MINIMA) {
      setErro(`A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`);
      return;
    }
    if (cadastro && senha !== confirmacao) {
      setErro("As senhas não são iguais.");
      return;
    }

    try {
      setEnviando(true);
      const usuario = cadastro
        ? await cadastrar({ nome, email, senha, confirmacao })
        : await entrar(email, senha);
      aoConcluir(usuario);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível continuar agora.");
    } finally {
      setEnviando(false);
    }
  }

  const subtitulo =
    motivo ||
    (cadastro
      ? "Ler continua livre. A conta serve para curtir, comentar e acompanhar os textos."
      : "Entre para curtir, comentar e acompanhar os textos.");

  return (
    <>
      <span className="fc-modal-icone">{cadastro ? <UserIcon /> : <LockIcon />}</span>
      <h2 id={idTitulo}>{cadastro ? "Criar conta" : "Entrar"}</h2>
      <p className="fc-modal-sub">{subtitulo}</p>

      {google && (
        <>
          <a href={urlLoginGoogle(voltar)} className="fc-btn fc-btn--contorno fc-auth-google">
            <GoogleIcon />
            Continuar com Google
          </a>
          <p className="fc-auth-ou">
            <span>ou</span>
          </p>
        </>
      )}

      <form onSubmit={enviar} className="fc-form">
        {cadastro && (
          <label className="fc-campo">
            <span>Nome</span>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoComplete="name"
              minLength={2}
              maxLength={80}
              autoFocus
              required
            />
          </label>
        )}

        <label className="fc-campo">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus={!cadastro}
            required
          />
        </label>

        <label className="fc-campo">
          <span>Senha</span>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete={cadastro ? "new-password" : "current-password"}
            minLength={cadastro ? SENHA_MINIMA : undefined}
            required
          />
        </label>

        {cadastro && (
          <label className="fc-campo">
            <span>Confirmar senha</span>
            <input
              type="password"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
        )}

        {erro && (
          <p className="fc-erro" role="alert">
            {erro}
          </p>
        )}

        <button type="submit" className="fc-btn fc-btn--primario" disabled={enviando}>
          {enviando ? "Aguarde…" : cadastro ? "Criar conta" : "Entrar"}
        </button>
      </form>

      <p className="fc-auth-troca">
        {cadastro ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
        <button type="button" onClick={trocarModo}>
          {cadastro ? "Entrar" : "Criar conta"}
        </button>
      </p>
    </>
  );
}
