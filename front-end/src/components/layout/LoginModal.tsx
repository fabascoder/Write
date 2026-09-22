import { useEffect, useState, type FormEvent } from "react";
import { CloseIcon, LockIcon } from "../icons";

type Props = {
  aberto: boolean;
  fechar: () => void;
  entrar: (email: string, senha: string) => boolean;
};

export default function LoginModal({ aberto, fechar, entrar }: Props) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!aberto) return;
    setEmail("");
    setSenha("");
    setErro("");

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [aberto, fechar]);

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (entrar(email, senha)) fechar();
    else setErro("E-mail ou senha incorretos.");
  }

  if (!aberto) return null;

  return (
    <div className="fc-modal" role="dialog" aria-modal="true" aria-labelledby="titulo-login">
      <div className="fc-modal-fundo" onClick={fechar} />
      <div className="fc-modal-caixa">
        <button type="button" className="fc-icon-btn fc-modal-fechar" onClick={fechar} aria-label="Fechar">
          <CloseIcon />
        </button>

        <span className="fc-modal-icone">
          <LockIcon />
        </span>
        <h2 id="titulo-login">Acesso restrito</h2>
        <p className="fc-modal-sub">Entre para escrever e gerenciar os artigos.</p>

        <form onSubmit={enviar} className="fc-form">
          <label className="fc-campo">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
            />
          </label>
          <label className="fc-campo">
            <span>Senha</span>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </label>

          {erro && <p className="fc-erro" role="alert">{erro}</p>}

          <button type="submit" className="fc-btn fc-btn--primario">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
