-- ============================================================
-- CRM AutoPeças — Migração 001: Autenticação e Usuários
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABELA: usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome         TEXT        NOT NULL,
  email        TEXT        NOT NULL UNIQUE,
  senha_hash   TEXT        NOT NULL,
  telefone     TEXT,
  cargo        TEXT        NOT NULL DEFAULT 'funcionario',
  -- 'admin' | 'gerente' | 'funcionario'
  status       TEXT        NOT NULL DEFAULT 'ativo',
  -- 'ativo' | 'inativo' | 'bloqueado'
  ultimo_login TIMESTAMPTZ,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  criado_por   UUID        REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_usuarios_email  ON usuarios(email);
CREATE INDEX idx_usuarios_status ON usuarios(status);
CREATE INDEX idx_usuarios_cargo  ON usuarios(cargo);

-- Admin padrão (senha: admin1234 — troque imediatamente!)
INSERT INTO usuarios (id, nome, email, senha_hash, cargo, status)
VALUES (
  uuid_generate_v4(),
  'Administrador',
  'admin@autopecas.com',
  crypt('admin1234', gen_salt('bf', 12)),
  'admin',
  'ativo'
);

-- ============================================================
-- TABELA: permissoes
-- ============================================================
CREATE TABLE IF NOT EXISTS permissoes (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID    NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  modulo      TEXT    NOT NULL,
  -- 'kanban' | 'vendas' | 'repasse' | 'colaboradores'
  -- 'frete' | 'relatorios' | 'novo_pedido' | 'prospeccao' | 'configuracoes'
  visualizar  BOOLEAN NOT NULL DEFAULT FALSE,
  criar       BOOLEAN NOT NULL DEFAULT FALSE,
  editar      BOOLEAN NOT NULL DEFAULT FALSE,
  excluir     BOOLEAN NOT NULL DEFAULT FALSE,

  UNIQUE(usuario_id, modulo)
);

CREATE INDEX idx_permissoes_usuario ON permissoes(usuario_id);
CREATE INDEX idx_permissoes_modulo  ON permissoes(modulo);

-- ============================================================
-- TABELA: logs_acesso
-- ============================================================
CREATE TABLE IF NOT EXISTS logs_acesso (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID        REFERENCES usuarios(id) ON DELETE SET NULL,
  email       TEXT,
  -- guarda o email tentado, mesmo se usuário não existir
  ip          TEXT,
  dispositivo TEXT,
  data_login  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sucesso     BOOLEAN     NOT NULL DEFAULT FALSE,
  motivo_falha TEXT
  -- 'senha_incorreta' | 'usuario_inativo' | 'usuario_bloqueado' | null
);

CREATE INDEX idx_logs_usuario    ON logs_acesso(usuario_id);
CREATE INDEX idx_logs_data       ON logs_acesso(data_login DESC);
CREATE INDEX idx_logs_sucesso    ON logs_acesso(sucesso);

-- ============================================================
-- TABELA: admin_anotacoes
-- Área editável pelo admin: vale repasse, contatos, endereços
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_anotacoes (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id     TEXT        NOT NULL,
  -- referência ao card do kanban
  tipo          TEXT        NOT NULL,
  -- 'vale_repasse' | 'contato_cliente' | 'endereco' | 'observacao'
  titulo        TEXT,
  conteudo      TEXT        NOT NULL,
  valor         NUMERIC(10,2),
  -- para vales/repasse com valor monetário
  criado_por    UUID        REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  editado_em    TIMESTAMPTZ,
  editado_por   UUID        REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX idx_anotacoes_pedido ON admin_anotacoes(pedido_id);
CREATE INDEX idx_anotacoes_tipo   ON admin_anotacoes(tipo);

-- ============================================================
-- TABELA: vales_repasse
-- Vale/repasse editável pelo admin
-- ============================================================
CREATE TABLE IF NOT EXISTS vales_repasse (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id      UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  -- funcionário que recebe o vale
  pedido_id       TEXT,
  descricao       TEXT        NOT NULL,
  valor           NUMERIC(10,2) NOT NULL,
  tipo            TEXT        NOT NULL DEFAULT 'vale',
  -- 'vale' | 'repasse' | 'comissao' | 'desconto'
  status          TEXT        NOT NULL DEFAULT 'pendente',
  -- 'pendente' | 'pago' | 'cancelado'
  data_emissao    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_pagamento  TIMESTAMPTZ,
  criado_por      UUID        REFERENCES usuarios(id) ON DELETE SET NULL,
  observacao      TEXT
);

CREATE INDEX idx_vales_usuario ON vales_repasse(usuario_id);
CREATE INDEX idx_vales_status  ON vales_repasse(status);
CREATE INDEX idx_vales_pedido  ON vales_repasse(pedido_id);
