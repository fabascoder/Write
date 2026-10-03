import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { atualizarNome, enviarFoto, NOME_ROLE, removerFoto } from "../../lib/autenticacao";
import { dataPorExtenso } from "../../lib/format";
import { prepararFoto, TIPOS_ACEITOS } from "../../lib/foto";
import { iniciais } from "../../lib/perfil";
import { FotoConta } from "../auth/FotoConta";
import { CameraIcon, LogOutIcon, ShieldIcon } from "../icons";
import { Head } from "../layout/Head";

// /perfil — área de quem está logado (leitor ou admin)
export default function Perfil() {
  const { usuario, atualizarUsuario, pode } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [status, setStatus] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [foto, setFoto] = useState<{ enviando: boolean; aviso: { tipo: "ok" | "erro"; texto: string } | null }>({
    enviando: false,
    aviso: null,
  });
  const arquivoRef = useRef<HTMLInputElement>(null);

  if (!usuario) return null; // a RotaProtegida já garante que existe

  async function mudarFoto(fazer: () => Promise<typeof usuario>, sucesso: string) {
    try {
      setFoto({ enviando: true, aviso: null });
      const atualizado = await fazer();
      if (atualizado) atualizarUsuario(atualizado);
      setFoto({ enviando: false, aviso: { tipo: "ok", texto: sucesso } });
    } catch (e) {
      setFoto({ enviando: false, aviso: { tipo: "erro", texto: e instanceof Error ? e.message : "Não foi possível salvar a foto." } });
    }
  }

  function escolherFoto(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (arquivo) mudarFoto(async () => enviarFoto(await prepararFoto(arquivo)), "Foto atualizada.");
  }

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

  // Abre a escolha de contas (sair desta, trocar ou sair de todas)
  function desconectar() {
    navigate("/contas");
  }

  return (
    <main className="fc-main fc-main--simples fc-perfil-pagina">
      <Head title="Meu perfil" description="Sua conta no Fabas Coder Blog." />

      <h1 className="fc-titulo-pagina">Meu perfil</h1>

      <section className="fc-perfil">
        <div className="fc-perfil-topo">
          <button
            type="button"
            className="fc-perfil-foto"
            onClick={() => arquivoRef.current?.click()}
            disabled={foto.enviando}
            aria-label={usuario.foto ? "Trocar foto de perfil" : "Adicionar foto de perfil"}
            title={usuario.foto ? "Trocar foto" : "Adicionar foto"}
          >
            <FotoConta foto={usuario.foto} className="fc-perfil-avatar">
              <span className="fc-perfil-avatar" aria-hidden="true">
                {iniciais(usuario.nome)}
              </span>
            </FotoConta>
            <span className="fc-perfil-foto-camera" aria-hidden="true">
              <CameraIcon />
            </span>
          </button>
          <input ref={arquivoRef} type="file" accept={TIPOS_ACEITOS} onChange={escolherFoto} hidden />

          <div>
            <p className="fc-perfil-nome">{usuario.nome}</p>
            <p className="fc-perfil-info">
              <span className="fc-perfil-role">{NOME_ROLE[usuario.role]}</span>
              {usuario.dataCriacao && <span>desde {dataPorExtenso(usuario.dataCriacao)}</span>}
            </p>
            <p className="fc-perfil-foto-acoes">
              <button type="button" onClick={() => arquivoRef.current?.click()} disabled={foto.enviando}>
                {foto.enviando ? "Salvando foto…" : usuario.foto ? "Trocar foto" : "Adicionar foto"}
              </button>
              {usuario.foto && !foto.enviando && (
                <button type="button" onClick={() => mudarFoto(removerFoto, "Foto removida.")}>
                  Remover
                </button>
              )}
            </p>
          </div>
        </div>

        {foto.aviso && (
          <p className={(foto.aviso.tipo === "ok" ? "fc-ok" : "fc-erro") + " fc-perfil-foto-aviso"} role="status">
            {foto.aviso.texto}
          </p>
        )}

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
