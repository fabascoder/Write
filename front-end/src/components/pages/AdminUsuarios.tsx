import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { listarUsuarios, mudarRole, NOME_ROLE, type Role, type UsuarioResumo } from "../../lib/autenticacao";
import { dataPorExtenso } from "../../lib/format";
import { ArrowLeftIcon } from "../icons";
import { Head } from "../layout/Head";

const ROLES = Object.keys(NOME_ROLE) as Role[];

// /admin/usuarios — contas e tipo de acesso de cada uma.
// O back-end confere de novo a permissão em cada mudança.
export default function AdminUsuarios() {
  const { usuario: eu } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [salvandoId, setSalvandoId] = useState<number | null>(null);

  useEffect(() => {
    let ativo = true;
    listarUsuarios()
      .then((lista) => ativo && setUsuarios(lista))
      .catch((e) => ativo && setAviso({ tipo: "erro", texto: e.message }))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, []);

  async function trocarRole(u: UsuarioResumo, role: Role) {
    try {
      setSalvandoId(u.id);
      setAviso(null);
      const atualizado = await mudarRole(u.id, role);
      setUsuarios((lista) => lista.map((x) => (x.id === u.id ? atualizado : x)));
      setAviso({ tipo: "ok", texto: `${u.nome} agora é ${NOME_ROLE[role].toLowerCase()}.` });
    } catch (e) {
      setAviso({ tipo: "erro", texto: e instanceof Error ? e.message : "Não foi possível salvar." });
    } finally {
      setSalvandoId(null);
    }
  }

  return (
    <main className="fc-main fc-main--simples">
      <Head title="Usuários" description="Contas do Fabas Coder Blog." />

      <div className="fc-topo">
        <Link to="/admin" className="fc-voltar" aria-label="Voltar ao painel">
          <ArrowLeftIcon />
        </Link>
      </div>

      <h1 className="fc-titulo-pagina">Usuários</h1>

      {aviso && (
        <p className={aviso.tipo === "ok" ? "fc-ok fc-usuarios-aviso" : "fc-erro fc-usuarios-aviso"} role="status">
          {aviso.texto}
        </p>
      )}

      {carregando ? (
        <p className="fc-estado">Carregando usuários…</p>
      ) : (
        <ul className="fc-usuarios">
          {usuarios.map((u) => {
            const souEu = u.id === eu?.id;
            return (
              <li key={u.id} className="fc-usuarios-item">
                <div className="fc-usuarios-dados">
                  <strong>
                    {u.nome}
                    {souEu && <>{" "}<span className="fc-usuarios-voce">você</span></>}
                  </strong>
                  <span>{u.email}</span>
                  {u.dataCriacao && <small>desde {dataPorExtenso(u.dataCriacao)}</small>}
                </div>

                <label className="fc-campo fc-usuarios-role">
                  <span>Tipo de conta</span>
                  <select
                    value={u.role}
                    disabled={souEu || salvandoId === u.id}
                    title={souEu ? "Você não pode mudar o tipo da sua própria conta" : undefined}
                    onChange={(e) => trocarRole(u, e.target.value as Role)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {NOME_ROLE[r]}
                      </option>
                    ))}
                  </select>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
