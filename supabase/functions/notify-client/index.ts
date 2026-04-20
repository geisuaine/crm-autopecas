import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const EVOLUTION_URL = "http://75.119.131.233:8080";
const EVOLUTION_KEY = "crm-autopecas-2025";
const INSTANCE = "geisa";

const MENSAGENS: Record<string, (nome: string, peca: string) => string> = {
  "em-busca": (nome, peca) =>
    `Ola ${nome}, tudo bem?\n\nJa estamos buscando sua peca: ${peca}.\n\nAssim que localizar, te aviso aqui. Pode aguardar.`,

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
  if (req.method !== "POST") return new Response("OK", { status: 200 });

  try {
    const { numero, nome, peca, status } = await req.json();

    if (!numero || !status || !MENSAGENS[status]) {
      return new Response("status sem mensagem configurada", { status: 200 });
    }

    const nomeCliente = nome || "Cliente";
    const pecaCliente = peca || "solicitada";
    const texto = MENSAGENS[status](nomeCliente, pecaCliente);

    await enviarMensagem(numero, texto);

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("ERRO notify-client:", err);
    return new Response("error", { status: 500 });
  }
});
