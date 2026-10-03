import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  desconectarConta,
  esquecerConta,
  lerContasConhecidas,
  listarContasConectadas,
  sairDeTodas,
  type Role,
} from "../../lib/autenticacao";
import { tempoRelativo } from "../../lib/format";
import { iniciais } from "../../lib/perfil";
import { AuthPagina } from "../auth/AuthPagina";
import { FotoConta } from "../auth/FotoConta";

type Conta = {
  id: number;
  nome: string;
  email: string;
  role: Role;
  foto?: string | null;
  /** Tem login guardado neste navegador: dá para trocar sem senha */
  conectada: boolean;
  /** É a conta em uso agora */
  ativa: boolean;
  ultimaVez?: string;
};

// Junta as contas conectadas (servidor) com as que já passaram por aqui (localStorage)
async function montarLista(): Promise<Conta[]> {
  const conhecidas = lerContasConhecidas();
  const conectadas = await listarContasConectadas().catch(() => []);
  const mapa = new Map<number, Conta>();
  for (const c of conhecidas) mapa.set(c.id, { ...c, conectada: false, ativa: false });
  for (const c of conectadas) {
    mapa.set(c.id, { ...mapa.get(c.id), id: c.id, nome: c.nome, email: c.email, role: c.role, foto: c.foto, conectada: true, ativa: c.ativa });
  }
  const ordem = (c: Conta) => (c.ativa ? 0 : c.conectada ? 1 : 2);
  return [...mapa.values()].sort((a, b) => ordem(a) - ordem(b));
}

// /contas — escolher, trocar ou sair das contas usadas neste navegador (como no GitHub)
export default function Contas() {
  const { usuario, sair, trocarConta } = useAuth();
  const navigate = useNavigate();
  const [contas, setContas] = useState<Conta[] | null>(null);
  const [ocupada, setOcupada] = useState<number | "todas" | null>(null);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => setContas(await montarLista()), []);

  useEffect(() => {
    let ativo = true;
    montarLista().then((lista) => ativo && setContas(lista));
    return () => {
      ativo = false;
    };
  }, [usuario?.id]);

  async function acao(id: number | "todas", fazer: () => Promise<unknown>) {
    try {
      setOcupada(id);
      setErro("");
      await fazer();
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível agora.");
    } finally {
      setOcupada(null);
    }
  }

  async function usar(c: Conta) {
    if (!c.conectada) {
      // Desconectada: entra de novo com a senha (e-mail já preenchido)
      navigate(`/entrar?email=${encodeURIComponent(c.email)}`);
      return;
    }
    await acao(c.id, async () => {
      const u = await trocarConta(c.id);
      navigate(u.permissoes.includes("admin:acessar") ? "/admin" : "/", { replace: true });
    });
  }

  const algumaConectada = contas?.some((c) => c.conectada);

  return (
    <AuthPagina
      tituloAba="Contas"
      titulo={
        usuario ? (
          <>
            Escolha a conta para <em>sair</em> ou <em>trocar</em>.
          </>
        ) : (
          <>
            Escolha uma <em>conta</em>.
          </>
        )
      }
    >
      {contas === null ? (
        <p className="fc-estado">Carregando…</p>
      ) : contas.length === 0 ? (
        <p className="fc-estado">Nenhuma conta foi usada neste navegador ainda.</p>
      ) : (
        <ul className="fc-contas">
          {contas.map((c) => {
            const admin = c.role === "admin";
            const status = c.ativa ? "Conectada agora" : c.conectada ? "Conectada · clique para usar" : "Desconectada · entre com a senha";
            return (
              <li key={c.id} className={"fc-conta-item" + (admin ? " fc-conta-item--admin" : "") + (c.ativa ? " is-ativa" : "")}>
                <button
                  type="button"
                  className="fc-conta-escolher"
                  onClick={() => usar(c)}
                  disabled={c.ativa || ocupada !== null}
                  aria-label={c.ativa ? `${c.nome}, conta em uso` : `Usar a conta de ${c.nome}`}
                >
                  <FotoConta foto={c.foto} className="fc-conta-iniciais fc-conta-foto">
                    <span className="fc-conta-iniciais" aria-hidden="true">
                      {iniciais(c.nome)}
                    </span>
                  </FotoConta>
                  <span className="fc-conta-dados">
                    <span className="fc-conta-linha">
                      <strong>{c.nome}</strong>
                      {admin && <span className="fc-conta-etiqueta">Admin</span>}
                    </span>
                    <small>{c.email}</small>
                    <small className={c.conectada ? "fc-conta-on" : "fc-conta-off"}>
                      {status}
                      {!c.conectada && c.ultimaVez ? ` · última vez ${tempoRelativo(c.ultimaVez)}` : ""}
                    </small>
                  </span>
                </button>

                {c.conectada ? (
                  <button
                    type="button"
                    className="fc-btn fc-btn--contorno fc-btn--pequeno"
                    disabled={ocupada !== null}
                    onClick={() => acao(c.id, () => (c.ativa ? sair() : desconectarConta(c.id)))}
                  >
                    {ocupada === c.id ? "Saindo…" : "Sair"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="fc-btn fc-btn--contorno fc-btn--pequeno"
                    disabled={ocupada !== null}
                    onClick={() => acao(c.id, async () => esquecerConta(c.id))}
                  >
                    Remover
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {erro && (
        <p className="fc-login-erro fc-login-erro--geral" role="alert">
          {erro}
        </p>
      )}

      <div className="fc-contas-acoes">
        <Link to="/entrar?outra=1" className="fc-login-google fc-contas-outra">
          <span>Entrar com outra conta</span>
        </Link>
        {algumaConectada && (
          <button
            type="button"
            className="fc-contas-todas"
            disabled={ocupada !== null}
            onClick={() =>
              acao("todas", async () => {
                await sairDeTodas();
                await sair();
              })
            }
          >
            {ocupada === "todas" ? "Saindo…" : "Sair de todas as contas"}
          </button>
        )}
      </div>

      <p className="fc-login-troca">
        <Link to="/">Voltar para o site</Link>
      </p>
    </AuthPagina>
  );
}
