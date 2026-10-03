import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import {
  ACOES,
  buscarDesempenho,
  diagnosticar,
  diagnosticarRota,
  ms,
  statusGeral,
  tamanho,
  type Diagnostico,
  type Resumo,
  type ResumoAcao,
  type Status,
} from "../../lib/desempenho";
import type { AcaoMedida } from "../../lib/medicao";
import { tempoRelativo } from "../../lib/format";
import { ArrowLeftIcon } from "../icons";
import { Head } from "../layout/Head";

type Aba = "geral" | AcaoMedida | "servidor";

const NOME_STATUS: Record<Status, string> = { bom: "Bom", atencao: "Atenção", ruim: "Ruim", "sem-dados": "Sem dados" };

const PERIODOS = [
  { dias: 1, nome: "Últimas 24 horas" },
  { dias: 7, nome: "Últimos 7 dias" },
  { dias: 30, nome: "Últimos 30 dias" },
];

function Selo({ status }: { status: Status }) {
  return <span className={`fc-status fc-status--${status}`}>{NOME_STATUS[status]}</span>;
}

// Faixa colorida com o veredito: bom, atenção ou ruim
function Veredito({ d }: { d: Diagnostico }) {
  return (
    <div className={`fc-veredito fc-veredito--${d.status}`} role="status">
      <span className="fc-veredito-ponto" aria-hidden="true" />
      <div>
        <strong>{d.titulo}</strong>
        {d.texto && <p>{d.texto}</p>}
      </div>
    </div>
  );
}

function Problemas({ problemas, status }: { problemas: Diagnostico["problemas"]; status?: Status }) {
  if (problemas.length === 0) return null;
  return (
    <section className="fc-desemp-bloco">
      <h3 className="fc-rotulo">{status === "bom" ? "Está bom, mas vale melhorar" : "Por que, e o que fazer"}</h3>
      <ul className="fc-problemas">
        {problemas.map((p) => (
          <li key={p.motivo}>
            <p className="fc-problema-motivo">{p.motivo}</p>
            <p className="fc-problema-dica">
              <strong>Dica:</strong> {p.dica}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Numeros({ itens }: { itens: [string, string][] }) {
  return (
    <dl className="fc-numeros">
      {itens.map(([rotulo, valor]) => (
        <div key={rotulo}>
          <dt>{rotulo}</dt>
          <dd>{valor}</dd>
        </div>
      ))}
    </dl>
  );
}

function PainelAcao({ acao, dados, d }: { acao: (typeof ACOES)[number]; dados?: ResumoAcao; d: Diagnostico }) {
  const carregaPagina = acao.id === "abrir_artigo" || acao.id === "carregar_inicio";

  return (
    <>
      <p className="fc-desemp-descricao">{acao.descricao}.</p>
      <Veredito d={d} />

      {dados && dados.total > 0 && (
        <>
          <Numeros
            itens={[
              ["Média", ms(dados.media)],
              ["Mediana", ms(dados.mediana)],
              ["95% das vezes, até", ms(dados.p95)],
              ["Requisições", String(dados.total)],
              ["Tempo no servidor (média)", ms(dados.servidorMedia)],
              ["Dados baixados (média)", tamanho(dados.bytesMedia)],
            ]}
          />

          {carregaPagina && (
            <Numeros
              itens={[
                ["Primeira visita", `${ms(dados.primeiraVisita.media)} (${dados.primeiraVisita.total}×)`],
                ["Navegando no site", `${ms(dados.navegando.media)} (${dados.navegando.total}×)`],
                ...(acao.id === "abrir_artigo"
                  ? ([
                      ["Fotos por artigo (média)", String(dados.detalhes.imagens ?? 0)],
                      ["Peso das fotos (média)", tamanho(dados.detalhes.bytesImagens ?? 0)],
                    ] as [string, string][])
                  : []),
              ]}
            />
          )}
        </>
      )}

      <Problemas problemas={d.problemas} status={d.status} />

      {dados && dados.recentes.length > 0 && (
        <section className="fc-desemp-bloco">
          <h3 className="fc-rotulo">Últimas requisições</h3>
          <div className="fc-tabela-rolagem">
            <table className="fc-tabela">
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>Tempo</th>
                  <th>Servidor</th>
                  <th>Dados</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {dados.recentes.map((r, i) => (
                  <tr key={`${r.data}-${i}`}>
                    <td>{tempoRelativo(r.data)}</td>
                    <td>
                      <span className={`fc-tempo fc-tempo--${r.duracaoMs > acao.ruim ? "ruim" : r.duracaoMs > acao.bom ? "atencao" : "bom"}`}>
                        {ms(r.duracaoMs)}
                      </span>
                    </td>
                    <td>{ms(r.servidorMs)}</td>
                    <td>{tamanho(r.bytes)}</td>
                    <td>{r.status === null ? "—" : r.status < 400 ? "ok" : `erro ${r.status || "de rede"}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

function PainelServidor({ resumo }: { resumo: Resumo }) {
  if (resumo.servidor.length === 0) {
    return <Veredito d={{ status: "sem-dados", titulo: "Ainda sem medições", texto: "As rotas aparecem aqui assim que forem usadas.", problemas: [] }} />;
  }

  const rotas = resumo.servidor.map((r) => ({ r, d: diagnosticarRota(r) }));
  const geral = statusGeral(rotas.map((x) => x.d));
  const comProblema = rotas.filter((x) => x.d.problemas.length > 0);

  return (
    <>
      <p className="fc-desemp-descricao">
        Tempo que cada rota da API leva dentro do servidor, sem contar a internet. Inclui todas as requisições do site.
      </p>
      <Veredito
        d={{
          status: geral,
          titulo: geral === "bom" ? "O servidor está respondendo bem" : geral === "atencao" ? "Algumas rotas pedem atenção" : "Há rotas lentas no servidor",
          texto: `${rotas.reduce((s, x) => s + x.r.total, 0)} requisições em ${rotas.length} rotas.`,
          problemas: [],
        }}
      />

      <div className="fc-tabela-rolagem fc-desemp-bloco">
        <table className="fc-tabela">
          <thead>
            <tr>
              <th>Rota</th>
              <th>Chamadas</th>
              <th>Média</th>
              <th>95% até</th>
              <th>Resposta</th>
              <th>Erros</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {rotas.map(({ r, d }) => (
              <tr key={r.rota}>
                <td className="fc-tabela-rota">{r.rota}</td>
                <td>{r.total}</td>
                <td>{ms(r.media)}</td>
                <td>{ms(r.p95)}</td>
                <td>{tamanho(r.bytesMedia)}</td>
                <td>{r.erros5xx > 0 ? `${r.erros5xx} no servidor` : r.erros > 0 ? `${r.erros} do usuário` : "—"}</td>
                <td>
                  <Selo status={d.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {comProblema.map(({ r, d }) => (
        <div key={r.rota}>
          <h3 className="fc-desemp-rota">{r.rota}</h3>
          <Problemas problemas={d.problemas} status={d.status} />
        </div>
      ))}
    </>
  );
}

// /admin/desempenho — quanto tempo o site leva em cada ação, e o que melhorar
export default function AdminDesempenho() {
  const [dias, setDias] = useState(7);
  const [aba, setAba] = useState<Aba>("geral");
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true;
    buscarDesempenho(dias)
      .then((r) => {
        if (!ativo) return;
        setResumo(r);
        setErro("");
      })
      .catch((e) => ativo && setErro(e.message))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [dias, versao]);

  const diagnosticos = useMemo(
    () => Object.fromEntries(ACOES.map((a) => [a.id, diagnosticar(a, resumo?.navegador[a.id])])) as Record<AcaoMedida, Diagnostico>,
    [resumo],
  );

  const statusServidor = resumo ? statusGeral(resumo.servidor.map(diagnosticarRota)) : "sem-dados";
  const geral = statusGeral([...Object.values(diagnosticos), ...(statusServidor === "sem-dados" ? [] : [{ status: statusServidor } as Diagnostico])]);

  const abas: { id: Aba; nome: string; status?: Status }[] = [
    { id: "geral", nome: "Visão geral", status: geral },
    ...ACOES.map((a) => ({ id: a.id as Aba, nome: a.nome, status: diagnosticos[a.id].status })),
    { id: "servidor", nome: "Servidor (API)", status: statusServidor },
  ];

  function atualizar(novosDias = dias) {
    setCarregando(true);
    setDias(novosDias);
    setVersao((v) => v + 1);
  }

  // Setas do teclado trocam de aba
  function teclado(e: KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = abas.findIndex((a) => a.id === aba);
    const proxima = abas[(i + (e.key === "ArrowRight" ? 1 : -1) + abas.length) % abas.length];
    setAba(proxima.id);
    document.getElementById(`aba-${proxima.id}`)?.focus();
  }

  const acaoAtual = ACOES.find((a) => a.id === aba);

  return (
    <main className="fc-main fc-main--simples fc-desemp">
      <Head title="Desempenho" description="Desempenho do Fabas Coder Blog." />

      <div className="fc-topo">
        <Link to="/admin" className="fc-voltar" aria-label="Voltar ao painel">
          <ArrowLeftIcon />
        </Link>
        <div className="fc-desemp-controles">
          <label className="fc-campo">
            <span className="fc-sr">Período</span>
            <select value={dias} onChange={(e) => atualizar(Number(e.target.value))}>
              {PERIODOS.map((p) => (
                <option key={p.dias} value={p.dias}>
                  {p.nome}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="fc-btn fc-btn--contorno" onClick={() => atualizar()} disabled={carregando}>
            {carregando ? "Atualizando…" : "Atualizar"}
          </button>
        </div>
      </div>

      <h1 className="fc-titulo-pagina">Desempenho do sistema</h1>

      {erro && <p className="fc-estado fc-estado--erro">{erro}</p>}

      {resumo && (
        <>
          <div className="fc-abas" role="tablist" aria-label="Áreas do sistema" onKeyDown={teclado}>
            {abas.map((a) => (
              <button
                key={a.id}
                id={`aba-${a.id}`}
                type="button"
                role="tab"
                aria-selected={aba === a.id}
                aria-controls="painel-desempenho"
                tabIndex={aba === a.id ? 0 : -1}
                className="fc-aba"
                onClick={() => setAba(a.id)}
              >
                {a.status && <span className={`fc-aba-ponto fc-aba-ponto--${a.status}`} aria-hidden="true" />}
                {a.nome}
              </button>
            ))}
          </div>

          <section id="painel-desempenho" role="tabpanel" aria-labelledby={`aba-${aba}`} className="fc-desemp-painel">
            {aba === "geral" && (
              <>
                <Veredito
                  d={{
                    status: geral,
                    titulo:
                      geral === "bom"
                        ? "O sistema está bom"
                        : geral === "atencao"
                          ? "O sistema precisa de atenção"
                          : geral === "ruim"
                            ? "O sistema está ruim em alguns pontos"
                            : "Ainda sem medições",
                    texto:
                      geral === "sem-dados"
                        ? "Os tempos aparecem conforme as pessoas usam o site."
                        : "Abra cada área para ver os números, o motivo e a dica de melhoria.",
                    problemas: [],
                  }}
                />
                <ul className="fc-desemp-areas">
                  {ACOES.map((a) => {
                    const dados = resumo.navegador[a.id];
                    return (
                      <li key={a.id}>
                        <button type="button" className="fc-desemp-area" onClick={() => setAba(a.id)}>
                          <span>
                            <strong>{a.nome}</strong>
                            <small>{dados ? `${ms(dados.media)} em média · ${dados.total} requisições` : "Sem medições ainda"}</small>
                          </span>
                          <Selo status={diagnosticos[a.id].status} />
                        </button>
                      </li>
                    );
                  })}
                  <li>
                    <button type="button" className="fc-desemp-area" onClick={() => setAba("servidor")}>
                      <span>
                        <strong>Servidor (API)</strong>
                        <small>{resumo.servidor.length} rotas medidas</small>
                      </span>
                      <Selo status={statusServidor} />
                    </button>
                  </li>
                </ul>
              </>
            )}

            {acaoAtual && <PainelAcao acao={acaoAtual} dados={resumo.navegador[acaoAtual.id]} d={diagnosticos[acaoAtual.id]} />}

            {aba === "servidor" && <PainelServidor resumo={resumo} />}
          </section>

          <p className="fc-desemp-nota">
            Os tempos são medidos no navegador de quem usa o site (o que a pessoa sente) e dentro do servidor. Ficam guardados por
            30 dias, sem dados pessoais. Atualizado {tempoRelativo(resumo.geradoEm)}.
          </p>
        </>
      )}
    </main>
  );
}
