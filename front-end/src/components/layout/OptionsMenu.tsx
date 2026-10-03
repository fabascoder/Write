import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { copiarTexto, tituloCompartilhar, type TipoCompartilhamento } from "../../lib/compartilhar";
import { ChevronRightIcon, LinkIcon, MoreIcon, PaletteIcon, ShareIcon } from "../icons";
import ShareDialog from "./ShareDialog";
import Toast from "./Toast";

type Props = {
  title: string;
  /** Trecho ou descrição mostrado no cartão personalizado */
  text?: string;
  /** Sem url, usa a página atual */
  url?: string;
  type?: TipoCompartilhamento;
  /** Imagem de capa, se existir */
  image?: string;
  /** Número do capítulo, quando type="chapter" */
  chapter?: number;
  /** Data mostrada no cartão personalizado */
  date?: string;
  /** Caminho do cartão personalizado (ex.: /embed/artigo/2). Ativa "Personalizar" */
  embedPath?: string;
};

type Aviso = { id: number; texto: string; erro: boolean };

// Menu "..." de opções. Por enquanto só tem "Compartilhar", com um submenu
// para copiar o link e personalizar. Vale para artigos, livros e capítulos.
export default function OptionsMenu({ title, text, url, type = "article", image, chapter, date, embedPath }: Props) {
  const [aberto, setAberto] = useState(false);
  const [submenu, setSubmenu] = useState(false);
  const [modal, setModal] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const caixaRef = useRef<HTMLDivElement>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const compartilharRef = useRef<HTMLButtonElement>(null);

  const fecharMenu = useCallback((devolverFoco = false) => {
    setAberto(false);
    setSubmenu(false);
    if (devolverFoco) botaoRef.current?.focus();
  }, []);

  // Clique fora fecha o menu
  useEffect(() => {
    if (!aberto) return;
    function fora(e: MouseEvent) {
      if (!caixaRef.current?.contains(e.target as Node)) fecharMenu();
    }
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [aberto, fecharMenu]);

  // Ao abrir, o foco vai para o primeiro item
  useEffect(() => {
    if (aberto) compartilharRef.current?.focus();
  }, [aberto]);

  // Ao abrir o submenu pelo teclado, o foco vai para o primeiro item dele
  useEffect(() => {
    if (submenu) caixaRef.current?.querySelector<HTMLElement>(".fc-opcoes-sub [role=menuitem]")?.focus();
  }, [submenu]);

  function teclado(e: KeyboardEvent) {
    // O modal e o aviso usam portal, mas os eventos do React sobem até aqui mesmo assim
    if (!aberto || !caixaRef.current?.contains(e.target as Node)) return;

    if (e.key === "Escape") {
      e.preventDefault();
      if (submenu) {
        setSubmenu(false);
        compartilharRef.current?.focus();
      } else {
        fecharMenu(true);
      }
      return;
    }
    if (e.key === "ArrowLeft" && submenu) {
      e.preventDefault();
      setSubmenu(false);
      compartilharRef.current?.focus();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const itens = [...(caixaRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
      const atual = itens.indexOf(document.activeElement as HTMLElement);
      const passo = e.key === "ArrowDown" ? 1 : -1;
      itens[(atual + passo + itens.length) % itens.length]?.focus();
    }
  }

  async function copiarLink() {
    const ok = await copiarTexto(url ?? window.location.href);
    fecharMenu(true);
    setAviso({
      id: Date.now(),
      texto: ok ? "Link copiado para a área de transferência" : "Não deu para copiar o link",
      erro: !ok,
    });
  }

  function personalizar() {
    fecharMenu();
    setModal(true);
  }

  const fecharModal = useCallback(() => {
    setModal(false);
    botaoRef.current?.focus();
  }, []);

  const fecharAviso = useCallback(() => setAviso(null), []);

  return (
    <div className="fc-opcoes" ref={caixaRef} onKeyDown={teclado}>
      <button
        ref={botaoRef}
        type="button"
        className={"fc-icon-btn fc-opcoes-botao" + (aberto ? " is-open" : "")}
        onClick={() => (aberto ? fecharMenu() : setAberto(true))}
        aria-label="Opções"
        title="Opções"
        aria-haspopup="menu"
        aria-expanded={aberto}
      >
        <MoreIcon />
      </button>

      {aberto && (
        <div className="fc-opcoes-menu" role="menu" aria-label="Opções">
          <div className="fc-opcoes-grupo">
            <button
              ref={compartilharRef}
              type="button"
              role="menuitem"
              className={"fc-opcoes-item" + (submenu ? " is-open" : "")}
              aria-haspopup="menu"
              aria-expanded={submenu}
              onClick={() => setSubmenu((s) => !s)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSubmenu(true);
                }
              }}
            >
              <ShareIcon />
              Compartilhar
              <span className="fc-opcoes-seta">
                <ChevronRightIcon />
              </span>
            </button>

            {submenu && (
              <div className="fc-opcoes-sub" role="menu" aria-label={tituloCompartilhar(type)}>
                <button type="button" role="menuitem" className="fc-opcoes-item" onClick={copiarLink}>
                  <LinkIcon />
                  Copiar link
                </button>
                {embedPath && (
                  <button type="button" role="menuitem" className="fc-opcoes-item" onClick={personalizar}>
                    <PaletteIcon />
                    Personalizar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {modal && embedPath && (
        <ShareDialog
          fechar={fecharModal}
          title={title}
          text={text}
          url={url ?? window.location.href}
          type={type}
          image={image}
          chapter={chapter}
          date={date}
          embedPath={embedPath}
        />
      )}

      {aviso && <Toast key={aviso.id} mensagem={aviso.texto} erro={aviso.erro} fechar={fecharAviso} />}
    </div>
  );
}
