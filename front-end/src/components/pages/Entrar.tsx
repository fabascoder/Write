import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ErroApi } from "../../lib/api";
import { iniciarMedicao } from "../../lib/medicao";
import { caminhoSeguro, comVoltar, temErros, urlLoginGoogle, validarLogin, type ErrosForm } from "../../lib/autenticacao";
import { AuthPagina, Campo } from "../auth/AuthPagina";
import { GoogleIcon } from "../icons";

const ERROS_GOOGLE: Record<string, string> = {
  google: "Não foi possível entrar com o Google. Tente de novo.",
  "google-indisponivel": "O login com Google ainda não está disponível.",
};

// /entrar — template "Desktop 8"
export default function Entrar() {
  const { usuario, entrar, google } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [params] = useSearchParams();

  const voltar = caminhoSeguro(params.get("voltar"));
  const motivo = (state as { motivo?: string } | null)?.motivo;

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erros, setErros] = useState<ErrosForm>({ geral: ERROS_GOOGLE[params.get("erro") ?? ""] });
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Já está logado: nada para fazer aqui
  if (usuario && !enviando) return <Navigate to={voltar || "/"} replace />;

  // Depois da primeira tentativa, os erros somem conforme a pessoa corrige
  function revalidar(novoEmail: string, novaSenha: string) {
    if (tentou) setErros(validarLogin(novoEmail, novaSenha));
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setTentou(true);

    const encontrados = validarLogin(email, senha);
    setErros(encontrados);
    if (temErros(encontrados)) return;

    // Desempenho: do botão Entrar até a resposta
    const medir = iniciarMedicao("entrar");

    try {
      setEnviando(true);
      await entrar(email.trim(), senha);
      medir({ status: 200, caminho: "/auth/login" });
      // Deu tudo certo: página principal (ou de volta para onde a pessoa estava)
      navigate(voltar || "/", { replace: true });
    } catch (e) {
      medir({ status: e instanceof ErroApi ? e.status : 0, caminho: "/auth/login" });
      const mensagem = e instanceof Error ? e.message : "Não foi possível entrar agora.";
      setErros({ geral: e instanceof ErroApi && e.status === 401 ? "E-mail ou senha incorretos." : mensagem });
      setEnviando(false);
    }
  }

  return (
    <AuthPagina
      tituloAba="Entrar"
      aviso={motivo}
      titulo={
        <>
          Entre para <em>curtir</em>, <em>comentar</em> e <em>acompanhar</em> os textos.
        </>
      }
    >
      <form className="fc-login-form" onSubmit={enviar} noValidate>
        <Campo
          rotulo="Email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            revalidar(e.target.value, senha);
          }}
          autoComplete="email"
          autoFocus
          erro={erros.email}
        />

        <Campo
          rotulo="Senha"
          type="password"
          value={senha}
          onChange={(e) => {
            setSenha(e.target.value);
            revalidar(email, e.target.value);
          }}
          autoComplete="current-password"
          erro={erros.senha}
        />

        {erros.geral && (
          <p className="fc-login-erro fc-login-erro--geral" role="alert">
            {erros.geral}
          </p>
        )}

        <button type="submit" className="fc-login-botao" disabled={enviando}>
          {enviando ? "ENTRANDO…" : "ENTRAR"}
        </button>
      </form>

      <p className="fc-login-troca">
        Ainda não tem conta? <Link to={comVoltar("/cadastro", voltar)}>Criar conta</Link>
      </p>

      {google && (
        <a href={urlLoginGoogle(voltar || undefined)} className="fc-login-google">
          <GoogleIcon />
          <span>Entrar com o Google</span>
        </a>
      )}
    </AuthPagina>
  );
}
