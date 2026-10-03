import Brand from "./Brand";

// A conta (entrar / nome do usuário) fica no cabeçalho
export default function Footer() {
  return (
    <footer className="fc-footer">
      <div className="fc-footer-linha">
        <Brand />
      </div>
      <p className="fc-copy">todos os direitos reservados</p>
    </footer>
  );
}
