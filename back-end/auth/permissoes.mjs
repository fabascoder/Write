// Quem pode fazer o quê. As rotas conferem PERMISSÕES, não o nome da role,
// assim dá para criar "funcionario" (ou outra) só mudando esta lista.

export const ROLES = ["leitor", "funcionario", "admin"];

const LEITOR = [
  "perfil:editar",
  // Futuro: curtir, comentar, favoritar, acompanhar livros
  "interacoes:usar",
];

export const PERMISSOES = {
  leitor: LEITOR,

  // Por enquanto igual ao leitor. Quando chegar a hora, é só acrescentar
  // aqui as permissões administrativas que o funcionário deve ter.
  funcionario: [...LEITOR],

  admin: [
    ...LEITOR,
    "admin:acessar",
    "artigos:gerenciar",
    "livros:gerenciar",
    "usuarios:gerenciar",
    "comentarios:moderar",
    "notificacoes:enviar",
    "configuracoes:editar",
  ],
};

export function permissoesDe(role) {
  return PERMISSOES[role] ?? [];
}

export function pode(usuario, permissao) {
  return Boolean(usuario) && permissoesDe(usuario.role).includes(permissao);
}
