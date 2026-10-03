import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { atualizarNome, NOME_ROLE } from "../../lib/autenticacao";
import { dataPorExtenso } from "../../lib/format";
import { iniciais } from "../../lib/perfil";
import { LogOutIcon, ShieldIcon } from "../icons";
import { Head } from "../layout/Head";

// /perfil — área de quem está logado (leitor ou admin)
export default function Perfil() {
  const { usuario, atualizarUsuario, sair, pode } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [status, setStatus] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [salvando, setSalvando] = useState(false);

  if (!usuario) return null; // a RotaProtegida já garante que existe

  async function salvar(e: FormEvent) {
    e.preventDefault();
    try {
      setSalvando(true);
      setStatus(null);
      atualizarUsuario(await atualizarNome(nome.trim()));
      setStatus({ tipo: "ok", texto: "Alterações salvas." });
    } catch (e) {
      setStatus({ tipo: "erro", texto: e instanceof Error ? e.message : "Não foi possível salvar." });
    } finally {
      setSalvando(false);
    }
  }

  async function desconectar() {
    await sair();
    navigate("/");
  }

  return (
    <main className="fc-main fc-main--simples fc-perfil-pagina">
      <Head title="Meu perfil" description="Sua conta no Fabas Coder Blog." />

      <h1 className="fc-titulo-pagina">Meu perfil</h1>

      <section className="fc-perfil">
        <div className="fc-perfil-topo">
          <span className="fc-perfil-avatar" aria-hidden="true">
            {iniciais(usuario.nome)}
          </span>
          <div>
            <p className="fc-perfil-nome">{usuario.nome}</p>
            <p className="fc-perfil-info">
              <span className="fc-perfil-role">{NOME_ROLE[usuario.role]}</span>
              {usuario.dataCriacao && <span>desde {dataPorExtenso(usuario.dataCriacao)}</span>}
            </p>
          </div>
        </div>

        <form className="fc-form fc-perfil-form" onSubmit={salvar}>
          <label className="fc-campo">
            <span>Nome</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} minLength={2} maxLength={80} required />
          </label>

          <label className="fc-campo">
            <span>Email</span>
            <input value={usuario.email} readOnly aria-readonly="true" />
          </label>

          {usuario.provedores.includes("google") && (
            <p className="fc-perfil-google">Conta conectada ao Google.</p>
          )}

          {status && (
            <p className={status.tipo === "ok" ? "fc-ok" : "fc-erro"} role="status">
              {status.texto}
            </p>
          )}

          <div className="fc-perfil-acoes">
            <button type="submit" className="fc-btn fc-btn--primario" disabled={salvando || nome.trim() === usuario.nome}>
              {salvando ? "Salvando…" : "Salvar"}
            </button>
            {pode("admin:acessar") && (
              <Link to="/admin" className="fc-btn fc-btn--contorno">
                <ShieldIcon />
                Painel administrativo
              </Link>
            )}
            <button type="button" className="fc-btn fc-btn--contorno" onClick={desconectar}>
              <LogOutIcon />
              Sair
            </button>
          </div>
        </form>
      </section>

      <p className="fc-estado">Favoritos, livros acompanhados e notificações vão aparecer aqui em breve.</p>
    </main>
  );
}
