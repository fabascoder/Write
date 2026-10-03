import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useAuth } from "../../hooks/useAuth";
import { ErroApi } from "../../lib/api";
import { aplicarReacao, buscarReacoes, reagir, type Reacoes as Totais, type Valor } from "../../lib/reacoes";
import { ThumbDownIcon, ThumbUpIcon } from "../icons";
import Toast from "../layout/Toast";

// De quanto em quanto tempo busca os números de novo, para os likes
// de outras pessoas aparecerem sem recarregar a página
const ATUALIZAR_A_CADA = 15_000;

// Like e deslike no fim do artigo.
// Todo mundo vê os totais; só quem está logado consegue reagir.
export default function Reacoes({ artigoId }: { artigoId: string | number }) {
  const { usuario, exigirLogin, abrirLogin } = useAuth();
  const [totais, setTotais] = useState<Totais | null>(null);
  const [erro, setErro] = useState<{ id: number; texto: string } | null>(null);
  // indisponivel = a API não respondeu (fora do ar, ou back-end desatualizado)
  const [estado, setEstado] = useState<"carregando" | "ok" | "indisponivel">("carregando");
  const idAviso = useId();

  // Cliques rápidos (👍 e logo depois 👎) não se perdem: vão para a API em fila,
  // na ordem em que aconteceram, e só a resposta do último atualiza a tela
  const fila = useRef<Promise<void>>(Promise.resolve());
  const ultimoClique = useRef(0);
  const pendentes = useRef(0);

  // Busca ao abrir, quando a pessoa entra/sai da conta, e de tempos em tempos
  // enquanto a aba estiver visível
  useEffect(() => {
    let ativo = true;

    const carregar = () => {
      // Não atropela um clique que ainda está sendo salvo
      if (pendentes.current > 0) return;
      buscarReacoes(artigoId)
        .then((dados) => {
          if (!ativo || pendentes.current > 0) return;
          setTotais(dados);
          setEstado("ok");
        })
        .catch((e) => {
          console.error("Não foi possível carregar as reações:", e);
          // Uma falha passageira não apaga os números que já estavam na tela
          if (ativo) setEstado((atual) => (atual === "ok" ? "ok" : "indisponivel"));
        });
    };

    carregar();

    const intervalo = window.setInterval(() => {
      if (document.visibilityState === "visible") carregar();
    }, ATUALIZAR_A_CADA);

    const aoVoltar = () => document.visibilityState === "visible" && carregar();
    document.addEventListener("visibilitychange", aoVoltar);

    return () => {
      ativo = false;
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [artigoId, usuario?.id]);

  function clicar(valor: 1 | -1) {
    const acao = valor === 1 ? "curtir este artigo" : "dar deslike neste artigo";

    // Visitante → página de entrar (e volta para cá depois).
    // Não depende dos números terem carregado: o clique sempre leva ao login.
    exigirLogin(acao, () => {
      if (!totais) return;

      // Clicar no que já está marcado tira a reação
      const nova: Valor = totais.minha === valor ? 0 : valor;

      // Muda na tela na hora
      setTotais(aplicarReacao(totais, nova));

      const clique = ++ultimoClique.current;
      pendentes.current += 1;

      fila.current = fila.current.then(async () => {
        try {
          const confirmado = await reagir(artigoId, nova);
          if (clique === ultimoClique.current) setTotais(confirmado);
        } catch (e) {
          // Algo deu errado: busca o estado real no servidor
          buscarReacoes(artigoId).then(setTotais).catch(() => {});
          if (e instanceof ErroApi && e.status === 401) {
            // O login venceu: pede para entrar de novo
            abrirLogin({ motivo: `Sua sessão expirou. Entre de novo para ${acao}.`, voltar: window.location.pathname });
            return;
          }
          setErro({ id: Date.now(), texto: e instanceof Error ? e.message : "Não foi possível salvar sua reação." });
        } finally {
          pendentes.current -= 1;
        }
      });
    });
  }

  const fecharErro = useCallback(() => setErro(null), []);

  const likes = totais?.likes ?? 0;
  const dislikes = totais?.dislikes ?? 0;

  const visitante = !usuario;
  // Visitante: o botão leva ao login, a não ser que as curtidas estejam fora do ar.
  // Logado: só funciona com os números carregados.
  const desativado = visitante ? estado === "indisponivel" : estado !== "ok";

  const entrar = () =>
    abrirLogin({
      motivo: "Entre na sua conta para curtir os textos que você gostar.",
      voltar: window.location.pathname + window.location.search,
    });

  let aviso: ReactNode = null;
  if (visitante && estado === "indisponivel") {
    aviso = (
      <>
        As curtidas estão descansando um pouquinho. Enquanto isso,{" "}
        <button type="button" onClick={entrar}>entre na sua conta</button> e fique pronto para curtir 💙
      </>
    );
  } else if (visitante) {
    aviso = (
      <>
        <button type="button" onClick={entrar}>Entre na sua conta</button> para deixar sua curtida 💙
      </>
    );
  } else if (estado === "indisponivel") {
    aviso = <>Não conseguimos carregar as curtidas agora. Tente de novo em instantes 💙</>;
  }

  return (
    <section className="fc-reacoes" aria-label="Reações ao artigo">
      <p className="fc-reacoes-pergunta">Gostou deste texto?</p>

      <div className="fc-reacoes-botoes">
        <button
          type="button"
          className="fc-reacao fc-reacao--like"
          aria-pressed={totais?.minha === 1}
          aria-label={`Curtir. ${likes} ${likes === 1 ? "curtida" : "curtidas"}`}
          aria-describedby={aviso ? idAviso : undefined}
          onClick={() => clicar(1)}
          disabled={desativado}
        >
          <ThumbUpIcon />
          <span aria-hidden="true">{likes}</span>
        </button>

        <button
          type="button"
          className="fc-reacao fc-reacao--dislike"
          aria-pressed={totais?.minha === -1}
          aria-label={`Não curti. ${dislikes} ${dislikes === 1 ? "deslike" : "deslikes"}`}
          aria-describedby={aviso ? idAviso : undefined}
          onClick={() => clicar(-1)}
          disabled={desativado}
        >
          <ThumbDownIcon />
          <span aria-hidden="true">{dislikes}</span>
        </button>
      </div>

      {aviso && (
        <p id={idAviso} className="fc-reacoes-aviso">
          {aviso}
        </p>
      )}

      {erro && <Toast key={erro.id} mensagem={erro.texto} erro fechar={fecharErro} />}
    </section>
  );
}
