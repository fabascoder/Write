import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CATEGORIAS } from "../../lib/categorias";
import Brand from "./Brand";
import { ChevronDownIcon, CloseIcon, MenuIcon, SearchIcon } from "../icons";

type Props = {
  /** No editor o cabeçalho fica só com a marca e o idioma, como no layout */
  simples?: boolean;
};

export default function Header({ simples = false }: Props) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [aberto, setAberto] = useState(false);
  const [menuMobile, setMenuMobile] = useState(false);
  const [busca, setBusca] = useState(params.get("busca") ?? "");
  const dropdown = useRef<HTMLDivElement>(null);

  const categoriaAtiva = params.get("categoria");

  useEffect(() => {
    setBusca(params.get("busca") ?? "");
  }, [params]);

  useEffect(() => {
    function fora(e: MouseEvent) {
      if (dropdown.current && !dropdown.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  function irPara(categoria: string | null) {
    setAberto(false);
    setMenuMobile(false);
    navigate(categoria ? `/?categoria=${categoria}` : "/");
  }

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    const texto = busca.trim();
    navigate(texto ? `/?busca=${encodeURIComponent(texto)}` : "/");
    setMenuMobile(false);
  }

  return (
    <header className="fc-header">
      <Brand />

      {!simples && (
        <>
          <div className={"fc-header-nav" + (menuMobile ? " is-open" : "")}>
            <div className="fc-dropdown" ref={dropdown}>
              <button
                type="button"
                className={"fc-dropdown-btn" + (aberto ? " is-open" : "")}
                onClick={() => setAberto((a) => !a)}
                aria-expanded={aberto}
              >
                categorias
                <ChevronDownIcon />
              </button>

              <div className={"fc-dropdown-menu" + (aberto ? " is-open" : "")}>
                <button type="button" onClick={() => irPara(null)} className={!categoriaAtiva ? "is-active" : ""}>
                  Todos
                </button>
                {CATEGORIAS.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => irPara(c.slug)}
                    className={categoriaAtiva === c.slug ? "is-active" : ""}
                  >
                    {c.nome}
                  </button>
                ))}
              </div>
            </div>

            <form className="fc-search" onSubmit={buscar} role="search">
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar artigo"
                aria-label="Buscar artigo pelo título"
              />
              <button type="submit" aria-label="Buscar">
                <SearchIcon />
              </button>
            </form>
          </div>

          <button
            type="button"
            className="fc-icon-btn fc-only-mobile"
            onClick={() => setMenuMobile((m) => !m)}
            aria-label={menuMobile ? "Fechar menu" : "Abrir menu"}
          >
            {menuMobile ? <CloseIcon /> : <MenuIcon />}
          </button>
        </>
      )}

      <div className="fc-lang" aria-label="Idioma">
        <button type="button" className="is-active" aria-current="true">
          PT
        </button>
        <span aria-hidden="true">|</span>
        <button type="button" disabled title="Tradução ainda não disponível">
          EN
        </button>
      </div>
    </header>
  );
}
