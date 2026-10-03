// Prepara a foto de perfil no próprio navegador antes de enviar:
// recorta um quadrado no centro, reduz para 320×320 e comprime.
// Uma foto de celular de 5 MB vira ~20–40 KB, então o envio é rápido e o banco não incha.

const LADO = 320;
const MAX_ARQUIVO = 15 * 1024 * 1024;
const QUALIDADE = 0.85;

export const TIPOS_ACEITOS = "image/jpeg,image/png,image/webp";

export async function prepararFoto(arquivo: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(arquivo.type)) {
    throw new Error("Escolha uma imagem JPG, PNG ou WebP.");
  }
  if (arquivo.size > MAX_ARQUIVO) {
    throw new Error("Essa imagem passa de 15 MB. Escolha uma menor.");
  }

  const imagem = await carregar(arquivo);
  const lado = Math.min(imagem.width, imagem.height);
  if (lado < 32) throw new Error("Essa imagem é pequena demais.");

  const canvas = document.createElement("canvas");
  canvas.width = LADO;
  canvas.height = LADO;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não conseguiu preparar a foto.");

  // Fundo branco: PNG com transparência não fica com fundo preto no JPG
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, LADO, LADO);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(imagem, (imagem.width - lado) / 2, (imagem.height - lado) / 2, lado, lado, 0, 0, LADO, LADO);
  if ("close" in imagem) imagem.close();

  // WebP é menor; navegadores que não geram WebP devolvem PNG, aí usa JPG
  const webp = canvas.toDataURL("image/webp", QUALIDADE);
  return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", QUALIDADE);
}

// createImageBitmap já respeita a rotação das fotos de celular (EXIF)
async function carregar(arquivo: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(arquivo, { imageOrientation: "from-image" });
  } catch {
    const url = URL.createObjectURL(arquivo);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } catch {
      throw new Error("Não conseguimos abrir essa imagem. Tente outra.");
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}
