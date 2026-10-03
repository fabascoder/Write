import { useState, type ReactNode } from "react";
import { urlDaFoto } from "../../lib/autenticacao";

type Props = {
  foto?: string | null;
  className: string;
  /** O que aparece sem foto (ou se a imagem não carregar): iniciais, silhueta... */
  children: ReactNode;
};

// Foto de perfil da conta, com a foto padrão no lugar quando não há foto
export function FotoConta({ foto, className, children }: Props) {
  const url = urlDaFoto(foto);
  const [falhou, setFalhou] = useState<string | null>(null);

  if (!url || falhou === url) return <>{children}</>;

  return (
    <img
      src={url}
      alt=""
      className={className}
      width={64}
      height={64}
      decoding="async"
      onError={() => setFalhou(url)}
    />
  );
}
