-- Tabela de pedidos vindos do WhatsApp
CREATE TABLE IF NOT EXISTS pedidos (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero          TEXT        NOT NULL,
  nome_cliente    TEXT        NOT NULL DEFAULT 'Cliente',
  veiculo         TEXT,
  peca            TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'novo-pedido',
  mensagem_original TEXT,
  preco_dinheiro  NUMERIC(10,2),
  preco_pix       NUMERIC(10,2),
  preco_cartao    NUMERIC(10,2),
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_numero ON pedidos(numero);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_criado ON pedidos(criado_em DESC);

-- Tabela de mensagens WhatsApp
CREATE TABLE IF NOT EXISTS mensagens_whatsapp (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero     TEXT        NOT NULL,
  nome       TEXT,
  mensagem   TEXT        NOT NULL,
  tipo       TEXT        NOT NULL DEFAULT 'text',
  de_mim     BOOLEAN     NOT NULL DEFAULT FALSE,
  dados_raw  JSONB,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_msgs_numero ON mensagens_whatsapp(numero);
CREATE INDEX IF NOT EXISTS idx_msgs_criado ON mensagens_whatsapp(criado_em DESC);

-- RLS
ALTER TABLE pedidos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens_whatsapp  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pedidos_select" ON pedidos;
DROP POLICY IF EXISTS "pedidos_insert" ON pedidos;
DROP POLICY IF EXISTS "pedidos_update" ON pedidos;
DROP POLICY IF EXISTS "pedidos_delete" ON pedidos;
DROP POLICY IF EXISTS "msgs_select" ON mensagens_whatsapp;
DROP POLICY IF EXISTS "msgs_insert" ON mensagens_whatsapp;

CREATE POLICY "pedidos_select" ON pedidos FOR SELECT USING (TRUE);
CREATE POLICY "pedidos_insert" ON pedidos FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "pedidos_update" ON pedidos FOR UPDATE USING (TRUE);
CREATE POLICY "pedidos_delete" ON pedidos FOR DELETE USING (get_cargo() = 'admin');

CREATE POLICY "msgs_select" ON mensagens_whatsapp FOR SELECT USING (TRUE);
CREATE POLICY "msgs_insert" ON mensagens_whatsapp FOR INSERT WITH CHECK (TRUE);

-- Trigger para atualizar atualizado_em nos pedidos
CREATE OR REPLACE FUNCTION trigger_pedidos_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN NEW.atualizado_em := NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pedidos_atualizado_em ON pedidos;
CREATE TRIGGER trg_pedidos_atualizado_em
  BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION trigger_pedidos_atualizado_em();
