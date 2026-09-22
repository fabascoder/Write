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
        const sqlText = String(sql).trim();
        const statement = sqliteDb.prepare(sqlText);

        if (sqlText.toUpperCase().startsWith("INSERT")) {
          const result = statement.run(...params);

          if (sqlText.toUpperCase().includes("RETURNING")) {
            const rows = sqliteDb
              .prepare(
                `SELECT id, titulo, conteudoHtml, dataCriacao FROM documentos WHERE id = ?`,
              )
              .all(Number(result.lastInsertRowid));

            return { rows };
          }

          return {
            rows: [{ id: Number(result.lastInsertRowid) }],
          };
        }

        return {
          rows: statement.all(...params),
        };
      },
      prepare(sql) {
        return sqliteDb.prepare(sql);
      },
      exec(sql) {
        sqliteDb.exec(sql);
      },
    };

export async function inicializarBanco() {
  if (usePostgres) {
    await db.query(/*sql*/ `
      CREATE TABLE IF NOT EXISTS documentos (
        id SERIAL PRIMARY KEY,
        titulo TEXT NOT NULL,
        "conteudoHtml" TEXT NOT NULL,
        "dataCriacao" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Tabela documentos verificada com sucesso.");
    return;
  }

  sqliteDb.exec(/*sql*/ `
    CREATE TABLE IF NOT EXISTS documentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      conteudoHtml TEXT NOT NULL,
      dataCriacao TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  console.log("Banco local SQLite inicializado com sucesso.");
}
