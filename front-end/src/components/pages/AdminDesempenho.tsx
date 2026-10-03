import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import {
  ACOES,
  buscarDesempenho,
  composicao,
  csvDasAmostras,
  diagnosticar,
  diagnosticarRota,
  histograma,
  ms,
  porAparelho,
  porVisita,
  satisfacao,
  serieDasAmostras,
  statusGeral,
  tamanho,
  variacao,
  type Diagnostico,
  type Resumo,
  type ResumoAcao,
  type Status,
} from "../../lib/desempenho";
import { COR, numero, porcentagem, rotuloDoTempo } from "../../lib/graficos";
import type { AcaoMedida } from "../../lib/medicao";
import { tempoRelativo } from "../../lib/format";
import {
  BarrasDeitadas,
  CartaoGrafico,
  Composicao,
  Destaque,
  Histograma,
  ItemLegenda,
  LegendaLinhaDoTempo,
  LegendaZonas,
  LinhaDoTempo,
  MiniLinha,
  Volume,
} from "../admin/Graficos";
import { ArrowLeftIcon } from "../icons";
import { Head } from "../layout/Head";

type Aba = "geral" | AcaoMedida | "servidor";
type Acao = (typeof ACOES)[number];

const NOME_STATUS: Record<Status, string> = { bom: "Bom", atencao: "Atenção", ruim: "Ruim", "sem-dados": "Sem dados" };
const ICONE_STATUS: Record<Status, string> = { bom: "✓", atencao: "!", ruim: "✕", "sem-dados": "–" };

const PERIODOS = [
  { dias: 1, nome: "Últimas 24 horas" },
  { dias: 7, nome: "Últimos 7 dias" },
  { dias: 30, nome: "Últimos 30 dias" },
];

// Limites da aba Servidor (95% das respostas dentro do servidor)
const SERVIDOR_BOM = 300;
const SERVIDOR_RUIM = 1000;

const corDoStatus = (s: Status) => (s === "sem-dados" ? COR.apagado : COR.status[s]);

// ---------- Pecinhas ----------

// Situação sempre com ícone + texto (a cor nunca fala sozinha)
function Selo({ status }: { status: Status }) {
  return (
    <span className={`fc-status fc-status--${status}`}>
      <span aria-hidden="true">{ICONE_STATUS[status]}</span> {NOME_STATUS[status]}
    </span>
  );
}

function Veredito({ d, variacaoTexto }: { d: Diagnostico; variacaoTexto?: string }) {
  return (
    <div className={`fc-veredito fc-veredito--${d.status}`} role="status">
      <span className="fc-veredito-ponto" aria-hidden="true">
        {ICONE_STATUS[d.status]}
      </span>
      <div>
        <strong>{d.titulo}</strong>
        {d.texto && <p>{d.texto}</p>}
        {variacaoTexto && <p className="fc-veredito-variacao">{variacaoTexto}</p>}
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

function baixarCsv(nomeArquivo: string, conteudo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- Aba de uma ação ----------

function PainelAcao({ acao, dados, d, resumo }: { acao: Acao; dados?: ResumoAcao; d: Diagnostico; resumo: Resumo }) {
  const amostras = useMemo(() => dados?.amostras ?? [], [dados]);
  const serie = useMemo(() => serieDasAmostras(amostras, resumo.inicio, resumo.fim, resumo.balde), [amostras, resumo]);
  const faixas = useMemo(() => histograma(amostras, acao.bom, acao.ruim), [amostras, acao]);
  const satisf = satisfacao(amostras, acao.bom, acao.ruim);
  const carregaPagina = acao.id === "abrir_artigo" || acao.id === "carregar_inicio";

  if (!dados || dados.total === 0) {
    return (
      <>
        <p className="fc-desemp-descricao">{acao.descricao}.</p>
        <Veredito d={d} />
      </>
    );
  }

  const varMedia = variacao(dados.media, dados.anterior.media);
  const aparelhos = porAparelho(amostras);
  const visitas = porVisita(amostras);
  const maiorComparacao = Math.max(...[...aparelhos, ...visitas].map((g) => g.mediana ?? 0), acao.bom);

  return (
    <>
      <p className="fc-desemp-descricao">{acao.descricao}.</p>
      <Veredito d={d} variacaoTexto={varMedia ? `Média ${varMedia.texto}.` : undefined} />

      <dl className="fc-destaques">
        <Destaque rotulo="Média" valor={ms(dados.media)} variacao={varMedia} />
        <Destaque rotulo="Mediana" valor={ms(dados.mediana)} variacao={variacao(dados.mediana, dados.anterior.mediana)} ajuda="Metade das vezes foi mais rápido que isso" />
        <Destaque rotulo="95% das vezes, até" valor={ms(dados.p95)} variacao={variacao(dados.p95, dados.anterior.p95)} ajuda="Só 5% das vezes passaram deste tempo" />
        <Destaque
          rotulo="Satisfação"
          valor={porcentagem(satisf)}
          ajuda={`Índice Apdex: até ${ms(acao.bom)} conta como rápido, até ${ms(acao.ruim)} como aceitável (vale meio), acima disso como lento`}
        />
        <Destaque rotulo="Requisições" valor={numero(dados.total)} ajuda={`No período anterior: ${numero(dados.anterior.total)}`} />
        <Destaque rotulo="Com erro" valor={porcentagem(dados.erros / dados.total, 1)} />
      </dl>

      <CartaoGrafico
        titulo="Tempo ao longo do período"
        subtitulo={`Cada ponto junta ${rotuloIntervalo(resumo.balde)}. A linha tracejada verde é a meta (${ms(acao.bom)}); a vermelha, o limite (${ms(acao.ruim)}).`}
        legenda={<LegendaLinhaDoTempo />}
        tabela={{
          colunas: [{ titulo: "Quando" }, { titulo: "Requisições", alinhar: "direita" }, { titulo: "Mediana", alinhar: "direita" }, { titulo: "95% até", alinhar: "direita" }],
          linhas: serie.filter((p) => p.total > 0).map((p) => [rotuloDoTempo(p.inicio, resumo.balde), numero(p.total), ms(p.mediana), ms(p.p95)]),
        }}
      >
        <LinhaDoTempo pontos={serie} balde={resumo.balde} bom={acao.bom} ruim={acao.ruim} />
      </CartaoGrafico>

      <div className="fc-graficos-duplos">
        <CartaoGrafico
          titulo="Como os tempos se distribuem"
          subtitulo="Quantas requisições caíram em cada faixa de tempo."
          legenda={<LegendaZonas />}
          tabela={{
            colunas: [{ titulo: "Faixa" }, { titulo: "Requisições", alinhar: "direita" }, { titulo: "Parte", alinhar: "direita" }],
            linhas: faixas.map((f) => [f.faixa, numero(f.total), porcentagem(f.parte)]),
          }}
        >
          <Histograma faixas={faixas} />
        </CartaoGrafico>

        <CartaoGrafico titulo="Para onde vai o tempo" subtitulo={`Em média, as ${ms(dados.media)} se dividem assim:`}>
          <Composicao partes={composicao(dados)} />
          <p className="fc-grafico-nota">
            {(dados.servidorMedia ?? 0) > (dados.media ?? 0) / 2
              ? "A maior parte está no servidor: o banco ou a rota estão lentos."
              : "A maior parte está fora do servidor: internet, tamanho do que é baixado e o próprio navegador."}
          </p>
        </CartaoGrafico>
      </div>

      <div className="fc-graficos-duplos">
        <CartaoGrafico
          titulo="Celular × computador"
          subtitulo="Mediana do tempo em cada tipo de aparelho."
          tabela={{
            colunas: [{ titulo: "Aparelho" }, { titulo: "Requisições", alinhar: "direita" }, { titulo: "Mediana", alinhar: "direita" }],
            linhas: aparelhos.map((g) => [g.nome, numero(g.total), ms(g.mediana)]),
          }}
        >
          <BarrasDeitadas
            itens={aparelhos.map((g) => ({ nome: g.nome, valor: g.mediana, detalhe: `${numero(g.total)} requisições` }))}
            formato={(v) => (v ? ms(v) : "sem dados")}
            maximo={maiorComparacao}
            larguraRotulo={110}
          />
        </CartaoGrafico>

        {carregaPagina ? (
          <CartaoGrafico
            titulo="Primeira visita × navegando"
            subtitulo="A primeira visita inclui baixar o site (e acordar o servidor)."
            tabela={{
              colunas: [{ titulo: "Situação" }, { titulo: "Requisições", alinhar: "direita" }, { titulo: "Mediana", alinhar: "direita" }],
              linhas: visitas.map((g) => [g.nome, numero(g.total), ms(g.mediana)]),
            }}
          >
            <BarrasDeitadas
              itens={visitas.map((g) => ({ nome: g.nome, valor: g.mediana, detalhe: `${numero(g.total)} requisições` }))}
              formato={(v) => (v ? ms(v) : "sem dados")}
              maximo={maiorComparacao}
              larguraRotulo={140}
            />
          </CartaoGrafico>
        ) : (
          <CartaoGrafico
            titulo="Quantas vezes foi usado"
            subtitulo="Requisições em cada intervalo do período."
            tabela={{
              colunas: [{ titulo: "Quando" }, { titulo: "Requisições", alinhar: "direita" }],
              linhas: serie.filter((p) => p.total > 0).map((p) => [rotuloDoTempo(p.inicio, resumo.balde), numero(p.total)]),
            }}
          >
            <Volume pontos={serie} balde={resumo.balde} altura={160} />
          </CartaoGrafico>
        )}
      </div>

      {carregaPagina && (
        <CartaoGrafico
          titulo="Quantas vezes foi aberto"
          subtitulo="Requisições em cada intervalo do período."
          tabela={{
            colunas: [{ titulo: "Quando" }, { titulo: "Requisições", alinhar: "direita" }],
            linhas: serie.filter((p) => p.total > 0).map((p) => [rotuloDoTempo(p.inicio, resumo.balde), numero(p.total)]),
          }}
        >
          <Volume pontos={serie} balde={resumo.balde} altura={170} />
        </CartaoGrafico>
      )}

      <Problemas problemas={d.problemas} status={d.status} />

      <section className="fc-desemp-bloco">
        <div className="fc-desemp-bloco-topo">
          <h3 className="fc-rotulo">Últimas requisições</h3>
          <button
            type="button"
            className="fc-btn fc-btn--contorno fc-btn--pequeno"
            onClick={() => baixarCsv(`desempenho-${acao.id}.csv`, csvDasAmostras(amostras))}
          >
            Baixar CSV ({numero(amostras.length)})
          </button>
        </div>
        <div className="fc-tabela-rolagem">
          <table className="fc-tabela">
            <thead>
              <tr>
                <th>Quando</th>
                <th className="fc-num">Tempo</th>
                <th className="fc-num">Servidor</th>
                <th className="fc-num">Dados</th>
                <th>Aparelho</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {dados.recentes.map((r, i) => {
                const zona: Status = r.duracaoMs > acao.ruim ? "ruim" : r.duracaoMs > acao.bom ? "atencao" : "bom";
                return (
                  <tr key={`${r.data}-${i}`}>
                    <td>{tempoRelativo(r.data)}</td>
                    <td className="fc-num">
                      <span className={`fc-tempo fc-tempo--${zona}`}>{ms(r.duracaoMs)}</span>
                    </td>
                    <td className="fc-num">{ms(r.servidorMs)}</td>
                    <td className="fc-num">{tamanho(r.bytes)}</td>
                    <td>{r.detalhes.celular === true ? "Celular" : r.detalhes.celular === false ? "Computador" : "—"}</td>
                    <td>{r.status === null ? "—" : r.status < 400 ? "ok" : `erro ${r.status || "de rede"}`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function rotuloIntervalo(balde: number) {
  const horas = balde / (60 * 60 * 1000);
  return horas === 1 ? "1 hora" : horas < 24 ? `${horas} horas` : "1 dia";
}

// ---------- Aba do servidor ----------

function PainelServidor({ resumo }: { resumo: Resumo }) {
  const geral = resumo.servidorGeral;
  if (geral.total === 0) {
    return (
      <Veredito d={{ status: "sem-dados", titulo: "Ainda sem medições", texto: "As rotas aparecem aqui assim que forem usadas.", problemas: [] }} />
    );
  }

  const rotas = resumo.servidor.map((r) => ({ r, d: diagnosticarRota(r) }));
  const situacao = statusGeral(rotas.map((x) => x.d));
  const comProblema = rotas.filter((x) => x.d.problemas.length > 0);
  const maisLentas = [...rotas].sort((a, b) => (b.r.p95 ?? 0) - (a.r.p95 ?? 0)).slice(0, 8);
  const maisChamadas = rotas.slice(0, 8);
  // Largura da coluna de nomes: cabe a rota mais longa (fonte monoespaçada, ~8 px por letra)
  const larguraRota = Math.min(260, Math.max(...rotas.map((x) => x.r.rota.length)) * 8 + 16);

  return (
    <>
      <p className="fc-desemp-descricao">Tempo que cada rota da API leva dentro do servidor, sem contar a internet. Inclui todas as requisições do site.</p>
      <Veredito
        d={{
          status: situacao,
          titulo: situacao === "bom" ? "O servidor está respondendo bem" : situacao === "atencao" ? "Algumas rotas pedem atenção" : "Há rotas lentas no servidor",
          texto: `${numero(geral.total)} requisições em ${rotas.length} rotas.`,
          problemas: [],
        }}
      />

      <dl className="fc-destaques">
        <Destaque rotulo="Requisições" valor={numero(geral.total)} ajuda={`No período anterior: ${numero(geral.anterior.total)}`} />
        <Destaque rotulo="Média" valor={ms(geral.media)} variacao={variacao(geral.media, geral.anterior.media)} />
        <Destaque rotulo="95% das vezes, até" valor={ms(geral.p95)} variacao={variacao(geral.p95, geral.anterior.p95)} />
        <Destaque rotulo="Erros no servidor (5xx)" valor={numero(geral.erros5xx)} />
      </dl>

      <CartaoGrafico
        titulo="Tempo no servidor ao longo do período"
        subtitulo={`Meta: 95% abaixo de ${ms(SERVIDOR_BOM)}; limite: ${ms(SERVIDOR_RUIM)}.`}
        legenda={<LegendaLinhaDoTempo />}
        tabela={{
          colunas: [{ titulo: "Quando" }, { titulo: "Requisições", alinhar: "direita" }, { titulo: "Mediana", alinhar: "direita" }, { titulo: "95% até", alinhar: "direita" }, { titulo: "Erros", alinhar: "direita" }],
          linhas: geral.serie.filter((p) => p.total > 0).map((p) => [rotuloDoTempo(p.inicio, resumo.balde), numero(p.total), ms(p.mediana), ms(p.p95), numero(p.erros)]),
        }}
      >
        <LinhaDoTempo pontos={geral.serie} balde={resumo.balde} bom={SERVIDOR_BOM} ruim={SERVIDOR_RUIM} />
      </CartaoGrafico>

      <CartaoGrafico titulo="Requisições ao longo do período" subtitulo="Quantas vezes a API foi chamada em cada intervalo.">
        <Volume pontos={geral.serie} balde={resumo.balde} altura={170} />
      </CartaoGrafico>

      <div className="fc-graficos-duplos">
        <CartaoGrafico
          titulo="Rotas mais lentas"
          subtitulo="Tempo em que cabem 95% das respostas. A cor mostra a situação."
          legenda={<LegendaZonas />}
          tabela={{
            colunas: [{ titulo: "Rota" }, { titulo: "95% até", alinhar: "direita" }, { titulo: "Situação" }],
            linhas: maisLentas.map(({ r, d }) => [r.rota, ms(r.p95), NOME_STATUS[d.status]]),
          }}
        >
          <BarrasDeitadas
            itens={maisLentas.map(({ r, d }) => ({ nome: r.rota, valor: r.p95, cor: corDoStatus(d.status), detalhe: `${NOME_STATUS[d.status]} · ${numero(r.total)} chamadas` }))}
            formato={ms}
            larguraRotulo={larguraRota}
            monoespacado
          />
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Rotas mais chamadas"
          subtitulo="Número de chamadas no período."
          tabela={{
            colunas: [{ titulo: "Rota" }, { titulo: "Chamadas", alinhar: "direita" }],
            linhas: maisChamadas.map(({ r }) => [r.rota, numero(r.total)]),
          }}
        >
          <BarrasDeitadas
            itens={maisChamadas.map(({ r }) => ({ nome: r.rota, valor: r.total, detalhe: `média ${ms(r.media)}` }))}
            formato={numero}
            larguraRotulo={larguraRota}
            monoespacado
          />
        </CartaoGrafico>
      </div>

      <section className="fc-desemp-bloco">
        <h3 className="fc-rotulo">Todas as rotas</h3>
        <div className="fc-tabela-rolagem">
          <table className="fc-tabela">
            <thead>
              <tr>
                <th>Rota</th>
                <th className="fc-num">Chamadas</th>
                <th className="fc-num">Média</th>
                <th className="fc-num">95% até</th>
                <th className="fc-num">Resposta</th>
                <th>Erros</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {rotas.map(({ r, d }) => (
                <tr key={r.rota}>
                  <td className="fc-tabela-rota">{r.rota}</td>
                  <td className="fc-num">{numero(r.total)}</td>
                  <td className="fc-num">{ms(r.media)}</td>
                  <td className="fc-num">{ms(r.p95)}</td>
                  <td className="fc-num">{tamanho(r.bytesMedia)}</td>
                  <td>{r.erros5xx > 0 ? `${r.erros5xx} no servidor` : r.erros > 0 ? `${r.erros} do usuário` : "—"}</td>
                  <td>
                    <Selo status={d.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {comProblema.map(({ r, d }) => (
        <div key={r.rota}>
          <h3 className="fc-desemp-rota">{r.rota}</h3>
          <Problemas problemas={d.problemas} status={d.status} />
        </div>
      ))}
    </>
  );
}

// ---------- Visão geral ----------

function PainelGeral({
  resumo,
  diagnosticos,
  geral,
  statusServidor,
  irPara,
}: {
  resumo: Resumo;
  diagnosticos: Record<AcaoMedida, Diagnostico>;
  geral: Status;
  statusServidor: Status;
  irPara: (aba: Aba) => void;
}) {
  // Satisfação de todas as ações juntas, cada uma com seus próprios limites
  const pesos = ACOES.map((a) => {
    const amostras = resumo.navegador[a.id]?.amostras ?? [];
    return { a, total: amostras.length, satisf: satisfacao(amostras, a.bom, a.ruim) };
  });
  const totalMedicoes = pesos.reduce((s, p) => s + p.total, 0);
  const satisfGeral = totalMedicoes ? pesos.reduce((s, p) => s + (p.satisf ?? 0) * p.total, 0) / totalMedicoes : null;
  const errosGerais = ACOES.reduce((s, a) => s + (resumo.navegador[a.id]?.erros ?? 0), 0);
  const comProblema = ACOES.filter((a) => ["atencao", "ruim"].includes(diagnosticos[a.id].status)).length;

  // Uso empilhado por área, com a cor fixa de cada área
  const series = ACOES.map((a, i) => ({ chave: a.id, nome: a.nome, cor: COR.categorias[i] }));
  const seriesPorAcao = Object.fromEntries(
    ACOES.map((a) => [a.id, serieDasAmostras(resumo.navegador[a.id]?.amostras ?? [], resumo.inicio, resumo.fim, resumo.balde)]),
  );
  const uso = resumo.servidorGeral.serie.map((p, i) => ({
    inicio: p.inicio,
    ...Object.fromEntries(ACOES.map((a) => [a.id, seriesPorAcao[a.id][i]?.total ?? 0])),
  }));

  return (
    <>
      <div className="fc-heroi">
        <div>
          <p className="fc-heroi-rotulo">Satisfação geral</p>
          <p className="fc-heroi-valor">{porcentagem(satisfGeral)}</p>
          <p className="fc-heroi-ajuda">das vezes o site respondeu rápido (as aceitáveis contam meio)</p>
        </div>
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
            texto: geral === "sem-dados" ? "Os tempos aparecem conforme as pessoas usam o site." : "Abra cada área para ver os números, o motivo e a dica de melhoria.",
            problemas: [],
          }}
        />
      </div>

      <dl className="fc-destaques">
        <Destaque rotulo="Medições no site" valor={numero(totalMedicoes)} />
        <Destaque rotulo="Áreas com problema" valor={`${comProblema} de ${ACOES.length}`} />
        <Destaque rotulo="Ações com erro" valor={totalMedicoes ? porcentagem(errosGerais / totalMedicoes, 1) : "—"} />
        <Destaque
          rotulo="Servidor, 95% até"
          valor={ms(resumo.servidorGeral.p95)}
          variacao={variacao(resumo.servidorGeral.p95, resumo.servidorGeral.anterior.p95)}
        />
      </dl>

      <div className="fc-graficos-duplos">
        <CartaoGrafico
          titulo="Satisfação por área"
          subtitulo="Quanto mais perto de 100%, mais vezes a área respondeu rápido."
          legenda={<LegendaZonas />}
          tabela={{
            colunas: [{ titulo: "Área" }, { titulo: "Satisfação", alinhar: "direita" }, { titulo: "Situação" }],
            linhas: pesos.map((p) => [p.a.nome, porcentagem(p.satisf), NOME_STATUS[diagnosticos[p.a.id].status]]),
          }}
        >
          <BarrasDeitadas
            itens={pesos.map((p) => ({
              nome: p.a.nome,
              valor: p.satisf,
              cor: corDoStatus(diagnosticos[p.a.id].status),
              detalhe: p.total ? `${numero(p.total)} medições · ${NOME_STATUS[diagnosticos[p.a.id].status]}` : "sem medições",
            }))}
            formato={(v) => porcentagem(v)}
            maximo={1}
            larguraRotulo={110}
          />
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Uso do site ao longo do período"
          subtitulo="Quantas ações foram medidas em cada intervalo, por área."
          legenda={series.map((s) => <ItemLegenda key={s.chave} cor={s.cor} nome={s.nome} />)}
          tabela={{
            colunas: [{ titulo: "Quando" }, ...ACOES.map((a) => ({ titulo: a.nome, alinhar: "direita" as const }))],
            linhas: uso
              .filter((p) => ACOES.some((a) => Number(p[a.id as keyof typeof p]) > 0))
              .map((p) => [rotuloDoTempo(p.inicio, resumo.balde), ...ACOES.map((a) => numero(Number(p[a.id as keyof typeof p])))]),
          }}
        >
          <Volume pontos={uso} balde={resumo.balde} series={series} altura={220} />
        </CartaoGrafico>
      </div>

      <section className="fc-desemp-bloco">
        <h3 className="fc-rotulo">Cada área</h3>
        <ul className="fc-desemp-areas">
          {ACOES.map((a) => {
            const dados = resumo.navegador[a.id];
            const v = variacao(dados?.media ?? null, dados?.anterior.media);
            return (
              <li key={a.id}>
                <button type="button" className="fc-desemp-area" onClick={() => irPara(a.id)}>
                  <span className="fc-desemp-area-nome">
                    <strong>{a.nome}</strong>
                    <small>
                      {dados ? `${ms(dados.media)} em média · ${numero(dados.total)} requisições` : "Sem medições ainda"}
                      {v && v.melhorou !== null ? ` · ${v.melhorou ? "▼" : "▲"} ${Math.abs(Math.round(v.pct))}%` : ""}
                    </small>
                  </span>
                  <MiniLinha valores={seriesPorAcao[a.id].map((p) => p.mediana)} rotulo={`Tendência da mediana de ${a.nome}`} />
                  <Selo status={diagnosticos[a.id].status} />
                </button>
              </li>
            );
          })}
          <li>
            <button type="button" className="fc-desemp-area" onClick={() => irPara("servidor")}>
              <span className="fc-desemp-area-nome">
                <strong>Servidor (API)</strong>
                <small>
                  {resumo.servidor.length} rotas · {numero(resumo.servidorGeral.total)} requisições
                </small>
              </span>
              <MiniLinha valores={resumo.servidorGeral.serie.map((p) => p.mediana)} rotulo="Tendência do tempo no servidor" />
              <Selo status={statusServidor} />
            </button>
          </li>
        </ul>
      </section>
    </>
  );
}

// ---------- Página ----------

// /admin/desempenho — quanto tempo o site leva em cada ação, gráficos e o que melhorar
export default function AdminDesempenho() {
  const [dias, setDias] = useState(7);
  const [aba, setAba] = useState<Aba>("geral");
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [versao, setVersao] = useState(0);
  const [automatico, setAutomatico] = useState(false);

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

  // Atualizar sozinho a cada 30 s (só com a aba visível)
  useEffect(() => {
    if (!automatico) return;
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setCarregando(true);
      setVersao((v) => v + 1);
    }, 30_000);
    return () => window.clearInterval(id);
  }, [automatico]);

  const diagnosticos = useMemo(
    () => Object.fromEntries(ACOES.map((a) => [a.id, diagnosticar(a, resumo?.navegador[a.id])])) as Record<AcaoMedida, Diagnostico>,
    [resumo],
  );

  const statusServidor = resumo ? statusGeral(resumo.servidor.map(diagnosticarRota)) : "sem-dados";
  const geral = statusGeral([...Object.values(diagnosticos), ...(statusServidor === "sem-dados" ? [] : [{ status: statusServidor } as Diagnostico])]);

  const abas: { id: Aba; nome: string; status: Status }[] = [
    { id: "geral", nome: "Visão geral", status: geral },
    ...ACOES.map((a) => ({ id: a.id as Aba, nome: a.nome, status: diagnosticos[a.id].status })),
    { id: "servidor", nome: "Servidor (API)", status: statusServidor },
  ];

  function atualizar(novosDias = dias) {
    setCarregando(true);
    setDias(novosDias);
    setVersao((v) => v + 1);
  }

  function irPara(nova: Aba) {
    setAba(nova);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      </div>

      <h1 className="fc-titulo-pagina">Desempenho do sistema</h1>

      {/* Filtros: uma linha só, acima de tudo que eles afetam */}
      <div className="fc-desemp-filtros">
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
        <label className="fc-share-check">
          <input type="checkbox" checked={automatico} onChange={(e) => setAutomatico(e.target.checked)} />
          Atualizar sozinho a cada 30 s
        </label>
        {resumo && <span className="fc-desemp-quando">Atualizado {tempoRelativo(resumo.geradoEm)}</span>}
      </div>

      {erro && <p className="fc-estado fc-estado--erro">{erro}</p>}
      {!resumo && !erro && <p className="fc-estado">Carregando medições…</p>}

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
                <span className={`fc-aba-ponto fc-aba-ponto--${a.status}`} aria-hidden="true" />
                {a.nome}
                <span className="fc-sr"> — {NOME_STATUS[a.status]}</span>
              </button>
            ))}
          </div>

          {resumo.truncado && (
            <p className="fc-desemp-aviso">Muitas medições neste período: os números usam as mais recentes. Escolha um período menor para ver tudo.</p>
          )}

          {/* Ao atualizar, o painel fica apagadinho em vez de sumir */}
          <section
            id="painel-desempenho"
            role="tabpanel"
            aria-labelledby={`aba-${aba}`}
            aria-busy={carregando}
            className={"fc-desemp-painel" + (carregando ? " is-atualizando" : "")}
          >
            {aba === "geral" && (
              <PainelGeral resumo={resumo} diagnosticos={diagnosticos} geral={geral} statusServidor={statusServidor} irPara={irPara} />
            )}
            {acaoAtual && <PainelAcao acao={acaoAtual} dados={resumo.navegador[acaoAtual.id]} d={diagnosticos[acaoAtual.id]} resumo={resumo} />}
            {aba === "servidor" && <PainelServidor resumo={resumo} />}
          </section>

          <p className="fc-desemp-nota">
            Os tempos são medidos no navegador de quem usa o site (o que a pessoa sente) e dentro do servidor. Ficam guardados por 30 dias, sem
            dados pessoais.
          </p>
        </>
      )}
    </main>
  );
}
