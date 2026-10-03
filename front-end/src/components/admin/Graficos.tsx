import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ms, type Faixa, type PontoSerie } from "../../lib/desempenho";
import { COR, intervaloDoTempo, numero, porcentagem, rotuloDoTempo } from "../../lib/graficos";

// Peças dos gráficos do painel de desempenho (Recharts).
// Regras: linhas de 2px, barras de no máximo 24px com ponta arredondada,
// grade clarinha, dica ao passar o mouse, legenda para 2+ séries e
// sempre uma tabela com os mesmos números ("Ver em tabela").

const EIXO = { fill: COR.textoFraco, fontSize: 12 };

// ---------- Moldura ----------

type Coluna = { titulo: string; alinhar?: "direita" };

export function CartaoGrafico({
  titulo,
  subtitulo,
  legenda,
  tabela,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  legenda?: ReactNode;
  tabela?: { colunas: Coluna[]; linhas: ReactNode[][] };
  children: ReactNode;
}) {
  return (
    <figure className="fc-grafico">
      <figcaption>
        <h3 className="fc-grafico-titulo">{titulo}</h3>
        {subtitulo && <p className="fc-grafico-subtitulo">{subtitulo}</p>}
      </figcaption>
      {legenda && <div className="fc-grafico-legenda">{legenda}</div>}
      <div className="fc-grafico-area">{children}</div>
      {tabela && (
        <details className="fc-grafico-tabela">
          <summary>Ver em tabela</summary>
          <div className="fc-tabela-rolagem">
            <table className="fc-tabela">
              <thead>
                <tr>
                  {tabela.colunas.map((c) => (
                    <th key={c.titulo} className={c.alinhar === "direita" ? "fc-num" : undefined}>
                      {c.titulo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tabela.linhas.map((linha, i) => (
                  <tr key={i}>
                    {linha.map((celula, j) => (
                      <td key={j} className={tabela.colunas[j]?.alinhar === "direita" ? "fc-num" : undefined}>
                        {celula}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </figure>
  );
}

// Item de legenda: linha para séries de linha, quadradinho para barras
export function ItemLegenda({ cor, nome, forma = "barra" }: { cor: string; nome: string; forma?: "barra" | "linha" | "tracejada" }) {
  return (
    <span className="fc-legenda-item">
      <span className={`fc-legenda-chave fc-legenda-chave--${forma}`} style={{ background: forma === "tracejada" ? undefined : cor, borderColor: cor }} />
      {nome}
    </span>
  );
}

// ---------- Dica ao passar o mouse (valor em destaque, nome depois) ----------

type ItemDica = { name?: string; value?: number | string; color?: string; dataKey?: string | number };

function Dica({
  active,
  payload,
  titulo,
  formato,
}: {
  active?: boolean;
  payload?: ItemDica[];
  titulo: string;
  formato: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="fc-dica-grafico">
      <p className="fc-dica-titulo">{titulo}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="fc-dica-linha">
          <span className="fc-dica-chave" style={{ background: p.color }} />
          <strong>{typeof p.value === "number" ? formato(p.value) : "sem dados"}</strong>
          <span>{p.name}</span>
        </p>
      ))}
    </div>
  );
}

// O Recharts entrega os dados do mouse em listas somente-leitura:
// pontoDa() pega o ponto inteiro; itensDa(), cada série daquele ponto
type DadosDoMouse = { payload?: ReadonlyArray<unknown> };
function pontoDa<T>(p: DadosDoMouse): T | undefined {
  return (p.payload?.[0] as { payload?: T } | undefined)?.payload;
}
function itensDa(p: DadosDoMouse): ItemDica[] {
  return [...(p.payload ?? [])] as ItemDica[];
}

// ---------- Linha do tempo: mediana e 95%, com a meta e o limite ----------

export function LinhaDoTempo({
  pontos,
  balde,
  bom,
  ruim,
  altura = 260,
}: {
  pontos: PontoSerie[];
  balde: number;
  bom: number;
  ruim: number;
  altura?: number;
}) {
  const dados = pontos.map((p) => ({ ...p, rotulo: rotuloDoTempo(p.inicio, balde) }));

  // Teto da escala: um pico isolado (ex.: servidor acordando em 45 s) achataria
  // a mediana no chão. Acima do teto, a linha sai cortada pelo topo; a dica
  // mostra o valor real e a nota abaixo avisa.
  const medianas = pontos.map((p) => p.mediana).filter((v): v is number => v !== null);
  const p95s = pontos.map((p) => p.p95).filter((v): v is number => v !== null).sort((a, b) => a - b);
  const maiorP95 = p95s.at(-1) ?? 0;
  const teto = Math.max(ruim * 1.5, Math.max(0, ...medianas) * 1.5);
  const cortado = maiorP95 > teto * 1.05;

  return (
    <>
    <ResponsiveContainer width="100%" height={altura}>
      <LineChart data={dados} margin={{ top: 12, right: 48, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={COR.grade} />
        <XAxis dataKey="rotulo" tick={EIXO} tickLine={false} axisLine={{ stroke: COR.eixo }} minTickGap={28} />
        <YAxis
          tickFormatter={(v: number) => ms(v)}
          tick={EIXO}
          tickLine={false}
          axisLine={false}
          width={60}
          domain={[0, Math.ceil(cortado ? teto : Math.max(teto, maiorP95))]}
          allowDataOverflow={cortado}
        />
        <ReferenceLine
          y={bom}
          stroke={COR.status.bom}
          strokeDasharray="4 4"
          ifOverflow="extendDomain"
          label={{ value: "meta", position: "right", fill: COR.textoFraco, fontSize: 11 }}
        />
        <ReferenceLine
          y={ruim}
          stroke={COR.status.ruim}
          strokeDasharray="4 4"
          label={{ value: "limite", position: "right", fill: COR.textoFraco, fontSize: 11 }}
        />
        <Tooltip
          cursor={{ stroke: COR.eixo, strokeWidth: 1 }}
          content={(p) => {
            const ponto = pontoDa<PontoSerie>(p);
            return (
              <Dica
                active={p.active}
                payload={itensDa(p)}
                titulo={ponto ? `${intervaloDoTempo(ponto.inicio, balde)} · ${numero(ponto.total)} req.` : ""}
                formato={ms}
              />
            );
          }}
        />
        <Line
          type="linear"
          dataKey="mediana"
          name="Mediana"
          stroke={COR.serie1}
          strokeWidth={2}
          dot={{ r: 3, fill: COR.serie1, stroke: COR.superficie, strokeWidth: 2 }}
          activeDot={{ r: 5, stroke: COR.superficie, strokeWidth: 2 }}
          connectNulls
          isAnimationActive={false}
        />
        <Line
          type="linear"
          dataKey="p95"
          name="95% das vezes, até"
          stroke={COR.serie2}
          strokeWidth={2}
          dot={{ r: 3, fill: COR.serie2, stroke: COR.superficie, strokeWidth: 2 }}
          activeDot={{ r: 5, stroke: COR.superficie, strokeWidth: 2 }}
          connectNulls
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
    {cortado && (
      <p className="fc-grafico-nota">
        Picos acima de {ms(teto)} saem cortados pelo topo, para a mediana continuar legível (o maior chegou a {ms(maiorP95)}).
        Passe o mouse para ver o valor de cada ponto.
      </p>
    )}
    </>
  );
}

export function LegendaLinhaDoTempo() {
  return (
    <>
      <ItemLegenda cor={COR.serie1} nome="Mediana" forma="linha" />
      <ItemLegenda cor={COR.serie2} nome="95% das vezes, até" forma="linha" />
      <ItemLegenda cor={COR.status.bom} nome="Meta" forma="tracejada" />
      <ItemLegenda cor={COR.status.ruim} nome="Limite" forma="tracejada" />
    </>
  );
}

// ---------- Distribuição dos tempos (histograma) ----------

export function Histograma({ faixas, altura = 240 }: { faixas: Faixa[]; altura?: number }) {
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={faixas} margin={{ top: 18, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={COR.grade} />
        <XAxis dataKey="rotulo" tick={{ ...EIXO, fontSize: 11 }} tickLine={false} axisLine={{ stroke: COR.eixo }} minTickGap={8} />
        <YAxis allowDecimals={false} tick={EIXO} tickLine={false} axisLine={false} width={40} />
        <Tooltip
          cursor={{ fill: "rgba(11, 110, 224, 0.06)" }}
          content={(p) => {
            const f = pontoDa<Faixa>(p);
            if (!p.active || !f) return null;
            return (
              <div className="fc-dica-grafico">
                <p className="fc-dica-titulo">{f.faixa}</p>
                <p className="fc-dica-linha">
                  <span className="fc-dica-chave" style={{ background: COR.status[f.zona] }} />
                  <strong>{numero(f.total)}</strong>
                  <span>
                    requisições ({porcentagem(f.parte)}) · {f.zona === "bom" ? "rápidas" : f.zona === "atencao" ? "aceitáveis" : "lentas"}
                  </span>
                </p>
              </div>
            );
          }}
        />
        <Bar dataKey="total" name="Requisições" maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {faixas.map((f) => (
            <Cell key={f.faixa} fill={COR.status[f.zona]} />
          ))}
          <LabelList
            dataKey="total"
            position="top"
            fill={COR.texto}
            fontSize={11}
            formatter={(v) => (Number(v) > 0 ? numero(Number(v)) : "")}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LegendaZonas() {
  return (
    <>
      <ItemLegenda cor={COR.status.bom} nome="Rápido" />
      <ItemLegenda cor={COR.status.atencao} nome="Aceitável" />
      <ItemLegenda cor={COR.status.ruim} nome="Lento" />
    </>
  );
}

// ---------- Volume ao longo do tempo (colunas) ----------

type Empilhada = { chave: string; nome: string; cor: string };

export function Volume({
  pontos,
  balde,
  series,
  altura = 200,
}: {
  pontos: ReadonlyArray<{ inicio: string }>;
  balde: number;
  /** Sem séries: uma coluna só (campo "total") */
  series?: Empilhada[];
  altura?: number;
}) {
  const dados = pontos.map((p) => ({ ...p, rotulo: rotuloDoTempo(p.inicio, balde) }));
  const camadas = series ?? [{ chave: "total", nome: "Requisições", cor: COR.serie1 }];

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={COR.grade} />
        <XAxis dataKey="rotulo" tick={EIXO} tickLine={false} axisLine={{ stroke: COR.eixo }} minTickGap={28} />
        <YAxis allowDecimals={false} tick={EIXO} tickLine={false} axisLine={false} width={40} />
        <Tooltip
          cursor={{ fill: "rgba(11, 110, 224, 0.06)" }}
          content={(p) => {
            const ponto = pontoDa<{ inicio: string }>(p);
            return (
              <Dica
                active={p.active}
                payload={itensDa(p).reverse()}
                titulo={ponto ? intervaloDoTempo(ponto.inicio, balde) : ""}
                formato={numero}
              />
            );
          }}
        />
        {camadas.map((c, i) => (
          <Bar
            key={c.chave}
            dataKey={c.chave}
            name={c.nome}
            stackId={series ? "uso" : undefined}
            fill={c.cor}
            maxBarSize={24}
            // Só a última camada arredonda; o contorno branco é o espaço de 2px entre camadas
            radius={i === camadas.length - 1 ? [4, 4, 0, 0] : 0}
            stroke={series ? COR.superficie : undefined}
            strokeWidth={series ? 1 : 0}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------- Barras deitadas (comparar itens) ----------
// Em HTML: com espaço, o nome fica ao lado da barra; num cartão estreito
// (celular), o nome sobe para cima da barra e ela usa a largura toda.

export type ItemBarra = { nome: string; valor: number | null; cor?: string; detalhe?: string };

export function BarrasDeitadas({
  itens,
  formato,
  larguraRotulo = 140,
  maximo,
  monoespacado = false,
}: {
  itens: ItemBarra[];
  formato: (v: number) => string;
  larguraRotulo?: number;
  maximo?: number;
  monoespacado?: boolean;
}) {
  const maior = maximo ?? Math.max(1, ...itens.map((i) => i.valor ?? 0));

  return (
    <ul className="fc-barras" style={{ ["--rotulo" as string]: `${larguraRotulo}px` }}>
      {itens.map((i) => {
        const valor = i.valor ?? 0;
        const texto = i.valor === null ? "sem dados" : formato(valor);
        return (
          <li key={i.nome} className="fc-barra-item" tabIndex={0} aria-label={`${i.nome}: ${texto}${i.detalhe ? `, ${i.detalhe}` : ""}`}>
            <span className={"fc-barra-nome" + (monoespacado ? " fc-barra-nome--mono" : "")}>{i.nome}</span>
            <span className="fc-barra-trilho">
              <span
                className="fc-barra"
                style={{ width: `calc((100% - 72px) * ${Math.min(1, valor / maior)})`, background: i.cor ?? COR.serie1 }}
              />
              <span className="fc-barra-valor">{texto}</span>
            </span>
            {i.detalhe && (
              <span className="fc-dica-grafico fc-barra-dica" aria-hidden="true">
                <span className="fc-dica-titulo">{i.nome}</span>
                <span className="fc-dica-linha">
                  <span className="fc-dica-chave" style={{ background: i.cor ?? COR.serie1 }} />
                  <strong>{texto}</strong>
                  <span>{i.detalhe}</span>
                </span>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ---------- Para onde vai o tempo (barra empilhada simples, em HTML) ----------

export function Composicao({ partes }: { partes: { nome: string; valor: number }[] }) {
  const total = partes.reduce((s, p) => s + p.valor, 0) || 1;
  return (
    <div className="fc-composicao">
      <div className="fc-composicao-barra" role="img" aria-label={partes.map((p) => `${p.nome}: ${ms(p.valor)}`).join(", ")}>
        {partes
          .filter((p) => p.valor > 0)
          .map((p) => (
            <span
              key={p.nome}
              className="fc-composicao-parte"
              style={{ width: `${(p.valor / total) * 100}%`, background: COR.categorias[partes.indexOf(p)] }}
              title={`${p.nome}: ${ms(p.valor)}`}
            />
          ))}
      </div>
      <ul className="fc-composicao-legenda">
        {partes.map((p, i) => (
          <li key={p.nome}>
            <ItemLegenda cor={COR.categorias[i]} nome={p.nome} />
            <strong>{ms(p.valor)}</strong>
            <span>{porcentagem(p.valor / total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- Mini linha (tendência ao lado de cada área) ----------

export function MiniLinha({ valores, rotulo }: { valores: (number | null)[]; rotulo: string }) {
  const pontos = valores.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v !== null);
  if (pontos.length < 2) return <span className="fc-mini-linha fc-mini-linha--vazia" aria-hidden="true" />;

  const L = 96;
  const A = 28;
  const max = Math.max(...pontos.map((p) => p.v));
  const min = Math.min(...pontos.map((p) => p.v));
  const x = (i: number) => 3 + (i / Math.max(1, valores.length - 1)) * (L - 6);
  const y = (v: number) => 3 + (1 - (v - min) / Math.max(1, max - min)) * (A - 6);
  const ultimo = pontos[pontos.length - 1];

  return (
    <svg className="fc-mini-linha" viewBox={`0 0 ${L} ${A}`} width={L} height={A} role="img" aria-label={rotulo}>
      <polyline
        points={pontos.map((p) => `${x(p.i)},${y(p.v)}`).join(" ")}
        fill="none"
        stroke={COR.apagado}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={x(ultimo.i)} cy={y(ultimo.v)} r={3} fill={COR.serie1} stroke={COR.superficie} strokeWidth={1.5} />
    </svg>
  );
}

// ---------- Números de destaque ----------

export function Destaque({
  rotulo,
  valor,
  variacao,
  ajuda,
}: {
  rotulo: string;
  valor: string;
  variacao?: { texto: string; curto: string; melhorou: boolean | null } | null;
  ajuda?: string;
}) {
  return (
    <div className="fc-destaque-num">
      <dt>
        {rotulo}
        {ajuda && (
          <span className="fc-ajuda" title={ajuda} aria-label={ajuda}>
            ?
          </span>
        )}
      </dt>
      <dd>
        <span className="fc-destaque-valor">{valor}</span>
        {variacao && (
          <span
            className={`fc-variacao ${variacao.melhorou === null ? "" : variacao.melhorou ? "fc-variacao--melhor" : "fc-variacao--pior"}`}
            title={variacao.texto}
          >
            {variacao.melhorou === null ? "=" : variacao.melhorou ? "▼" : "▲"} {variacao.curto}
          </span>
        )}
      </dd>
    </div>
  );
}
