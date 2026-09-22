import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { iniciais, lerPerfil } from "../../lib/perfil";
import {
  CloseIcon,
  DraftIcon,
  FileIcon,
  HomeIcon,
  MoonIcon,
  PenIcon,
  SunIcon,
  UserIcon,
} from "../icons";

type Props = {
  aberto: boolean;
  fechar: () => void;
  tema: "claro" | "escuro";
  alternarTema: () => void;
};

const LINKS = [
  { to: "/", rotulo: "Início", icone: <HomeIcon />, end: true },
  { to: "/editor", rotulo: "Novo artigo", icone: <PenIcon /> },
  { to: "/meus-artigos", rotulo: "Meus artigos", icone: <FileIcon />, end: true },
  { to: "/meus-artigos?aba=rascunhos", rotulo: "Rascunhos", icone: <DraftIcon /> },
];

export default function Drawer({ aberto, fechar, tema, alternarTema }: Props) {
  const perfil = lerPerfil();

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [aberto, fechar]);

  return (
    <div className={"wr-drawer" + (aberto ? " is-open" : "")} aria-hidden={!aberto}>
      <div className="wr-drawer-backdrop" onClick={fechar} />
      <aside className="wr-drawer-panel" role="dialog" aria-label="Menu">
        <div className="wr-drawer-top">
          <span className="wr-brand wr-brand--sm">
            Write<span>.</span>
          </span>
          <div className="wr-drawer-top-actions">
            <button type="button" className="wr-icon-btn" onClick={alternarTema} aria-label="Alternar tema">
              {tema === "claro" ? <MoonIcon /> : <SunIcon />}
            </button>
            <button type="button" className="wr-icon-btn" onClick={fechar} aria-label="Fechar menu">
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="wr-drawer-user">
          <span className="wr-avatar">{iniciais(perfil.nome)}</span>
          <div>
            <strong>{perfil.nome}</strong>
            {perfil.email && <small>{perfil.email}</small>}
          </div>
        </div>

        <nav className="wr-drawer-nav">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} onClick={fechar} className="wr-side-link">
              {l.icone}
              {l.rotulo}
            </NavLink>
          ))}
          <hr />
          <NavLink to="/perfil" onClick={fechar} className="wr-side-link">
            <UserIcon />
            Perfil
          </NavLink>
        </nav>
      </aside>
    </div>
  );
}
