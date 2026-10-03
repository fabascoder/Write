import { createServer } from "node:http";
import { Router } from "./router.mjs";
import { inicializarBanco } from "./database/database.mjs";
import editorTextoRoutes from "./routes/editorTexto.route.mjs";
import authRoutes from "./routes/auth.route.mjs";
import usuarioRoutes from "./routes/usuario.route.mjs";
import reacaoRoutes from "./routes/reacao.route.mjs";
import metricaRoutes from "./routes/metrica.route.mjs";
import { registrarMetrica } from "./services/metrica.service.mjs";

const router = new Router();

// Rota principal
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

// Rotas dos artigos
editorTextoRoutes(router);

// Contas, login e sessão
authRoutes(router);

// Gerenciamento de usuários (admin)
usuarioRoutes(router);

// Like e deslike nos artigos
reacaoRoutes(router);

// Desempenho do sistema
metricaRoutes(router);

// Cronômetro de cada requisição:
// - manda o tempo no cabeçalho Server-Timing (o navegador separa servidor x rede)
// - guarda o tempo e o tamanho da resposta para o painel de desempenho
function medirRequisicao(req, res) {
  const inicio = performance.now();
  let bytes = 0;

  const writeHead = res.writeHead;
  res.writeHead = function (...args) {
    if (!res.headersSent) res.setHeader("Server-Timing", `app;dur=${(performance.now() - inicio).toFixed(1)}`);
    return writeHead.apply(this, args);
  };

  const end = res.end;
  res.end = function (pedaco, ...resto) {
    if (pedaco && typeof pedaco !== "function") bytes += Buffer.byteLength(pedaco);
    return end.call(this, pedaco, ...resto);
  };

  res.on("finish", () => {
    // As próprias métricas não entram na conta
    if (req.method === "OPTIONS" || req.rota?.startsWith("/metricas")) return;
    registrarMetrica({
      origem: "servidor",
      acao: "api",
      rota: req.rota ?? "(rota inexistente)",
      metodo: req.method,
      status: res.statusCode,
      duracaoMs: performance.now() - inicio,
      bytes,
    });
  });
}

// Criação do servidor
const server = createServer(async (req, res) => {
  medirRequisicao(req, res);

  // Configuração do CORS
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE",
  );

  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Requisição preflight do CORS
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const url = new URL(req.url, "http://localhost");

    const chunks = [];

    // Leitura do corpo da requisição
    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const body = Buffer.concat(chunks).toString("utf-8");

    // Adiciona o body ao objeto da requisição
    req.body = body;

    // Localiza a rota
    const handler = router.find(req.method, url.pathname);

    if (handler) {
      await handler(req, res);
    } else {
      res.writeHead(404, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({
          mensagem: "Rota não encontrada",
        }),
      );
    }
  } catch (error) {
    console.error("Erro no servidor:", error);

    if (!res.headersSent) {
      res.writeHead(500, {
        "Content-Type": "application/json",
      });
    }

    res.end(
      JSON.stringify({
        mensagem: "Erro interno do servidor",
      }),
    );
  }
});

// Porta do servidor
const PORT = process.env.PORT || 3000;

// Inicialização do banco e do servidor
async function iniciarServidor() {
  try {
    await inicializarBanco();

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Servidor executando na porta ${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao inicializar o banco:", error);

    process.exit(1);
  }
}

iniciarServidor();
