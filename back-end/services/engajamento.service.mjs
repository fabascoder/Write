import { db } from "../database/database.mjs";

// ---------- Tempo logado ----------

// Sinal de "ainda estou aqui" de quem está logado. Junta na sessão aberta
// (último sinal há menos de 5 min) ou começa outra.
const PAUSA_MAXIMA = 5 * 60 * 1000;

export async function registrarAtividade(usuarioId, segundosInformados) {
  const agora = new Date();
  const result = await db.query(
    `SELECT id, fim, segundos FROM "sessoesUso" WHERE "usuarioId" = $1 ORDER BY fim DESC LIMIT 1`,
    [usuarioId],
  );
  const ultima = result.rows[0];
  const fimAnterior = ultima ? new Date(ultima.fim).getTime() : 0;

  if (ultima && agora.getTime() - fimAnterior < PAUSA_MAXIMA) {
    // Nunca soma mais tempo do que passou desde o último sinal (não dá para inflar)
    const passou = Math.ceil((agora.getTime() - fimAnterior) / 1000) + 5;
    const somar = Math.min(segundosInformados, passou);
    await db.query(`UPDATE "sessoesUso" SET fim = $1, segundos = segundos + $2 WHERE id = $3`, [
      agora.toISOString(),
      somar,
      ultima.id,
    ]);
    return;
  }

  await db.query(
    `INSERT INTO "sessoesUso" ("usuarioId", inicio, fim, segundos) VALUES ($1, $2, $3, $4)`,
    [usuarioId, new Date(agora.getTime() - segundosInformados * 1000).toISOString(), agora.toISOString(), segundosInformados],
  );
}

export async function tempoPorUsuario(dias) {
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();

  const usuarios = await db.query(`SELECT id, nome, email, role FROM usuarios ORDER BY nome`);
  const sessoes = await db.query(
    `SELECT "usuarioId", inicio, fim, segundos FROM "sessoesUso" WHERE fim >= $1`,
    [desde],
  );
  const ultimas = await db.query(`SELECT "usuarioId", MAX(fim) AS "ultimaVez" FROM "sessoesUso" GROUP BY "usuarioId"`);

  const porUsuario = new Map();
  for (const s of sessoes.rows) {
    const u = porUsuario.get(s.usuarioId) ?? { segundos: 0, sessoes: 0 };
    u.segundos += Number(s.segundos);
    u.sessoes += 1;
    porUsuario.set(s.usuarioId, u);
  }
  const ultimaVez = new Map(ultimas.rows.map((r) => [r.usuarioId, r.ultimaVez]));

  return usuarios.rows
    .map((u) => {
      const t = porUsuario.get(u.id) ?? { segundos: 0, sessoes: 0 };
      return {
        id: u.id,
        nome: u.nome,
        email: u.email,
        role: u.role,
        segundos: t.segundos,
        sessoes: t.sessoes,
        mediaSessao: t.sessoes ? Math.round(t.segundos / t.sessoes) : 0,
        ultimaVez: ultimaVez.get(u.id) ? new Date(ultimaVez.get(u.id)).toISOString() : null,
      };
    })
    .sort((a, b) => b.segundos - a.segundos);
}

// ---------- Leitura dos artigos ----------

export async function registrarLeitura(documentoId, segundos, rolagem) {
  await db.query(`INSERT INTO leituras ("documentoId", segundos, rolagem, "dataCriacao") VALUES ($1, $2, $3, $4)`, [
    documentoId,
    segundos,
    rolagem,
    new Date().toISOString(),
  ]);
}

export async function documentoExiste(id) {
  const result = await db.query(`SELECT id FROM documentos WHERE id = $1`, [id]);
  return result.rows.length > 0;
}

function contarPalavras(html) {
  return String(html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&[a-z#0-9]+;/gi, "")
    .split(/\s+/)
    .filter(Boolean).length;
}

const PALAVRAS_POR_MINUTO = 200;
// Menos que isso é "entrou e saiu": não conta como leitura
const LEITURA_MINIMA = 10;

export async function leituraPorArtigo(dias) {
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();

  const artigos = await db.query(`SELECT id, titulo, "conteudoHtml", "dataCriacao" FROM documentos ORDER BY id DESC`);
  const leituras = await db.query(
    `SELECT "documentoId", segundos, rolagem FROM leituras WHERE "dataCriacao" >= $1`,
    [desde],
  );

  const porArtigo = new Map();
  for (const l of leituras.rows) {
    const lista = porArtigo.get(l.documentoId) ?? [];
    lista.push({ segundos: Number(l.segundos), rolagem: Number(l.rolagem) });
    porArtigo.set(l.documentoId, lista);
  }

  return artigos.rows.map((a) => {
    const todas = porArtigo.get(a.id) ?? [];
    const validas = todas.filter((l) => l.segundos >= LEITURA_MINIMA);
    const tempos = validas.map((l) => l.segundos).sort((x, y) => x - y);
    const palavras = contarPalavras(a.conteudoHtml);

    return {
      id: a.id,
      titulo: a.titulo,
      dataCriacao: a.dataCriacao,
      palavras,
      estimadoSegundos: Math.max(10, Math.round((palavras / PALAVRAS_POR_MINUTO) * 60)),
      visitas: todas.length,
      leituras: validas.length,
      saidasRapidas: todas.length - validas.length,
      mediaSegundos: tempos.length ? Math.round(tempos.reduce((s, t) => s + t, 0) / tempos.length) : null,
      medianaSegundos: tempos.length ? tempos[Math.floor((tempos.length - 1) / 2)] : null,
      // Rolou até perto do fim (90% do texto ou mais)
      chegaramAoFim: validas.length ? validas.filter((l) => l.rolagem >= 90).length / validas.length : null,
      rolagemMedia: validas.length ? Math.round(validas.reduce((s, l) => s + l.rolagem, 0) / validas.length) : null,
    };
  });
}
