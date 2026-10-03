import "dotenv/config";
import pg from "pg";
import { DatabaseSync } from "node:sqlite";

const { Pool } = pg;
const usePostgres = Boolean(process.env.DATABASE_URL);
const sqliteDb = usePostgres ? null : new DatabaseSync("./banco.db");

export const db = usePostgres
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_SSL === "true"
          ? { rejectUnauthorized: false }
          : false,
    })
  : {
      async query(sql, params = []) {
        // $1, $2... (Postgres) viram ?1, ?2... (parâmetros posicionais do SQLite).
        // O SQLite já entende RETURNING, então a mesma query serve para os dois bancos.
        const sqlText = String(sql).trim().replace(/\$(\d+)/g, "?$1");
        const valores = params.map((v) => (v === undefined ? null : v));
        return { rows: sqliteDb.prepare(sqlText).all(...valores) };
      },
      prepare(sql) {
        return sqliteDb.prepare(sql);
      },
      exec(sql) {
        sqliteDb.exec(sql);
      },
    };

// Erro de UNIQUE (ex.: e-mail já cadastrado), no Postgres e no SQLite
export function ehErroDeDuplicado(error) {
  return error?.code === "23505" || error?.errcode === 2067;
}

// ---------- Tabelas ----------
// Tudo com IF NOT EXISTS: rodar de novo não apaga nem altera nada que já existe.
// A tabela documentos continua exatamente como estava.

const POSTGRES = /*sql*/ `
  CREATE TABLE IF NOT EXISTS documentos (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    "conteudoHtml" TEXT NOT NULL,
    "dataCriacao" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  -- Usuários: leitores, funcionários e administradores no mesmo lugar
  CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    "senhaHash" TEXT,
    role TEXT NOT NULL DEFAULT 'leitor'
      CHECK (role IN ('leitor', 'funcionario', 'admin')),
    "dataCriacao" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  -- Contas externas (Google hoje, outras no futuro) ligadas a um usuário
  CREATE TABLE IF NOT EXISTS "usuarioProvedores" (
    id SERIAL PRIMARY KEY,
    "usuarioId" INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    provedor TEXT NOT NULL,
    "provedorId" TEXT NOT NULL,
    "dataCriacao" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (provedor, "provedorId")
  );

  -- O login usa JWT (auth/jwt.mjs): não precisa de tabela de sessões

  -- Like (1) e deslike (-1) nos artigos. Uma reação por pessoa por artigo.
  -- Apagar o artigo ou a conta apaga as reações junto.
  CREATE TABLE IF NOT EXISTS reacoes (
    id SERIAL PRIMARY KEY,
    "usuarioId" INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    "documentoId" INTEGER NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
    valor SMALLINT NOT NULL CHECK (valor IN (1, -1)),
    "dataCriacao" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("usuarioId", "documentoId")
  );
  CREATE INDEX IF NOT EXISTS reacoes_documento ON reacoes ("documentoId");

  -- Desempenho: tempo de cada requisição (servidor) e de cada ação (navegador).
  -- Guarda 30 dias. Não guarda quem fez a ação, só os números.
  CREATE TABLE IF NOT EXISTS metricas (
    id SERIAL PRIMARY KEY,
    origem TEXT NOT NULL,
    acao TEXT NOT NULL,
    rota TEXT,
    metodo TEXT,
    status INTEGER,
    "duracaoMs" REAL NOT NULL,
    "servidorMs" REAL,
    bytes INTEGER,
    detalhes TEXT,
    "dataCriacao" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS metricas_acao_data ON metricas (acao, "dataCriacao");

  -- Tempo de uso de quem está logado: cada linha é uma sessão (pausa de 5+ min abre outra)
  CREATE TABLE IF NOT EXISTS "sessoesUso" (
    id SERIAL PRIMARY KEY,
    "usuarioId" INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    inicio TIMESTAMPTZ NOT NULL,
    fim TIMESTAMPTZ NOT NULL,
    segundos INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS "sessoesUso_usuario_fim" ON "sessoesUso" ("usuarioId", fim);

  -- Cada leitura de artigo: tempo com o texto na tela e até onde rolou (0 a 100%)
  CREATE TABLE IF NOT EXISTS leituras (
    id SERIAL PRIMARY KEY,
    "documentoId" INTEGER NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
    segundos INTEGER NOT NULL,
    rolagem INTEGER NOT NULL,
    "dataCriacao" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS leituras_documento ON leituras ("documentoId", "dataCriacao");

  -- Foto de perfil, já recortada e reduzida no navegador (fica no banco porque
  -- o disco do Render é apagado a cada deploy). "fotoEm" em usuarios diz se há
  -- foto e serve de versão no endereço da imagem.
  ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "fotoEm" TIMESTAMPTZ;
  CREATE TABLE IF NOT EXISTS "fotosPerfil" (
    "usuarioId" INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    dados TEXT NOT NULL
  );
`;

const SQLITE = /*sql*/ `
  PRAGMA foreign_keys = ON;

  -- Se outro programa estiver com o banco.db aberto (antivírus, visualizador de
  -- SQLite...), espera até 5s pela vez em vez de falhar com "database is locked"
  PRAGMA busy_timeout = 5000;

  CREATE TABLE IF NOT EXISTS documentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    conteudoHtml TEXT NOT NULL,
    dataCriacao TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senhaHash TEXT,
    role TEXT NOT NULL DEFAULT 'leitor'
      CHECK (role IN ('leitor', 'funcionario', 'admin')),
    dataCriacao TEXT NOT NULL DEFAULT (datetime('now')),
    dataAtualizacao TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS usuarioProvedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuarioId INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    provedor TEXT NOT NULL,
    provedorId TEXT NOT NULL,
    dataCriacao TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (provedor, provedorId)
  );

  CREATE TABLE IF NOT EXISTS reacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuarioId INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    documentoId INTEGER NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
    valor INTEGER NOT NULL CHECK (valor IN (1, -1)),
    dataCriacao TEXT NOT NULL DEFAULT (datetime('now')),
    dataAtualizacao TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (usuarioId, documentoId)
  );
  CREATE INDEX IF NOT EXISTS reacoes_documento ON reacoes (documentoId);

  CREATE TABLE IF NOT EXISTS metricas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    origem TEXT NOT NULL,
    acao TEXT NOT NULL,
    rota TEXT,
    metodo TEXT,
    status INTEGER,
    duracaoMs REAL NOT NULL,
    servidorMs REAL,
    bytes INTEGER,
    detalhes TEXT,
    dataCriacao TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS metricas_acao_data ON metricas (acao, dataCriacao);

  CREATE TABLE IF NOT EXISTS sessoesUso (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuarioId INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    inicio TEXT NOT NULL,
    fim TEXT NOT NULL,
    segundos INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS sessoesUso_usuario_fim ON sessoesUso (usuarioId, fim);

  CREATE TABLE IF NOT EXISTS leituras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    documentoId INTEGER NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
    segundos INTEGER NOT NULL,
    rolagem INTEGER NOT NULL,
    dataCriacao TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS leituras_documento ON leituras (documentoId, dataCriacao);

  CREATE TABLE IF NOT EXISTS fotosPerfil (
    usuarioId INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    dados TEXT NOT NULL
  );
`;

export async function inicializarBanco() {
  if (usePostgres) {
    await db.query(POSTGRES);
    console.log("Tabelas verificadas com sucesso (PostgreSQL).");
    return;
  }

  sqliteDb.exec(SQLITE);
  // Bancos criados antes da foto de perfil: o SQLite não tem ADD COLUMN IF NOT EXISTS
  const colunas = sqliteDb.prepare("PRAGMA table_info(usuarios)").all();
  if (!colunas.some((c) => c.name === "fotoEm")) sqliteDb.exec("ALTER TABLE usuarios ADD COLUMN fotoEm TEXT");
  console.log("Banco local SQLite inicializado com sucesso.");
}
