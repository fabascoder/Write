<p align="center">
  <img src="front-end/src/assets/fabas-coder-blog-banner.png" alt="Fabas Coder Blog" width="100%">
</p>

<h1 align="center">FABAS CODER Blog</h1>

<p align="center">
  Pensamentos que viram texto. Poesias, reflexões e o que mais couber na página.
</p>

<p align="center">
  <a href="https://write-w.vercel.app"><strong>Acessar o site</strong></a>
  &nbsp;·&nbsp;
  <a href="#como-rodar">Rodar localmente</a>
  &nbsp;·&nbsp;
  <a href="#api">API</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-0b6ee0?style=flat-square&logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-0b6ee0?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-0b6ee0?style=flat-square&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Node.js-10151c?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/PostgreSQL%20%2F%20SQLite-10151c?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL / SQLite">
</p>

---

## Sobre

O Fabas Coder Blog é um blog pessoal feito do zero, front-end e back-end, para guardar poesias, pensamentos e reflexões. A ideia é simples: o que é escrito não se perde.

Os textos podem ser lidos de duas formas. Em **destaques**, os mais recentes aparecem em tamanho de capa, com um trecho de abertura. Na **linha do tempo**, todos aparecem em ordem cronológica, agrupados pelo mês em que foram publicados.

<p align="center">
  <img src="front-end/src/assets/fabas-coder-blog-post.png" alt="O blog no computador" width="49%">
  <img src="front-end/src/assets/fabas-coder-blog-celular.png" alt="O blog no celular" width="49%">
</p>

## Funcionalidades

| | |
|---|---|
| **Dois modos de leitura** | Destaques ou linha do tempo por mês, com a escolha guardada na própria URL. |
| **Categorias e busca** | Filtro por Pensamentos, Poesias, Reflexões, Romance e Trabalho, além de busca por título e conteúdo. |
| **Área do autor** | O botão *Access*, no rodapé, abre o login e libera a escrita e o gerenciamento dos artigos. |
| **Editor de texto** | Formatação com Quill, categoria, tags e rascunhos salvos no navegador. |
| **Publicar, editar e excluir** | Publicação de novos artigos, edição de textos já no ar e exclusão com confirmação. |
| **Responsivo** | Layout em colunas no desktop e menu recolhível no celular. |
| **Acessível** | Foco visível por teclado, rótulos `aria` e respeito a `prefers-reduced-motion`. |

## Tecnologias

**Front-end** — React 19, TypeScript, Vite, React Router, React Quill e CSS puro com variáveis de tema. Tipografia em Poppins e Inter.

**Back-end** — Node.js puro, sem framework, com roteador próprio. PostgreSQL em produção e SQLite (`node:sqlite`) no ambiente local.

**Deploy** — Front-end na Vercel e API no Render.

## Estrutura

```
.
├── front-end/
│   ├── src/
│   │   ├── assets/           # imagens e artes de divulgação
│   │   ├── components/
│   │   │   ├── admin/        # barra do autor e dados de acesso
│   │   │   ├── home/         # destaques, linha do tempo, filtros
│   │   │   ├── layout/       # cabeçalho, rodapé, modais
│   │   │   └── pages/        # início, artigo, editor, rascunhos
│   │   ├── hooks/            # useArtigos, useAdmin
│   │   ├── lib/              # API, datas, categorias, acesso
│   │   └── styles/
│   └── vercel.json
│
└── back-end/
    ├── controllers/
    ├── database/
    ├── routes/
    ├── services/
    ├── router.mjs
    └── server.mjs
```

## Como rodar

É preciso ter o [Node.js](https://nodejs.org) **22.5 ou superior**, porque o back-end usa o módulo nativo `node:sqlite`.

**1. API**

```bash
cd back-end
npm install
npm start          # http://localhost:3000
```

Sem a variável `DATABASE_URL`, a API cria e usa o arquivo local `banco.db`. Com ela, conecta no PostgreSQL.

**2. Front-end**

```bash
cd front-end
npm install
npm run dev        # http://localhost:5173 → usa a API local
npm run dev:prod   # front local usando a API de produção
```

O front chama a API sempre por `/api`, no mesmo domínio do site: o Vite (em desenvolvimento) e a Vercel (`vercel.json`, em produção) repassam para o back-end. Isso mantém o cookie de login no domínio do site.

**3. Primeiro administrador**

```bash
cd back-end
npm run admin -- voce@email.com
```

Se a conta já existe (criada pelo site ou pelo Google), ela vira administradora. Se não existe, o script pede nome e senha (a senha não aparece na tela) e cria a conta já como admin. O script usa o mesmo banco do servidor: com `DATABASE_URL` no `.env`, mexe no PostgreSQL.

### Variáveis de ambiente

| Onde | Variável | Para que serve |
|---|---|---|
| `back-end/.env` | `DATABASE_URL` | Conexão com o PostgreSQL. Sem ela, usa SQLite local. |
| `back-end/.env` | `PORT` | Porta do servidor. O padrão é `3000`. |
| `back-end/.env` | `JWT_SECRET` | Chave que assina os tokens de login (JWT). **Obrigatória em produção**; sem ela, todos são deslogados quando o servidor reinicia. |
| `back-end/.env` | `APP_URL` | Endereço público do front (em produção, `https://write-w.vercel.app`). Define a volta do login com Google e liga o cookie `Secure`. |
| `back-end/.env` | `GOOGLE_CLIENT_ID` · `GOOGLE_CLIENT_SECRET` | Login com Google (opcional). Sem eles, o botão não aparece. |
| `front-end/.env` | `VITE_API_URL` | Opcional. Força outro endereço de API, mas aí o login não funciona. |

Veja `back-end/.env.example` e `front-end/.env.example`.

## Contas e permissões

Ler é livre: artigos, compartilhamento e a página `/embed` não pedem login. A conta serve para o que depende de alguém (curtir, comentar, favoritar, acompanhar livros…).

- **Um login só** para todo mundo, com e-mail e senha ou com Google. Uma pessoa que já tem conta e entra com o Google do mesmo e-mail continua na mesma conta.
- **Roles:** `leitor` (padrão de quem se cadastra), `funcionario` e `admin`. O cadastro nunca escolhe a role.
- **Permissões:** as rotas conferem permissões (`artigos:gerenciar`, `usuarios:gerenciar`…), definidas em `back-end/auth/permissoes.mjs`. Para dar poderes ao funcionário, é só acrescentar na lista dele.
- **Login com JWT:** token HS256 válido por 7 dias, num cookie `httpOnly` + `SameSite=Lax`. A API também aceita `Authorization: Bearer <token>`. A cada requisição o usuário é buscado no banco, então a role vale sempre a atual.
- **Segurança:** senha com hash `scrypt`, limite de tentativas de login, token recusado se for alterado, vencido ou assinado com outra chave. O React só esconde botões; quem bloqueia é a API (401 sem login, 403 sem permissão).

## API

| Método | Rota | Acesso | O que faz |
|---|---|---|---|
| `GET` | `/` | público | Confere se a API está no ar |
| `GET` | `/documentos` | público | Lista os artigos, do mais recente ao mais antigo |
| `POST` | `/publicar` | `artigos:gerenciar` | Publica um novo artigo |
| `PUT` | `/documentos/:id` | `artigos:gerenciar` | Edita um artigo publicado |
| `DELETE` | `/documentos/:id` | `artigos:gerenciar` | Apaga um artigo publicado |
| `POST` | `/auth/cadastro` | público | Cria conta de leitor e já entra (devolve o JWT) |
| `POST` | `/auth/login` | público | Entra com e-mail e senha (devolve o JWT) |
| `POST` | `/auth/logout` | público | Apaga o cookie do token |
| `GET` | `/auth/eu` | público | Quem está logado (ou `null`) |
| `PATCH` | `/auth/eu` | logado | Muda o nome |
| `GET` | `/auth/google` | público | Começa o login com Google |
| `GET` | `/auth/google/callback` | Google | Volta do Google |
| `GET` | `/usuarios` | `usuarios:gerenciar` | Lista as contas |
| `PATCH` | `/usuarios/:id/role` | `usuarios:gerenciar` | Muda o tipo de conta |

**Corpo de publicação e edição**

```json
{
  "titulo": "O peso do silêncio",
  "conteudoHtml": "<p>Há silêncios que não são vazios…</p>",
  "categoria": "poesias",
  "tags": ["silêncio", "poesia"]
}
```

## Próximos passos

- [ ] Salvar categoria e tags no banco
- [x] Contas, login (e-mail e Google) e permissões na API
- [ ] Ligar artigos ao autor (`autorId` em `documentos`)
- [ ] Curtidas, comentários, favoritos e notificações
- [ ] Buscar um artigo por `id` direto na API
- [ ] Rascunhos salvos no servidor, e não só no navegador
- [ ] Imagem de capa nos artigos
- [ ] Versão em inglês (o seletor PT | EN já está no layout)

---

<p align="center">
  <sub>Feito por Fabas Coder · um texto de cada vez.</sub>
</p>
