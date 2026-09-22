import { Link } from "react-router-dom";
import type { Artigo } from "../../lib/api";
import { ArrowRightIcon } from "../icons";
import Meta from "./Meta";

// Linha com as barras azuis nas laterais, usada em "Mais artigos" e "Meus artigos"
export default function ArtigoRow({ artigo }: { artigo: Artigo }) {
  return (
    <Link to={`/artigo/${artigo.id}`} className="fc-row">
      <div>
        <h3>{artigo.titulo}</h3>
        <Meta artigo={artigo} />
      </div>
      <span className="fc-row-seta">
        <ArrowRightIcon />
      </span>
    </Link>
  );
}
