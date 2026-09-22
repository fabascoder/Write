import { createServer } from "node:http";
import { Router } from "./router.mjs";
import editorTextoRoutes from "./routes/editorTexto.route.mjs";

const router = new Router();

router.get("/", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "application/json",
  });

  res.end(
    JSON.stringify({
      mensagem: "API Write funcionando!",
    }),
  );
});

editorTextoRoutes(router);

const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, DELETE",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  const url = new URL(req.url, "http://localhost");

  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const body = Buffer.concat(chunks).toString("utf-8");

  // Adiciona o body ao objeto da requisição
  req.body = body;

  const handler = router.find(req.method, url.pathname);

  if (handler) {
    await handler(req, res);
  } else {
    res.statusCode = 404;
    res.end("Nao encontrado");
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor executando na porta ${PORT}`);
});
