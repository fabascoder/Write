import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { atualizarArtigo, publicarArtigo } from "../../lib/api";
import { CATEGORIAS } from "../../lib/categorias";
import { lerRascunhos, removerRascunho, salvarRascunho } from "../../lib/rascunhos";
import { useAdmin } from "../../hooks/useAdmin";
import { useArtigos } from "../../hooks/useArtigos";
import { ArrowLeftIcon, BookIcon, CloseIcon } from "../icons";
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

const FORMATS = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "align",
  "list",
  "blockquote",
  "link",
];

type Status = { tipo: "ok" | "erro"; texto: string } | null;

export default function Editor() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { logado } = useAdmin();

  // ?id=  → editando um artigo publicado | ?rascunho= → continuando um rascunho
  const idEdicao = params.get("id");
  const { artigos, carregando } = useArtigos();
  const artigoEditado = idEdicao ? artigos.find((a) => String(a.id) === idEdicao) : undefined;

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
  const [salvando, setSalvando] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  // Preenche os campos assim que o artigo em edição chega da API
  useEffect(() => {
    if (!artigoEditado) return;
    setTitulo(artigoEditado.titulo);
    setTexto(artigoEditado.conteudoHtml ?? "");
    setCategoria(artigoEditado.categoria ?? "");
    setTags(artigoEditado.tags ?? []);
  }, [artigoEditado]);

  if (!logado) return <Navigate to="/" replace />;

  const editando = Boolean(idEdicao);
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

  async function salvar() {
    if (!titulo.trim()) {
      setStatus({ tipo: "erro", texto: "Dê um título ao artigo antes de salvar." });
      return;
    }
    if (textoVazio) {
      setStatus({ tipo: "erro", texto: "Escreva alguma coisa antes de salvar." });
      return;
    }

    const dados = {
      titulo: titulo.trim(),
      conteudoHtml: texto,
      categoria: categoria || undefined,
      tags,
    };

    try {
      setSalvando(true);
      setStatus(null);

      if (editando && idEdicao) {
        await atualizarArtigo(idEdicao, dados);
        navigate(`/artigo/${idEdicao}`, { replace: true });
        return;
      }

      await publicarArtigo(dados);
      removerRascunho(rascunhoId);
      navigate("/");
    } catch (e) {
      console.error(e);
      setStatus({
        tipo: "erro",
        texto: editando
          ? "Não foi possível salvar as alterações. Confira se a API está no ar."
          : "Não foi possível publicar. Confira se a API está no ar.",
      });
    } finally {
      setSalvando(false);
    }
  }

  const carregandoEdicao = editando && carregando && !artigoEditado;

  return (
    <main className="fc-main fc-main--simples fc-editor-pagina">
      <Head
        title={editando ? "Editar artigo" : "Novo artigo"}
        description="Editor do Fabas Coder Blog."
      />

      <div className="fc-topo">
        <Link to={editando && idEdicao ? `/artigo/${idEdicao}` : "/"} className="fc-voltar" aria-label="Voltar">
          <ArrowLeftIcon />
        </Link>
        {!editando && (
          <Link to="/rascunhos" className="fc-btn fc-btn--contorno">
            <BookIcon />
            Rascunhos
          </Link>
        )}
      </div>

      {carregandoEdicao ? (
        <p className="fc-estado">Carregando artigo…</p>
      ) : (
        <>
          {editando && <p className="fc-rotulo">Editando um artigo publicado</p>}

          <input
            className="fc-editor-titulo"
            placeholder="Título"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            aria-label="Título do artigo"
          />

          <div className="fc-editor-caixa">
            <ReactQuill
              theme="snow"
              value={texto}
              onChange={setTexto}
              modules={MODULES}
              formats={FORMATS}
              placeholder="Comece a escrever…"
            />
          </div>

          <div className="fc-editor-rodape">
            <div className="fc-editor-campos">
              <label className="fc-campo">
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

              <label className="fc-campo">
                <span>Tags</span>
                <input
                  value={tagDigitada}
                  onChange={(e) => setTagDigitada(e.target.value)}
                  onKeyDown={adicionarTag}
                  placeholder="Digite e aperte Enter"
                />
              </label>

              {tags.length > 0 && (
                <ul className="fc-tags">
                  {tags.map((t) => (
                    <li key={t}>
                      {t}
                      <button
                        type="button"
                        aria-label={`Remover tag ${t}`}
                        onClick={() => setTags(tags.filter((x) => x !== t))}
                      >
                        <CloseIcon />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="fc-editor-acoes">
              {status && (
                <p className={"fc-status fc-status--" + status.tipo} role="status">
                  {status.texto}
                </p>
              )}
              <div>
                {editando ? (
                  <Link to={`/artigo/${idEdicao}`} className="fc-btn fc-btn--contorno">
                    Cancelar
                  </Link>
                ) : (
                  <button type="button" className="fc-btn fc-btn--contorno" onClick={guardarRascunho}>
                    Salvar rascunho
                  </button>
                )}
                <button
                  type="button"
                  className="fc-btn fc-btn--escuro"
                  onClick={salvar}
                  disabled={salvando}
                >
                  {salvando
                    ? editando
                      ? "Salvando…"
                      : "Publicando…"
                    : editando
                      ? "Salvar alterações"
                      : "Publicar"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
