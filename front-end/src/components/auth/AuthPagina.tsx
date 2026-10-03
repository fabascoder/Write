import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { EyeIcon, EyeOffIcon } from "../icons";
import { Head } from "../layout/Head";

// Moldura das telas de entrar e cadastro: a marca no topo, um título e o formulário.
// Fica fora do layout do site (sem cabeçalho e rodapé), como nos templates.
export function AuthPagina({
  titulo,
  tituloAba,
  aviso,
  children,
}: {
  titulo: ReactNode;
  tituloAba: string;
  aviso?: string;
  children: ReactNode;
}) {
  return (
    <main className="fc-login">
      <Head title={tituloAba} description="Entre ou crie sua conta no Fabas Coder Blog." />

      <div className="fc-login-coluna">
        <Link to="/" className="fc-brand fc-login-marca" aria-label="Fabas Coder Blog, página principal">
          <strong>FABAS CODER</strong> <span>Blog</span>
        </Link>

        <h1 className="fc-login-titulo">{titulo}</h1>

        {aviso && (
          <p className="fc-login-aviso" role="status">
            {aviso}
          </p>
        )}

        {children}
      </div>
    </main>
  );
}

type CampoProps = InputHTMLAttributes<HTMLInputElement> & {
  rotulo: string;
  erro?: string;
};

// Rótulo + campo + mensagem de erro logo abaixo
export function Campo({ rotulo, erro, ...input }: CampoProps) {
  const id = useId();
  return (
    <div className="fc-login-campo">
      <label htmlFor={id}>{rotulo}</label>
      <input id={id} aria-invalid={erro ? true : undefined} aria-describedby={erro ? `${id}-erro` : undefined} {...input} />
      {erro && (
        <p id={`${id}-erro`} className="fc-login-erro">
          {erro}
        </p>
      )}
    </div>
  );
}

// Campo de senha com o olho para mostrar/esconder
export function CampoSenha({ rotulo, erro, ...input }: CampoProps) {
  const id = useId();
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="fc-login-campo">
      <label htmlFor={id}>{rotulo}</label>
      <div className="fc-login-senha">
        <input
          id={id}
          type={visivel ? "text" : "password"}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? `${id}-erro` : undefined}
          {...input}
        />
        <button
          type="button"
          className="fc-login-olho"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? "Esconder senha" : "Mostrar senha"}
          aria-pressed={visivel}
        >
          {visivel ? <EyeIcon /> : <EyeOffIcon />}
        </button>
      </div>
      {erro && (
        <p id={`${id}-erro`} className="fc-login-erro">
          {erro}
        </p>
      )}
    </div>
  );
}
