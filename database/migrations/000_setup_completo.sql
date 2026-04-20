-- ============================================================
-- CRM AutoPeças — Setup Completo (rode tudo de uma vez)
-- ============================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABELAS (sem recriar se já existem)
-- ============================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome         TEXT        NOT NULL,
  email        TEXT        NOT NULL UNIQUE,
  senha_hash   TEXT        NOT NULL,
  telefone     TEXT,
  cargo        TEXT        NOT NULL DEFAULT 'funcionario',
  status       TEXT        NOT NULL DEFAULT 'ativo',
  ultimo_login TIMESTAMPTZ,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  criado_por   UUID        REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS permissoes (
  id         UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID    NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  modulo     TEXT    NOT NULL,
  visualizar BOOLEAN NOT NULL DEFAULT FALSE,
  criar      BOOLEAN NOT NULL DEFAULT FALSE,
  editar     BOOLEAN NOT NULL DEFAULT FALSE,
  excluir    BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(usuario_id, modulo)
);

CREATE TABLE IF NOT EXISTS logs_acesso (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id   UUID        REFERENCES usuarios(id) ON DELETE SET NULL,
  email        TEXT,
  ip           TEXT,
  dispositivo  TEXT,
  data_login   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sucesso      BOOLEAN     NOT NULL DEFAULT FALSE,
  motivo_falha TEXT
);

CREATE TABLE IF NOT EXISTS admin_anotacoes (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id   TEXT        NOT NULL,
  tipo        TEXT        NOT NULL,
  titulo      TEXT,
  conteudo    TEXT        NOT NULL,
  valor       NUMERIC(10,2),
  criado_por  UUID        REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  editado_em  TIMESTAMPTZ,
  editado_por UUID        REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS vales_repasse (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id     UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  pedido_id      TEXT,
  descricao      TEXT        NOT NULL,
  valor          NUMERIC(10,2) NOT NULL,
  tipo           TEXT        NOT NULL DEFAULT 'vale',
  status         TEXT        NOT NULL DEFAULT 'pendente',
  data_emissao   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_pagamento TIMESTAMPTZ,
  criado_por     UUID        REFERENCES usuarios(id) ON DELETE SET NULL,
  observacao     TEXT
);

-- ============================================================
-- ÍNDICES (IF NOT EXISTS evita erro se já existem)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_usuarios_email  ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);
CREATE INDEX IF NOT EXISTS idx_usuarios_cargo  ON usuarios(cargo);
CREATE INDEX IF NOT EXISTS idx_permissoes_usuario ON permissoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_permissoes_modulo  ON permissoes(modulo);
CREATE INDEX IF NOT EXISTS idx_logs_usuario    ON logs_acesso(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_data       ON logs_acesso(data_login DESC);
CREATE INDEX IF NOT EXISTS idx_logs_sucesso    ON logs_acesso(sucesso);
CREATE INDEX IF NOT EXISTS idx_anotacoes_pedido ON admin_anotacoes(pedido_id);
CREATE INDEX IF NOT EXISTS idx_anotacoes_tipo   ON admin_anotacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_vales_usuario ON vales_repasse(usuario_id);
CREATE INDEX IF NOT EXISTS idx_vales_status  ON vales_repasse(status);
CREATE INDEX IF NOT EXISTS idx_vales_pedido  ON vales_repasse(pedido_id);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE usuarios        ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissoes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_acesso     ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_anotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vales_repasse   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FUNÇÕES
-- ============================================================

CREATE OR REPLACE FUNCTION get_cargo()
RETURNS TEXT AS $$
  SELECT cargo FROM usuarios WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION tem_permissao(p_modulo TEXT, p_acao TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_cargo TEXT;
  v_perm  BOOLEAN;
BEGIN
  SELECT cargo INTO v_cargo FROM usuarios WHERE id = auth.uid();
  IF v_cargo = 'admin' THEN RETURN TRUE; END IF;
  EXECUTE format('SELECT %I FROM permissoes WHERE usuario_id = $1 AND modulo = $2', p_acao)
    INTO v_perm USING auth.uid(), p_modulo;
  RETURN COALESCE(v_perm, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION fazer_login(
  p_email TEXT, p_senha TEXT,
  p_ip TEXT DEFAULT NULL, p_dispositivo TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_usuario  usuarios%ROWTYPE;
  v_sucesso  BOOLEAN := FALSE;
  v_motivo   TEXT;
BEGIN
  SELECT * INTO v_usuario FROM usuarios WHERE email = lower(trim(p_email));
  IF NOT FOUND THEN v_motivo := 'usuario_nao_encontrado';
  ELSIF v_usuario.status = 'inativo'  THEN v_motivo := 'usuario_inativo';
  ELSIF v_usuario.status = 'bloqueado' THEN v_motivo := 'usuario_bloqueado';
  ELSIF v_usuario.senha_hash = crypt(p_senha, v_usuario.senha_hash) THEN
    v_sucesso := TRUE;
    UPDATE usuarios SET ultimo_login = NOW() WHERE id = v_usuario.id;
  ELSE v_motivo := 'senha_incorreta';
  END IF;

  INSERT INTO logs_acesso (usuario_id, email, ip, dispositivo, sucesso, motivo_falha)
  VALUES (
    CASE WHEN v_sucesso THEN v_usuario.id ELSE NULL END,
    lower(trim(p_email)), p_ip, p_dispositivo, v_sucesso, v_motivo
  );

  IF v_sucesso THEN
    RETURN json_build_object('sucesso', true, 'usuario', json_build_object(
      'id', v_usuario.id, 'nome', v_usuario.nome,
      'email', v_usuario.email, 'cargo', v_usuario.cargo
    ));
  ELSE
    RETURN json_build_object('sucesso', false, 'motivo', v_motivo);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION alterar_senha(
  p_usuario_id UUID, p_senha_atual TEXT, p_senha_nova TEXT
)
RETURNS JSON AS $$
DECLARE v_hash TEXT;
BEGIN
  SELECT senha_hash INTO v_hash FROM usuarios WHERE id = p_usuario_id;
  IF NOT FOUND THEN RETURN json_build_object('sucesso', false, 'motivo', 'usuario_nao_encontrado'); END IF;
  IF v_hash != crypt(p_senha_atual, v_hash) THEN RETURN json_build_object('sucesso', false, 'motivo', 'senha_atual_incorreta'); END IF;
  UPDATE usuarios SET senha_hash = crypt(p_senha_nova, gen_salt('bf', 12)) WHERE id = p_usuario_id;
  RETURN json_build_object('sucesso', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trigger_editado_em()
RETURNS TRIGGER AS $$
BEGIN NEW.editado_em := NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_anotacoes_editado_em ON admin_anotacoes;
CREATE TRIGGER trg_anotacoes_editado_em
  BEFORE UPDATE ON admin_anotacoes
  FOR EACH ROW EXECUTE FUNCTION trigger_editado_em();

-- ============================================================
-- POLÍTICAS (drop antes para evitar erro de duplicata)
-- ============================================================

DROP POLICY IF EXISTS "usuarios_select" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update" ON usuarios;
DROP POLICY IF EXISTS "usuarios_delete" ON usuarios;
DROP POLICY IF EXISTS "permissoes_select" ON permissoes;
DROP POLICY IF EXISTS "permissoes_insert" ON permissoes;
DROP POLICY IF EXISTS "permissoes_update" ON permissoes;
DROP POLICY IF EXISTS "permissoes_delete" ON permissoes;
DROP POLICY IF EXISTS "logs_select" ON logs_acesso;
DROP POLICY IF EXISTS "logs_insert" ON logs_acesso;
DROP POLICY IF EXISTS "logs_delete" ON logs_acesso;
DROP POLICY IF EXISTS "anotacoes_select" ON admin_anotacoes;
DROP POLICY IF EXISTS "anotacoes_insert" ON admin_anotacoes;
DROP POLICY IF EXISTS "anotacoes_update" ON admin_anotacoes;
DROP POLICY IF EXISTS "anotacoes_delete" ON admin_anotacoes;
DROP POLICY IF EXISTS "vales_select" ON vales_repasse;
DROP POLICY IF EXISTS "vales_insert" ON vales_repasse;
DROP POLICY IF EXISTS "vales_update" ON vales_repasse;
DROP POLICY IF EXISTS "vales_delete" ON vales_repasse;

CREATE POLICY "usuarios_select" ON usuarios FOR SELECT USING (get_cargo() = 'admin' OR id = auth.uid());
CREATE POLICY "usuarios_insert" ON usuarios FOR INSERT WITH CHECK (get_cargo() = 'admin');
CREATE POLICY "usuarios_update" ON usuarios FOR UPDATE USING (get_cargo() = 'admin' OR id = auth.uid());
CREATE POLICY "usuarios_delete" ON usuarios FOR DELETE USING (get_cargo() = 'admin');

CREATE POLICY "permissoes_select" ON permissoes FOR SELECT USING (get_cargo() = 'admin' OR usuario_id = auth.uid());
CREATE POLICY "permissoes_insert" ON permissoes FOR INSERT WITH CHECK (get_cargo() = 'admin');
CREATE POLICY "permissoes_update" ON permissoes FOR UPDATE USING (get_cargo() = 'admin');
CREATE POLICY "permissoes_delete" ON permissoes FOR DELETE USING (get_cargo() = 'admin');

CREATE POLICY "logs_select" ON logs_acesso FOR SELECT USING (get_cargo() = 'admin' OR usuario_id = auth.uid());
CREATE POLICY "logs_insert" ON logs_acesso FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "logs_delete" ON logs_acesso FOR DELETE USING (get_cargo() = 'admin');

CREATE POLICY "anotacoes_select" ON admin_anotacoes FOR SELECT USING (tem_permissao('kanban', 'visualizar'));
CREATE POLICY "anotacoes_insert" ON admin_anotacoes FOR INSERT WITH CHECK (get_cargo() = 'admin' OR tem_permissao('kanban', 'editar'));
CREATE POLICY "anotacoes_update" ON admin_anotacoes FOR UPDATE USING (get_cargo() = 'admin' OR criado_por = auth.uid());
CREATE POLICY "anotacoes_delete" ON admin_anotacoes FOR DELETE USING (get_cargo() = 'admin');

CREATE POLICY "vales_select" ON vales_repasse FOR SELECT USING (get_cargo() = 'admin' OR usuario_id = auth.uid());
CREATE POLICY "vales_insert" ON vales_repasse FOR INSERT WITH CHECK (get_cargo() = 'admin');
CREATE POLICY "vales_update" ON vales_repasse FOR UPDATE USING (get_cargo() = 'admin');
CREATE POLICY "vales_delete" ON vales_repasse FOR DELETE USING (get_cargo() = 'admin');

-- ============================================================
-- VIEW
-- ============================================================

CREATE OR REPLACE VIEW usuarios_com_permissoes AS
SELECT
  u.id, u.nome, u.email, u.telefone, u.cargo, u.status, u.ultimo_login, u.criado_em,
  json_agg(json_build_object(
    'modulo', p.modulo, 'visualizar', p.visualizar,
    'criar', p.criar, 'editar', p.editar, 'excluir', p.excluir
  )) FILTER (WHERE p.id IS NOT NULL) AS permissoes
FROM usuarios u
LEFT JOIN permissoes p ON p.usuario_id = u.id
GROUP BY u.id;
