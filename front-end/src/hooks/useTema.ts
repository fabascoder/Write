import { useEffect, useState } from "react";

type Tema = "claro" | "escuro";

function temaInicial(): Tema {
  try {
    const salvo = localStorage.getItem("write-tema");
    if (salvo === "claro" || salvo === "escuro") return salvo;
  } catch {
    /* sem acesso ao storage */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
}

export function useTema() {
  const [tema, setTema] = useState<Tema>(temaInicial);

  useEffect(() => {
    document.documentElement.dataset.theme = tema === "escuro" ? "dark" : "light";
    try {
      localStorage.setItem("write-tema", tema);
    } catch {
      /* ignora */
    }
  }, [tema]);

  return {
    tema,
    alternar: () => setTema((t) => (t === "claro" ? "escuro" : "claro")),
  };
}
