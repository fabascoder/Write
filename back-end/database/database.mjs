import { DatabaseSync } from "node:sqlite";

export const db = new DatabaseSync("./banco.db");

db.exec(/*sql*/ `
    CREATE TABLE IF NOT EXISTS documentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    conteudoHtml TEXT NOT NULL,
    dataCriacao TEXT NOT NULL DEFAULT (datetime('now'))
);
    `);
