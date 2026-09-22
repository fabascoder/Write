import { useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

import "./EditorTexto.css";

export default function EditorTexto() {
  const [texto, setTexto] = useState("");

  const [titulo, setTitulo] = useState("Meu editor de texto");

  const [editandoTitulo, setEditandoTitulo] = useState(false);

  const [salvando, setSalvando] = useState(false);

  const salvarTexto = async () => {
    try {
      setSalvando(true);

      const response = await fetch("http://localhost:3000/publicar", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          titulo: titulo,
          conteudoHtml: texto,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensagem || "Erro ao salvar documento");
      }

      console.log("Documento salvo:", data);

      alert("Documento salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);

      alert("Não foi possível salvar o documento.");
    } finally {
      setSalvando(false);
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],

      ["bold", "italic", "underline", "strike"],

      [{ align: [] }],

      [{ list: "ordered" }, { list: "bullet" }],

      ["blockquote", "link"],

      ["clean"],
    ],
  };

  const formats = [
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

  return (
    <div className="editor-container">
      {editandoTitulo ? (
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          onBlur={() => setEditandoTitulo(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setEditandoTitulo(false);
            }
          }}
          autoFocus
        />
      ) : (
        <h1 onDoubleClick={() => setEditandoTitulo(true)}>{titulo}</h1>
      )}

      <ReactQuill
        theme="snow"
        value={texto}
        onChange={setTexto}
        modules={modules}
        formats={formats}
        placeholder="Comece a escrever seu livro..."
      />

      <div className="editor-preview">
        <h2>Conteúdo do editor:</h2>

        <div dangerouslySetInnerHTML={{ __html: texto }} />
      </div>

      <button onClick={salvarTexto} disabled={salvando}>
        {salvando ? "Salvando..." : "Salvar texto"}
      </button>
    </div>
  );
}
