import { Link } from "react-router-dom";
import { BookIcon, PenIcon } from "../icons";

// Botões de "Rascunhos" e "Novo artigo" que aparecem quando você está logada
export default function AdminBar() {
  return (
    <div className="fc-adminbar">
      <Link to="/rascunhos" className="fc-btn fc-btn--contorno">
        <BookIcon />
        Rascunhos
      </Link>
      <Link to="/editor" className="fc-btn fc-btn--primario fc-btn--icone" aria-label="Novo artigo">
        <PenIcon />
      </Link>
    </div>
  );
}
