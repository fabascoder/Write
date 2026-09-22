import { useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

import "./EditorTexto.css";

export default function EditorTexto() {
  const [texto, setTexto] = useState("");

  const salvarTexto = () => {
    console.log("Conteúdo do livro:", texto);
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
      <h1>Meu editor de texto</h1>

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

        <p>{texto}</p>
      </div>
      <button onClick={salvarTexto}>Salvar texto</button>
    </div>
  );
}
