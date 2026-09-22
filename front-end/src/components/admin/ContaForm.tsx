import { useState, type FormEvent } from "react";
import { lerCredenciais, salvarCredenciais } from "../../lib/auth";

// Dados de acesso do administrador (ficam salvos apenas neste navegador)
export default function ContaForm() {
  const [dados, setDados] = useState(lerCredenciais);
  const [salvo, setSalvo] = useState(false);

  function enviar(e: FormEvent) {
    e.preventDefault();
    salvarCredenciais(dados);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  }

  const mudar = (campo: keyof typeof dados) => (valor: string) =>
    setDados({ ...dados, [campo]: valor });

  return (
    <section className="fc-conta">
      <hr className="fc-conta-regua" />
      <form className="fc-conta-form" onSubmit={enviar}>
        <label className="fc-campo">
          <span>Autor</span>
          <input value={dados.autor} onChange={(e) => mudar("autor")(e.target.value)} />
        </label>
        <label className="fc-campo">
          <span>Email</span>
          <input type="email" value={dados.email} onChange={(e) => mudar("email")(e.target.value)} />
        </label>
        <label className="fc-campo">
          <span>Senha</span>
          <input
            type="password"
            value={dados.senha}
            onChange={(e) => mudar("senha")(e.target.value)}
          />
        </label>

        <div className="fc-conta-acoes">
          <button type="submit" className="fc-btn fc-btn--primario">
            Salvar
          </button>
          {salvo && <span className="fc-ok" role="status">Dados salvos</span>}
        </div>
      </form>
    </section>
  );
}
