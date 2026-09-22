import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não foi configurada");
}

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl:
    process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

export async function inicializarBanco() {
  await db.query(/*sql*/ `
    CREATE TABLE IF NOT EXISTS documentos (
      id SERIAL PRIMARY KEY,
      titulo TEXT NOT NULL,
      "conteudoHtml" TEXT NOT NULL,
      "dataCriacao" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("Tabela documentos verificada com sucesso.");
}
