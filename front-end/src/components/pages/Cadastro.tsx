import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ErroApi } from "../../lib/api";
import { iniciarMedicao } from "../../lib/medicao";
import {
  caminhoSeguro,
  comVoltar,
  temErros,
  validarCadastro,
  type Cadastro as DadosCadastro,
  type ErrosForm,
} from "../../lib/autenticacao";
import { AuthPagina, Campo, CampoSenha } from "../auth/AuthPagina";

const VAZIO: DadosCadastro = { nome: "", email: "", senha: "", confirmacao: "" };

// /cadastro — template "Desktop 9"
export default function Cadastro() {
  const { usuario, cadastrar } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [params] = useSearchParams();

  const voltar = caminhoSeguro(params.get("voltar"));
  const motivo = (state as { motivo?: string } | null)?.motivo;

  const [dados, setDados] = useState<DadosCadastro>(VAZIO);
  const [erros, setErros] = useState<ErrosForm>({});
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);

  if (usuario && !enviando) return <Navigate to={voltar || "/"} replace />;

  // Atualiza um campo e, depois da primeira tentativa, revalida na hora
  const mudar = (campo: keyof DadosCadastro) => (valor: string) => {
    const novos = { ...dados, [campo]: valor };
    setDados(novos);
    if (tentou) setErros(validarCadastro(novos));
  };

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setTentou(true);

    const encontrados = validarCadastro(dados);
    setErros(encontrados);
    if (temErros(encontrados)) return;

    // Desempenho: do botão Cadastrar até a resposta
    const medir = iniciarMedicao("cadastro");

    try {
      setEnviando(true);
      await cadastrar({ ...dados, nome: dados.nome.trim(), email: dados.email.trim() });
      medir({ status: 201, caminho: "/auth/cadastro" });
      // Conta criada e já logada: vai para a página principal
      navigate(voltar || "/", { replace: true });
    } catch (e) {
      medir({ status: e instanceof ErroApi ? e.status : 0, caminho: "/auth/cadastro" });
      const mensagem = e instanceof Error ? e.message : "Não foi possível criar a conta agora.";
      // E-mail repetido aparece embaixo do campo de e-mail
      setErros(e instanceof ErroApi && e.status === 409 ? { email: mensagem } : { geral: mensagem });
      setEnviando(false);
    }
  }

  return (
    <AuthPagina
      tituloAba="Criar conta"
      aviso={motivo}
      titulo={
        <>
          Cadastre-se para fazer parte de novas <em>ideias</em>.
        </>
      }
    >
      <form className="fc-login-form" onSubmit={enviar} noValidate>
        <Campo
          rotulo="Nome"
          value={dados.nome}
          onChange={(e) => mudar("nome")(e.target.value)}
          autoComplete="name"
          autoFocus
          erro={erros.nome}
        />

        <Campo
          rotulo="Email"
          type="email"
          value={dados.email}
          onChange={(e) => mudar("email")(e.target.value)}
          autoComplete="email"
          erro={erros.email}
        />

        <CampoSenha
          rotulo="Senha"
          value={dados.senha}
          onChange={(e) => mudar("senha")(e.target.value)}
          autoComplete="new-password"
          erro={erros.senha}
        />

        <CampoSenha
          rotulo="Confirme sua senha"
          value={dados.confirmacao}
          onChange={(e) => mudar("confirmacao")(e.target.value)}
          autoComplete="new-password"
          erro={erros.confirmacao}
        />

        {erros.geral && (
          <p className="fc-login-erro fc-login-erro--geral" role="alert">
            {erros.geral}
          </p>
        )}

        <button type="submit" className="fc-login-botao fc-login-botao--normal" disabled={enviando}>
          {enviando ? "Cadastrando…" : "Cadastrar"}
        </button>
      </form>

      <p className="fc-login-troca">
        Já tem uma conta? <Link to={comVoltar("/entrar", voltar)}>Entrar</Link>
      </p>
    </AuthPagina>
  );
}
