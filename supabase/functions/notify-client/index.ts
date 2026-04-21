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

async function enviarMensagem(numero: string, texto: string) {
  await fetch(`${EVOLUTION_URL}/message/sendText/${INSTANCE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": EVOLUTION_KEY },
    body: JSON.stringify({ number: numero, textMessage: { text: texto } }),
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
    const { numero, nome, peca, status, customMessage } = await req.json();

    if (!numero) {
      return new Response("numero obrigatorio", { status: 200, headers: CORS });
    }

    let texto = "";

    if (customMessage) {
      texto = customMessage;
    } else if (status && MENSAGENS[status]) {
      texto = MENSAGENS[status](nome || "Cliente", peca || "solicitada");
    } else {
      return new Response("mensagem nao configurada", { status: 200, headers: CORS });
    }

    await enviarMensagem(numero, texto);

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
