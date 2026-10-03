import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buscarLeitura, buscarTempoUsuarios, duracao, type LeituraArtigo, type TempoUsuario } from "../../lib/engajamento";
import { tempoRelativo } from "../../lib/format";
import { porcentagem } from "../../lib/graficos";
import { ArrowRightIcon } from "../icons";

// Resumo no painel do admin: quem mais ficou logado e quanto tempo leem cada artigo.
// (Sem a biblioteca de gráficos, para o painel abrir leve.)
export default function Engajamento({ podeUsuarios, podeArtigos }: { podeUsuarios: boolean; podeArtigos: boolean }) {
  const [usuarios, setUsuarios] = useState<TempoUsuario[] | null>(null);
  const [artigos, setArtigos] = useState<LeituraArtigo[] | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    if (podeUsuarios) buscarTempoUsuarios(30).then((r) => ativo && setUsuarios(r.usuarios)).catch((e) => ativo && setErro(e.message));
    if (podeArtigos) buscarLeitura(30).then((r) => ativo && setArtigos(r.artigos)).catch((e) => ativo && setErro(e.message));
    return () => {
      ativo = false;
    };
  }, [podeUsuarios, podeArtigos]);

  const maisLogados = (usuarios ?? []).filter((u) => u.segundos > 0).slice(0, 5);
  const maisLidos = [...(artigos ?? [])].filter((a) => a.leituras > 0).sort((a, b) => b.leituras - a.leituras).slice(0, 5);

  return (
    <section className="fc-engaj">
      <h2 className="fc-rotulo">Uso e leitura · últimos 30 dias</h2>
      {erro && <p className="fc-estado fc-estado--erro">{erro}</p>}

      <div className="fc-engaj-grade">
        {podeUsuarios && (
          <div className="fc-engaj-cartao">
            <div className="fc-engaj-topo">
              <h3>Tempo logado</h3>
              <Link to="/admin/usuarios">
                Todos os usuários <ArrowRightIcon />
              </Link>
            </div>
            {usuarios === null ? (
              <p className="fc-engaj-vazio">Carregando…</p>
            ) : maisLogados.length === 0 ? (
              <p className="fc-engaj-vazio">Ninguém usou o site logado ainda neste período.</p>
            ) : (
              <ol className="fc-engaj-lista">
                {maisLogados.map((u) => (
                  <li key={u.id}>
                    <span className="fc-engaj-nome">
                      <strong>{u.nome}</strong>
                      <small>
                        {u.sessoes} {u.sessoes === 1 ? "sessão" : "sessões"} · média {duracao(u.mediaSessao)}
                        {u.ultimaVez && ` · visto ${tempoRelativo(u.ultimaVez)}`}
                      </small>
                    </span>
                    <span className="fc-engaj-valor">{duracao(u.segundos)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {podeArtigos && (
          <div className="fc-engaj-cartao">
            <div className="fc-engaj-topo">
              <h3>Tempo médio de leitura</h3>
              <Link to="/admin/leitura">
                Todos os artigos <ArrowRightIcon />
              </Link>
            </div>
            {artigos === null ? (
              <p className="fc-engaj-vazio">Carregando…</p>
            ) : maisLidos.length === 0 ? (
              <p className="fc-engaj-vazio">Ainda não há leituras neste período.</p>
            ) : (
              <ol className="fc-engaj-lista">
                {maisLidos.map((a) => (
                  <li key={a.id}>
                    <span className="fc-engaj-nome">
                      <Link to={`/artigo/${a.id}`}>
                        <strong>{a.titulo}</strong>
                      </Link>
                      <small>
                        {a.leituras} {a.leituras === 1 ? "leitura" : "leituras"} · {porcentagem(a.chegaramAoFim)} até o fim · texto pede{" "}
                        {duracao(a.estimadoSegundos)}
                      </small>
                    </span>
                    <span className="fc-engaj-valor">{duracao(a.mediaSegundos)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
