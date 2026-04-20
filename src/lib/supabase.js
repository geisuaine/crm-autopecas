import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Autenticação ──────────────────────────────────────────

export async function fazerLogin(email, senha) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
  if (error) return { sucesso: false, motivo: error.message }
  return { sucesso: true, usuario: data.user, session: data.session }
}

export async function fazerLogout() {
  await supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

// ── Usuários ──────────────────────────────────────────────

export async function buscarPerfil(userId) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) return null
  return data
}

export async function buscarUsuarios() {
  const { data, error } = await supabase
    .from('usuarios_com_permissoes')
    .select('*')
    .order('criado_em', { ascending: false })
  if (error) return []
  return data
}

export async function cadastrarUsuario(dados) {
  // 1. Cria na auth do Supabase
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: dados.email,
    password: dados.senha,
    email_confirm: true,
  })
  if (authError) return { sucesso: false, motivo: authError.message }

  // 2. Insere perfil na tabela usuarios
  const { error: profileError } = await supabase.from('usuarios').insert({
    id: authData.user.id,
    nome: dados.nome,
    email: dados.email,
    telefone: dados.telefone || null,
    cargo: dados.cargo || 'funcionario',
    criado_por: dados.criado_por || null,
  })
  if (profileError) return { sucesso: false, motivo: profileError.message }

  return { sucesso: true, id: authData.user.id }
}

// ── Permissões ────────────────────────────────────────────

export async function buscarPermissoes(userId) {
  const { data, error } = await supabase
    .from('permissoes')
    .select('*')
    .eq('usuario_id', userId)
  if (error) return []
  return data
}

export async function salvarPermissao(userId, modulo, campos) {
  const { error } = await supabase
    .from('permissoes')
    .upsert({ usuario_id: userId, modulo, ...campos }, { onConflict: 'usuario_id,modulo' })
  return !error
}

// ── Logs de acesso ────────────────────────────────────────

export async function buscarLogs(limit = 50) {
  const { data, error } = await supabase
    .from('logs_acesso')
    .select('*, usuarios(nome, email)')
    .order('data_login', { ascending: false })
    .limit(limit)
  if (error) return []
  return data
}

// ── Vales / Repasse ───────────────────────────────────────

export async function buscarVales(userId = null) {
  let query = supabase
    .from('vales_repasse')
    .select('*, usuarios(nome)')
    .order('data_emissao', { ascending: false })
  if (userId) query = query.eq('usuario_id', userId)
  const { data, error } = await query
  if (error) return []
  return data
}

export async function criarVale(dados) {
  const { data, error } = await supabase.from('vales_repasse').insert(dados).select().single()
  if (error) return { sucesso: false, motivo: error.message }
  return { sucesso: true, vale: data }
}

export async function atualizarVale(id, campos) {
  const { error } = await supabase.from('vales_repasse').update(campos).eq('id', id)
  return !error
}

// ── Pedidos (WhatsApp) ────────────────────────────────────

export async function buscarPedidos() {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .order('criado_em', { ascending: false })
  if (error) return []
  return data
}

export async function atualizarPedido(id, campos) {
  const { error } = await supabase.from('pedidos').update(campos).eq('id', id)
  return !error
}

export async function buscarMensagens(numero) {
  const { data, error } = await supabase
    .from('mensagens_whatsapp')
    .select('*')
    .eq('numero', numero)
    .order('criado_em', { ascending: true })
  if (error) return []
  return data
}

export async function enviarMensagemDb(numero, nome, mensagem) {
  const { error } = await supabase.from('mensagens_whatsapp').insert({
    numero, nome, mensagem, tipo: 'text', de_mim: true,
  })
  return !error
}

// ── Anotações admin ───────────────────────────────────────

export async function buscarAnotacoes(pedidoId) {
  const { data, error } = await supabase
    .from('admin_anotacoes')
    .select('*')
    .eq('pedido_id', pedidoId)
    .order('criado_em', { ascending: false })
  if (error) return []
  return data
}

export async function salvarAnotacao(dados) {
  const { data, error } = await supabase.from('admin_anotacoes').insert(dados).select().single()
  if (error) return { sucesso: false, motivo: error.message }
  return { sucesso: true, anotacao: data }
}

export async function editarAnotacao(id, conteudo, editado_por) {
  const { error } = await supabase
    .from('admin_anotacoes')
    .update({ conteudo, editado_por })
    .eq('id', id)
  return !error
}
