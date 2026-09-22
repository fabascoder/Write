import { useMemo, useState, type KeyboardEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { publicarArtigo } from "../../lib/api";
import { CATEGORIAS } from "../../lib/categorias";
import { lerRascunhos, removerRascunho, salvarRascunho } from "../../lib/rascunhos";
import { ArrowLeftIcon, CloseIcon } from "../icons";
import { Head } from "../layout/Head";

const MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ align: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "link"],
    ["clean"],
  ],
};

const FORMATS = ["header", "bold", "italic", "underline", "strike", "align", "list", "blockquote", "link"];

type Status = { tipo: "ok" | "erro"; texto: string } | null;

export default function Editor() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const rascunhoInicial = useMemo(() => {
    const id = params.get("rascunho");
    return id ? lerRascunhos().find((r) => r.id === id) : undefined;
  }, [params]);

  const [rascunhoId] = useState(rascunhoInicial?.id ?? crypto.randomUUID());
  const [titulo, setTitulo] = useState(rascunhoInicial?.titulo ?? "");
  const [texto, setTexto] = useState(rascunhoInicial?.conteudoHtml ?? "");
  const [categoria, setCategoria] = useState(rascunhoInicial?.categoria ?? "");
  const [tags, setTags] = useState<string[]>(rascunhoInicial?.tags ?? []);
  const [tagDigitada, setTagDigitada] = useState("");
  const [publicando, setPublicando] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const textoVazio = texto.replace(/<[^>]*>/g, "").trim() === "";

  function adicionarTag(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" && e.key !== ",") return;
    e.preventDefault();
    const nova = tagDigitada.trim().replace(/,$/, "");
    if (nova && !tags.includes(nova)) setTags([...tags, nova]);
    setTagDigitada("");
  }

  function guardarRascunho() {
    salvarRascunho({
      id: rascunhoId,
      titulo: titulo.trim() || "Sem título",
      conteudoHtml: texto,
      categoria,
      tags,
      atualizadoEm: new Date().toISOString(),
    });
    setStatus({ tipo: "ok", texto: "Rascunho salvo neste navegador." });
  }

  async function publicar() {
    if (!titulo.trim()) return setStatus({ tipo: "erro", texto: "Dê um título ao texto antes de publicar." });
    if (textoVazio) return setStatus({ tipo: "erro", texto: "Escreva alguma coisa antes de publicar." });

    try {
      setPublicando(true);
      setStatus(null);
      await publicarArtigo({
        titulo: titulo.trim(),
        conteudoHtml: texto,
        categoria: categoria || undefined,
        tags,
      });
      removerRascunho(rascunhoId);
      navigate("/");
    } catch (e) {
      console.error(e);
      setStatus({ tipo: "erro", texto: "Não foi possível publicar. Confira se a API está rodando." });
    } finally {
      setPublicando(false);
    }
  }

  return (
    <main className="wr-main">
      <Head title="Escrever" description="Editor de textos do Write." />

      <Link to="/" className="wr-back">
        <ArrowLeftIcon />
        Voltar
      </Link>
      <h1 className="wr-page-title">{rascunhoInicial ? "Continuar rascunho" : "Novo texto"}</h1>

      <div className="wr-editor">
        <div className="wr-editor-paper">
          <input
            className="wr-editor-title"
            placeholder="Título do texto"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            aria-label="Título"
          />
          <ReactQuill
            theme="snow"
            value={texto}
            onChange={setTexto}
            modules={MODULES}
            formats={FORMATS}
            placeholder="Comece a escrever…"
          />
        </div>

        <aside className="wr-editor-panel">
          <h2 className="wr-section-title">Informações do texto</h2>

          <label className="wr-field">
            <span>Categoria</span>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="">Sem categoria</option>
              {CATEGORIAS.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="wr-field">
            <span>Tags (opcional)</span>
            <input
              value={tagDigitada}
              onChange={(e) => setTagDigitada(e.target.value)}
              onKeyDown={adicionarTag}
              placeholder="Digite e aperte Enter"
            />
          </label>
          {tags.length > 0 && (
            <ul className="wr-tags wr-tags--edit">
              {tags.map((t) => (
                <li key={t}>
                  {t}
                  <button type="button" aria-label={`Remover tag ${t}`} onClick={() => setTags(tags.filter((x) => x !== t))}>
                    <CloseIcon />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {status && (
            <p className={`wr-status wr-status--${status.tipo}`} role="status">
              {status.texto}
            </p>
          )}

          <div className="wr-editor-actions">
            <button type="button" className="wr-btn wr-btn--ghost" onClick={guardarRascunho}>
              Salvar rascunho
            </button>
            <button type="button" className="wr-btn wr-btn--primary" onClick={publicar} disabled={publicando}>
              {publicando ? "Publicando…" : "Publicar"}
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
