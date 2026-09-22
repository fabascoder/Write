import { Link } from "react-router-dom";

export default function Brand({ pequena = false }: { pequena?: boolean }) {
  return (
    <Link to="/" className={"fc-brand" + (pequena ? " fc-brand--sm" : "")}>
      <strong>FABAS CODER</strong> <span>Blog</span>
    </Link>
  );
}
