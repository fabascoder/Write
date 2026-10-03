import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buscarLeitura, duracao, type LeituraArtigo } from "../../lib/engajamento";
import { COR, numero, porcentagem } from "../../lib/graficos";
import { BarrasDeitadas, CartaoGrafico, Destaque, ItemLegenda } from "../admin/Graficos";
import { ArrowLeftIcon } from "../icons";
import { Head } from "../layout/Head";

const PERIODOS = [
  { dias: 7, nome: "Últimos 7 dias" },
  { dias: 30, nome: "Últimos 30 dias" },
  { dias: 90, nome: "Últimos 90 dias" },
  { dias: 365, nome: "Último ano" },
];

type Situacao = { nome: string; status: "bom" | "atencao" | "ruim"; explicacao: string };

// Compara o tempo real com o que o texto pede (200 palavras por minuto)
function situacao(a: LeituraArtigo): Situacao | null {
  if (a.leituras < 3 || a.mediaSegundos === null) return null;
  const parte = a.mediaSegundos / a.estimadoSegundos;
  const fim = a.chegaramAoFim ?? 0;
  if (parte >= 0.7 && fim >= 0.5) return { nome: "Lido com calma", status: "bom", explicacao: "As pessoas ficam o tempo que o texto pede e chegam ao fim." };
  // Chegam ao fim, mas rápido demais para ter lido: estão passando o olho
  if (fim >= 0.5 && parte < 0.35) {
    return {
      nome: "Lido por cima",
      status: "atencao",
      explicacao: "Vão até o fim, mas rápido demais para ler tudo. Intertítulos, parágrafos curtos e destaques ajudam quem passa o olho.",
    };
  }
  if (parte >= 0.35 || fim >= 0.3) {
    return { nome: "Lido pela metade", status: "atencao", explicacao: "Muita gente para no meio. Um começo mais direto ou intertítulos ajudam a seguir." };
  }
  return { nome: "Abandonado cedo", status: "ruim", explicacao: "A maioria sai logo. Vale rever o título e o primeiro parágrafo." };
}

// /admin/leitura — quanto tempo as pessoas passam lendo cada artigo
export default function AdminLeitura() {
  const [dias, setDias] = useState(30);
  const [artigos, setArtigos] = useState<LeituraArtigo[] | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    buscarLeitura(dias)
      .then((r) => ativo && setArtigos(r.artigos))
      .catch((e) => ativo && setErro(e.message));
    return () => {
      ativo = false;
    };
  }, [dias]);

  const lista = [...(artigos ?? [])].sort((a, b) => b.leituras - a.leituras);
  const lidos = lista.filter((a) => a.leituras > 0);
  const totalLeituras = lidos.reduce((s, a) => s + a.leituras, 0);
  const totalVisitas = lista.reduce((s, a) => s + a.visitas, 0);
  const mediaGeral = totalLeituras ? lidos.reduce((s, a) => s + (a.mediaSegundos ?? 0) * a.leituras, 0) / totalLeituras : null;
  const fimGeral = totalLeituras ? lidos.reduce((s, a) => s + (a.chegaramAoFim ?? 0) * a.leituras, 0) / totalLeituras : null;
  const maiorTempo = Math.max(1, ...lidos.map((a) => Math.max(a.mediaSegundos ?? 0, a.estimadoSegundos)));

  return (
    <main className="fc-main fc-main--simples fc-desemp">
      <Head title="Leitura dos artigos" description="Tempo de leitura dos artigos." />

      <div className="fc-topo">
        <Link to="/admin" className="fc-voltar" aria-label="Voltar ao painel">
          <ArrowLeftIcon />
        </Link>
      </div>

      <h1 className="fc-titulo-pagina">Leitura dos artigos</h1>

      <div className="fc-desemp-filtros">
        <label className="fc-campo">
          <span className="fc-sr">Período</span>
          <select value={dias} onChange={(e) => setDias(Number(e.target.value))}>
            {PERIODOS.map((p) => (
              <option key={p.dias} value={p.dias}>
                {p.nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      {erro && <p className="fc-estado fc-estado--erro">{erro}</p>}
      {!artigos && !erro && <p className="fc-estado">Carregando…</p>}

      {artigos && (
        <>
          <dl className="fc-numeros">
            <Destaque rotulo="Leituras" valor={numero(totalLeituras)} ajuda="Visitas em que o texto ficou pelo menos 10 s na tela" />
            <Destaque rotulo="Saídas rápidas" valor={numero(totalVisitas - totalLeituras)} ajuda="Abriram e saíram em menos de 10 s" />
            <Destaque rotulo="Tempo médio de leitura" valor={duracao(mediaGeral)} />
            <Destaque rotulo="Chegaram ao fim" valor={porcentagem(fimGeral)} ajuda="Rolaram até pelo menos 90% do texto" />
          </dl>

          {lidos.length === 0 ? (
            <p className="fc-estado">Ainda não há leituras neste período. O tempo é medido quando alguém abre um artigo (o seu não conta).</p>
          ) : (
            <CartaoGrafico
              titulo="Tempo médio de leitura por artigo"
              subtitulo="Barra = tempo médio real. Ao passar o mouse, aparece o tempo que o texto pede (200 palavras por minuto)."
              legenda={
                <>
                  <ItemLegenda cor={COR.status.bom} nome="Lido com calma" />
                  <ItemLegenda cor={COR.status.atencao} nome="Lido pela metade ou por cima" />
                  <ItemLegenda cor={COR.status.ruim} nome="Abandonado cedo" />
                  <ItemLegenda cor={COR.serie1} nome="Poucas leituras ainda" />
                </>
              }
              tabela={{
                colunas: [{ titulo: "Artigo" }, { titulo: "Tempo médio", alinhar: "direita" }, { titulo: "O texto pede", alinhar: "direita" }],
                linhas: lidos.map((a) => [a.titulo, duracao(a.mediaSegundos), duracao(a.estimadoSegundos)]),
              }}
            >
              <BarrasDeitadas
                itens={lidos.slice(0, 12).map((a) => {
                  const s = situacao(a);
                  return {
                    nome: a.titulo,
                    valor: a.mediaSegundos,
                    cor: s ? COR.status[s.status] : COR.serie1,
                    detalhe: `o texto pede ${duracao(a.estimadoSegundos)} · ${s?.nome ?? "poucas leituras"}`,
                  };
                })}
                formato={duracao}
                maximo={maiorTempo}
                larguraRotulo={200}
              />
            </CartaoGrafico>
          )}

          <section className="fc-desemp-bloco">
            <h3 className="fc-rotulo">Todos os artigos</h3>
            <div className="fc-tabela-rolagem">
              <table className="fc-tabela">
                <thead>
                  <tr>
                    <th>Artigo</th>
                    <th className="fc-num">Leituras</th>
                    <th className="fc-num">Saídas rápidas</th>
                    <th className="fc-num">Tempo médio</th>
                    <th className="fc-num">Mediana</th>
                    <th className="fc-num">O texto pede</th>
                    <th className="fc-num">Até o fim</th>
                    <th className="fc-num">Leram, em média</th>
                    <th>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((a) => {
                    const s = situacao(a);
                    return (
                      <tr key={a.id}>
                        <td className="fc-tabela-titulo">
                          <Link to={`/artigo/${a.id}`}>{a.titulo}</Link>
                        </td>
                        <td className="fc-num">{numero(a.leituras)}</td>
                        <td className="fc-num">{numero(a.saidasRapidas)}</td>
                        <td className="fc-num">{duracao(a.mediaSegundos)}</td>
                        <td className="fc-num">{duracao(a.medianaSegundos)}</td>
                        <td className="fc-num">{duracao(a.estimadoSegundos)}</td>
                        <td className="fc-num">{porcentagem(a.chegaramAoFim)}</td>
                        <td className="fc-num">{a.rolagemMedia === null ? "—" : `${a.rolagemMedia}% do texto`}</td>
                        <td title={s?.explicacao}>{s ? <span className={`fc-status fc-status--${s.status}`}>{s.nome}</span> : <span className="fc-status">Poucas leituras</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <p className="fc-desemp-nota">
            Conta o tempo em que o artigo ficou na tela com a aba aberta e a pessoa ativa (parado por mais de 2 minutos não conta). Menos de 10 s vira
            “saída rápida”. Leituras de quem administra o site não entram. Nada identifica o leitor.
          </p>
        </>
      )}
    </main>
  );
}
