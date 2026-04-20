-- ============================================================
-- CRM AutoPeças — Migração 003: Funções e Triggers
-- ============================================================

-- ============================================================
-- FUNÇÃO: login
-- Valida email/senha e registra log
-- ============================================================
CREATE OR REPLACE FUNCTION fazer_login(
  p_email      TEXT,
  p_senha      TEXT,
  p_ip         TEXT DEFAULT NULL,
  p_dispositivo TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_usuario  usuarios%ROWTYPE;
  v_sucesso  BOOLEAN := FALSE;
  v_motivo   TEXT;
  v_resultado JSON;
BEGIN
  -- Busca usuário
  SELECT * INTO v_usuario
  FROM usuarios
  WHERE email = lower(trim(p_email));

  IF NOT FOUND THEN
    v_motivo := 'usuario_nao_encontrado';
  ELSIF v_usuario.status = 'inativo' THEN
    v_motivo := 'usuario_inativo';
  ELSIF v_usuario.status = 'bloqueado' THEN
    v_motivo := 'usuario_bloqueado';
  ELSIF v_usuario.senha_hash = crypt(p_senha, v_usuario.senha_hash) THEN
    v_sucesso := TRUE;
    -- Atualiza último login
    UPDATE usuarios SET ultimo_login = NOW() WHERE id = v_usuario.id;
  ELSE
    v_motivo := 'senha_incorreta';
  END IF;

  -- Registra log
  INSERT INTO logs_acesso (usuario_id, email, ip, dispositivo, sucesso, motivo_falha)
  VALUES (
    CASE WHEN v_sucesso THEN v_usuario.id ELSE NULL END,
    lower(trim(p_email)),
    p_ip,
    p_dispositivo,
    v_sucesso,
    v_motivo
  );

  -- Retorna resultado
  IF v_sucesso THEN
    v_resultado := json_build_object(
      'sucesso', true,
      'usuario', json_build_object(
        'id',      v_usuario.id,
        'nome',    v_usuario.nome,
        'email',   v_usuario.email,
        'cargo',   v_usuario.cargo,
        'telefone',v_usuario.telefone
      )
    );
  ELSE
    v_resultado := json_build_object(
      'sucesso', false,
      'motivo',  v_motivo
    );
  END IF;

  RETURN v_resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNÇÃO: cadastrar_usuario
-- Somente admin pode criar usuários
-- ============================================================
CREATE OR REPLACE FUNCTION cadastrar_usuario(
  p_nome       TEXT,
  p_email      TEXT,
  p_senha      TEXT,
  p_telefone   TEXT DEFAULT NULL,
  p_cargo      TEXT DEFAULT 'funcionario',
  p_criado_por UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_novo_id UUID;
BEGIN
  -- Verifica se email já existe
  IF EXISTS (SELECT 1 FROM usuarios WHERE email = lower(trim(p_email))) THEN
    RETURN json_build_object('sucesso', false, 'motivo', 'email_ja_cadastrado');
  END IF;

  INSERT INTO usuarios (nome, email, senha_hash, telefone, cargo, criado_por)
  VALUES (
    trim(p_nome),
    lower(trim(p_email)),
    crypt(p_senha, gen_salt('bf', 12)),
    p_telefone,
    p_cargo,
    p_criado_por
  )
  RETURNING id INTO v_novo_id;

  -- Permissões padrão por cargo
  IF p_cargo = 'funcionario' THEN
    INSERT INTO permissoes (usuario_id, modulo, visualizar, criar)
    VALUES
      (v_novo_id, 'kanban',      TRUE, FALSE),
      (v_novo_id, 'vendas',      TRUE, TRUE),
      (v_novo_id, 'novo_pedido', TRUE, TRUE);
  ELSIF p_cargo = 'gerente' THEN
    INSERT INTO permissoes (usuario_id, modulo, visualizar, criar, editar)
    VALUES
      (v_novo_id, 'kanban',        TRUE, TRUE, TRUE),
      (v_novo_id, 'vendas',        TRUE, TRUE, TRUE),
      (v_novo_id, 'repasse',       TRUE, TRUE, FALSE),
      (v_novo_id, 'colaboradores', TRUE, FALSE, FALSE),
      (v_novo_id, 'relatorios',    TRUE, FALSE, FALSE),
      (v_novo_id, 'novo_pedido',   TRUE, TRUE, TRUE),
      (v_novo_id, 'prospeccao',    TRUE, TRUE, FALSE);
  END IF;
  -- Admin: sem registro em permissoes (acesso total via política)

  RETURN json_build_object('sucesso', true, 'id', v_novo_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNÇÃO: alterar_senha
-- ============================================================
CREATE OR REPLACE FUNCTION alterar_senha(
  p_usuario_id UUID,
  p_senha_atual TEXT,
  p_senha_nova  TEXT
)
RETURNS JSON AS $$
DECLARE
  v_hash TEXT;
BEGIN
  SELECT senha_hash INTO v_hash FROM usuarios WHERE id = p_usuario_id;

  IF NOT FOUND THEN
    RETURN json_build_object('sucesso', false, 'motivo', 'usuario_nao_encontrado');
  END IF;

  IF v_hash != crypt(p_senha_atual, v_hash) THEN
    RETURN json_build_object('sucesso', false, 'motivo', 'senha_atual_incorreta');
  END IF;

  UPDATE usuarios
  SET senha_hash = crypt(p_senha_nova, gen_salt('bf', 12))
  WHERE id = p_usuario_id;

  RETURN json_build_object('sucesso', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGER: atualiza editado_em em admin_anotacoes
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_editado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.editado_em := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_anotacoes_editado_em
  BEFORE UPDATE ON admin_anotacoes
  FOR EACH ROW EXECUTE FUNCTION trigger_editado_em();

-- ============================================================
-- VIEW: usuarios_com_permissoes
-- Facilita consulta no frontend
-- ============================================================
CREATE OR REPLACE VIEW usuarios_com_permissoes AS
SELECT
  u.id,
  u.nome,
  u.email,
  u.telefone,
  u.cargo,
  u.status,
  u.ultimo_login,
  u.criado_em,
  json_agg(
    json_build_object(
      'modulo',     p.modulo,
      'visualizar', p.visualizar,
      'criar',      p.criar,
      'editar',     p.editar,
      'excluir',    p.excluir
    )
  ) FILTER (WHERE p.id IS NOT NULL) AS permissoes
FROM usuarios u
LEFT JOIN permissoes p ON p.usuario_id = u.id
GROUP BY u.id;
