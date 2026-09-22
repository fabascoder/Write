import { useState, type FormEvent } from "react";
import { iniciais, lerPerfil, salvarPerfil } from "../../lib/perfil";
import { Head } from "../layout/Head";

export default function Perfil() {
  const [perfil, setPerfil] = useState(lerPerfil);
  const [salvo, setSalvo] = useState(false);

  function enviar(e: FormEvent) {
    e.preventDefault();
    salvarPerfil(perfil);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  }

  const mudar = (campo: keyof typeof perfil) => (valor: string) =>
    setPerfil({ ...perfil, [campo]: valor });

  return (
    <main className="wr-main wr-main--narrow">
      <Head title="Perfil" description="Seus dados de autor." />
      <h1 className="wr-page-title">Perfil</h1>
      <p className="wr-page-sub">Aparece no menu e, no futuro, na assinatura dos textos.</p>

      <form className="wr-profile" onSubmit={enviar}>
        <div className="wr-profile-avatar">
          <span className="wr-avatar wr-avatar--lg">{iniciais(perfil.nome)}</span>
        </div>

        <label className="wr-field">
          <span>Nome</span>
          <input value={perfil.nome} onChange={(e) => mudar("nome")(e.target.value)} required />
        </label>
        <label className="wr-field">
          <span>E-mail</span>
          <input type="email" value={perfil.email} onChange={(e) => mudar("email")(e.target.value)} placeholder="voce@email.com" />
        </label>
        <label className="wr-field">
          <span>Sobre você</span>
          <textarea rows={4} value={perfil.sobre} onChange={(e) => mudar("sobre")(e.target.value)} placeholder="Algumas linhas sobre quem escreve aqui" />
        </label>

        <div className="wr-editor-actions">
          <button type="submit" className="wr-btn wr-btn--primary">Salvar alterações</button>
          {salvo && <span className="wr-status wr-status--ok" role="status">Alterações salvas</span>}
        </div>
      </form>
    </main>
  );
}
