import { useAuth } from "../../hooks/useAuth";

// Aviso no lugar de uma função que exige conta, sem bloquear o resto da página.
// Ex.: na área de comentários, para visitantes:
//   <PrecisaEntrar acao="comentar" />
export default function PrecisaEntrar({ acao }: { acao: string }) {
  const { abrirLogin } = useAuth();
  const voltar = window.location.pathname + window.location.search;
  const motivo = `Você precisa estar conectado para ${acao}.`;

  return (
    <div className="fc-precisa-entrar">
      <p>{motivo}</p>
      <div>
        <button type="button" className="fc-btn fc-btn--primario" onClick={() => abrirLogin({ motivo, voltar })}>
          Entrar
        </button>
        <button
          type="button"
          className="fc-btn fc-btn--contorno"
          onClick={() => abrirLogin({ modo: "cadastro", motivo, voltar })}
        >
          Criar conta
        </button>
      </div>
    </div>
  );
}
