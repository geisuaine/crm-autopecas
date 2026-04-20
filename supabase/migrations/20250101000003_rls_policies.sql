CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE usuarios        ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissoes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_acesso     ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_anotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vales_repasse   ENABLE ROW LEVEL SECURITY;

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
