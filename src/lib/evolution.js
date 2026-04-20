const EVOLUTION_URL = 'http://75.119.131.233:8080'
const EVOLUTION_KEY = 'pfukvbv7wfaowzs9hrsvxf'
const INSTANCE     = 'geisa'

const headers = {
  'Content-Type': 'application/json',
  'apikey': EVOLUTION_KEY,
}

// ── Enviar mensagem de texto ──────────────────────────────
export async function enviarMensagem(numero, texto) {
  const res = await fetch(`${EVOLUTION_URL}/message/sendText/${INSTANCE}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      number: numero,
      text: texto,
    }),
  })
  return res.ok
}

// ── Enviar imagem ─────────────────────────────────────────
export async function enviarImagem(numero, urlImagem, legenda = '') {
  const res = await fetch(`${EVOLUTION_URL}/message/sendMedia/${INSTANCE}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      number: numero,
      mediatype: 'image',
      media: urlImagem,
      caption: legenda,
    }),
  })
  return res.ok
}

// ── Configurar webhook para receber mensagens ─────────────
export async function configurarWebhook(webhookUrl) {
  const res = await fetch(`${EVOLUTION_URL}/webhook/set/${INSTANCE}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      url: webhookUrl,
      byEvents: true,
      base64: false,
      events: [
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED',
      ],
    }),
  })
  return res.ok
}

// ── Buscar status da instância ────────────────────────────
export async function buscarStatus() {
  const res = await fetch(`${EVOLUTION_URL}/instance/connectionState/${INSTANCE}`, { headers })
  if (!res.ok) return null
  return res.json()
}

// ── Formatar número para padrão brasileiro ────────────────
export function formatarNumero(numero) {
  const limpo = numero.replace(/\D/g, '')
  if (limpo.startsWith('55')) return limpo
  return `55${limpo}`
}
