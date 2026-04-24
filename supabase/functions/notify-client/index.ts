import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const EVOLUTION_URL = "http://75.119.131.233:8080";
const EVOLUTION_KEY = "crm-autopecas-2025";
const INSTANCE = "geisa";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MENSAGENS: Record<string, (nome: string, peca: string) => string> = {
  "em-busca": (nome, peca) =>
    `Ola ${nome}, tudo bem?\n\nNo momento nao tenho a peca *${peca}* no estoque, mas ja estou verificando com os colaboradores.\n\nAssim que tiver resposta, ja te aviso! Pode aguardar.`,

  "verificando-colaboradores": (nome, peca) =>
    `Ola ${nome}!\n\nNo momento nao tenho a peca *${peca}* disponivel, mas ja estou verificando com os colaboradores.\n\nAssim que eles me responderem, ja te dou retorno. Obrigado pela paciencia!`,

  "peca-encontrada": (nome, peca) =>
    `Boa noticia, ${nome}!\n\nLocalizamos sua peca: ${peca}.\n\nEstou verificando o valor e ja te passo certinho.`,

  "aguardando-preco": (nome, peca) =>
    `${nome}, sua peca ${peca} foi localizada.\n\nEstamos aguardando a confirmacao do valor. Em breve te retorno com o preco.`,

  "aguardando-repasse": (nome, peca) =>
    `${nome}, temos o valor da sua peca: ${peca}.\n\nEntre em contato para a gente finalizar o pedido.`,

  "aguardando-envio": (nome, peca) =>
    `Pedido confirmado, ${nome}!\n\nSua peca ${peca} esta sendo preparada para envio. Logo te passo mais detalhes.`,

  "finalizado": (nome, peca) =>
    `Pedido finalizado, ${nome}!\n\nSua peca ${peca} foi entregue com sucesso.\n\nObrigado pela preferencia. Qualquer duvida estamos a disposicao.`,
};

function normalizarNumero(numero: string): string {
  // Keep full JID formats (@lid, @s.whatsapp.net) as-is for Evolution API routing
  if (numero.includes("@")) return numero;
  // Strip non-digits
  const digits = numero.replace(/\D/g, "");
  // Add Brazil country code if missing
  if (digits.length === 10 || digits.length === 11) return "55" + digits;
  return digits;
}

async function enviarTexto(numero: string, texto: string) {
  const num = normalizarNumero(numero);
  await fetch(`${EVOLUTION_URL}/message/sendText/${INSTANCE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": EVOLUTION_KEY },
    body: JSON.stringify({ number: num, textMessage: { text: texto } }),
  });
}

async function enviarMidia(numero: string, base64: string, caption: string) {
  const num = normalizarNumero(numero);
  // Strip data URL prefix if present (e.g. "data:image/jpeg;base64,...")
  const mediaClean = base64.replace(/^data:[^;]+;base64,/, "");
  await fetch(`${EVOLUTION_URL}/message/sendMedia/${INSTANCE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": EVOLUTION_KEY },
    body: JSON.stringify({
      number: num,
      mediatype: "image",
      mimetype: "image/jpeg",
      caption: caption || "",
      media: mediaClean,
      fileName: "foto-peca.jpg",
    }),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", { status: 200, headers: CORS });
  }

  if (req.method !== "POST") {
    return new Response("OK", { status: 200, headers: CORS });
  }

  try {
    const body = await req.json();
    const { numero, nome, peca, status, customMessage, mediaBase64, mediaCaption } = body;

    if (!numero) {
      return new Response("numero obrigatorio", { status: 200, headers: CORS });
    }

    // Send image/media
    if (mediaBase64) {
      await enviarMidia(numero, mediaBase64, mediaCaption || "");
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Send text
    let texto = "";
    if (customMessage) {
      texto = customMessage;
    } else if (status && MENSAGENS[status]) {
      texto = MENSAGENS[status](nome || "Cliente", peca || "solicitada");
    } else {
      return new Response("mensagem nao configurada", { status: 200, headers: CORS });
    }

    await enviarTexto(numero, texto);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ERRO notify-client:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
