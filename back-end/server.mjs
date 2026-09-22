import { createServer } from "node:http";
import { Router } from "./router.mjs";
import editorTextoRoutes from "./routes/editorTexto.route.mjs";

const router = new Router();

editorTextoRoutes(router);

router.get("/", (req, res) => {
  res.end("Home");
});

router.get("/produtos/notebook", (req, res) => {
  res.end("Produtos - notebook");
});

router.post("/produtos", (req, res) => {
  res.end("Notebook post");
});

const server = createServer(async (req, res) => {
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

server.listen(3000, () => {
  console.log("Server: http://localhost:3000");
});
