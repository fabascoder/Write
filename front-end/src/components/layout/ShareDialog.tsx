import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CORES,
  PERSONALIZACAO_PADRAO,
  TAMANHOS,
  codigoIncorporar,
  copiarTexto,
  linkPersonalizado,
  tituloCompartilhar,
  type DadosCompartilhamento,
  type Personalizacao,
  type TamanhoCartao,
} from "../../lib/compartilhar";
import { CheckIcon, CloseIcon, LinkIcon } from "../icons";
import ShareCard from "./ShareCard";

type Props = DadosCompartilhamento & {
  fechar: () => void;
  text?: string;
  image?: string;
  date?: string;
  /** Caminho do cartão personalizado, ex.: /embed/artigo/2 */
  embedPath: string;
};

// Modal "Personalizar": cor, tamanho e trecho do cartão, com prévia,
// link personalizado e código do <iframe>. Usa as classes dos outros modais.
export default function ShareDialog({ fechar, text, image, date, embedPath, ...dados }: Props) {
  const [p, setP] = useState<Personalizacao>(PERSONALIZACAO_PADRAO);
  const [mostrarCodigo, setMostrarCodigo] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [erroCopiar, setErroCopiar] = useState(false);
  const fecharRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fecharRef.current?.focus();

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [fechar]);

  // "Link copiado!" volta a ser "Copiar link" depois de alguns segundos
  useEffect(() => {
    if (!copiado) return;
    const t = window.setTimeout(() => setCopiado(false), 2500);
    return () => window.clearTimeout(t);
  }, [copiado]);

  const personalizado = linkPersonalizado(embedPath, p);
  const codigo = codigoIncorporar(personalizado, p, dados.title);

  async function copiar() {
    const ok = await copiarTexto(mostrarCodigo ? codigo : personalizado);
    setCopiado(ok);
    setErroCopiar(!ok);
  }

  // Qualquer mudança zera o "copiado", senão ele se refere à versão anterior
  function mudar(novo: Partial<Personalizacao>) {
    setP((atual) => ({ ...atual, ...novo }));
    setCopiado(false);
  }

  const rotuloCopiar = copiado
    ? mostrarCodigo ? "Código copiado!" : "Link copiado!"
    : mostrarCodigo ? "Copiar código" : "Copiar link";

  return createPortal(
    <div className="fc-modal" role="dialog" aria-modal="true" aria-labelledby="titulo-compartilhar">
      <div className="fc-modal-fundo" onClick={fechar} />
      <div className="fc-modal-caixa fc-share">
        <button
          ref={fecharRef}
          type="button"
          className="fc-icon-btn fc-modal-fechar"
          onClick={fechar}
          aria-label="Fechar"
        >
          <CloseIcon />
        </button>

        <h2 id="titulo-compartilhar">{tituloCompartilhar(dados.type)}</h2>

        <div className="fc-share-opcoes">
          <div className="fc-share-cores" role="group" aria-label="Cor do cartão">
            <span>Cor</span>
            {CORES.map((c) => (
              <button
                key={c.valor}
                type="button"
                className={`fc-share-cor fc-share-cor--${c.valor}`}
                aria-pressed={p.cor === c.valor}
                aria-label={c.nome}
                title={c.nome}
                onClick={() => mudar({ cor: c.valor })}
              />
            ))}
          </div>

          <label className="fc-campo fc-share-tamanho">
            <span>Tamanho</span>
            <select value={p.tamanho} onChange={(e) => mudar({ tamanho: e.target.value as TamanhoCartao })}>
              {TAMANHOS.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.nome} ({t.altura}px)
                </option>
              ))}
            </select>
          </label>

          <label className="fc-share-check">
            <input type="checkbox" checked={p.trecho} onChange={(e) => mudar({ trecho: e.target.checked })} />
            Mostrar trecho
          </label>
        </div>

        <div className="fc-share-previa">
          <ShareCard {...p} titulo={dados.title} trechoTexto={text} data={date} capa={image} href={dados.url} />
        </div>

        {mostrarCodigo ? (
          <pre className="fc-share-codigo"><code>{codigo}</code></pre>
        ) : (
          <p className="fc-share-url">{personalizado}</p>
        )}

        <div className="fc-share-rodape">
          <label className="fc-share-check">
            <input
              type="checkbox"
              checked={mostrarCodigo}
              onChange={(e) => {
                setMostrarCodigo(e.target.checked);
                setCopiado(false);
              }}
            />
            Mostrar código
          </label>

          <a href={personalizado} target="_blank" rel="noopener noreferrer" className="fc-btn fc-btn--contorno">
            Abrir
          </a>
          <button type="button" className="fc-btn fc-btn--primario" onClick={copiar}>
            {copiado ? <CheckIcon /> : <LinkIcon />}
            <span aria-live="polite">{rotuloCopiar}</span>
          </button>
        </div>

        {erroCopiar && (
          <p className="fc-erro fc-share-aviso" role="alert">
            Não deu para copiar. Selecione o texto acima e copie.
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
