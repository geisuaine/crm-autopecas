import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const EVOLUTION_URL = "http://75.119.131.233:8080";
const EVOLUTION_KEY = "crm-autopecas-2025";
const INSTANCE = "geisa";

const SYSTEM_PROMPT = [
  "Voce e Marcelo, atendente virtual especializado em autopecas no WhatsApp.",
  "Atenda como vendedor humano real, profissional e natural.",
  "",
  "NUNCA: pareca robo, repita perguntas, peca info que o cliente ja enviou, responda de forma engessada.",
  "SEMPRE: fale como vendedor experiente, seja objetivo, humano, natural. Evite mensagens curtas e diretas.",
  "",
  "MEMORIA DO CLIENTE:",
  "Se o historico mostrar que o cliente ja se identificou antes, use o nome dele naturalmente.",
  "Se o cliente voltar: 'Ola [nome], tudo bem? O que posso te ajudar hoje?'",
  "Nunca peca nome ou dados que ja estao no historico.",
  "",
  "ABERTURA INICIAL (apenas quando nao ha historico):",
  "Ola, tudo bem? Meu nome e Marcelo. Estou aqui para te ajudar com a peca que voce precisa. Pode me informar seu nome para eu registrar seu atendimento?",
  "",
  "DEPOIS DO NOME: Perguntar modelo do carro, ano, motor e qual peca precisa.",
  "",
  "SE PERGUNTAR DIRETO SOBRE PECA: Responda sem voltar ao comeco.",
  "Cor: Vou verificar para voce e ja te confirmo certinho.",
  "Original/usado: Vou confirmar essa informacao para voce e ja te retorno.",
  "Recuperado: Vou verificar certinho e ja te mando a foto da peca.",
  "Valor antes: Vou localizar a peca primeiro para confirmar disponibilidade e ja te passo o valor.",
  "Motor completo: No momento nao trabalhamos com motor completo.",
  "Peca com lado: Essa peca e lado esquerdo ou direito?",
  "Peca mecanica: Se puder me enviar a foto da peca ou o numero dela, ajuda a comparar certinho.",
  "Muitas pecas: Pode me passar todas. Vou verificar uma por uma.",
  "",
  "ENQUANTO CONSULTA: Ja estou verificando para voce. So um momento.",
  "SE ENCONTRAR: Localizei a peca. Vou te enviar a foto para voce confirmar.",
  "SE NAO ENCONTRAR: No meu estoque nao encontrei. Mas vou consultar meus colaboradores.",
  "",
  "NUNCA inventar precos ou disponibilidade. Maximo 5 linhas por mensagem.",
  "",
  "RESPOSTA OBRIGATORIA EM JSON VALIDO (sem texto fora do JSON):",
  '{\"resposta\": \"<texto para enviar ao cliente>\", \"pedido\": <true|false>, \"peca\": \"<nome da peca ou null>\", \"veiculo\": \"<marca modelo ou null>\", \"ano\": \"<ano ou null>\", \"motor\": \"<motor ou null>\", \"nome_cliente\": \"<nome mencionado ou null>\"}',
].join("\n");

async function buscarCliente(numero: string) {
  const { data } = await supabase
    .from("clientes")
    .select("*")
    .eq("numero", numero)
    .single();
  return data;
}

async function salvarCliente(numero: string, nome: string, updates: Record<string, string>) {
  await supabase.from("clientes").upsert(
    { numero, nome, ...updates, atualizado_em: new Date().toISOString() },
    { onConflict: "numero" }
  );
}

async function buscarHistorico(numero: string): Promise<string> {
  const { data } = await supabase
    .from("mensagens_whatsapp")
    .select("de_mim, mensagem")
    .eq("numero", numero)
    .order("criado_em", { ascending: false })
    .limit(15);

  if (!data || data.length === 0) return "";

  const msgs = data.reverse().map((m: { de_mim: boolean; mensagem: string }) =>
    m.de_mim ? "Marcelo: " + m.mensagem : "Cliente: " + m.mensagem
  );
  return "\n\nHISTORICO RECENTE:\n" + msgs.join("\n");
}

interface RespostaClaude {
  resposta: string;
  pedido: boolean;
  peca: string | null;
  veiculo: string | null;
  ano: string | null;
  motor: string | null;
  nome_cliente: string | null;
}

async function chamarClaude(system: string, user: string): Promise<RespostaClaude | null> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  const data = await res.json();
  const text = data?.content?.[0]?.text || "";
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch (_) {
    return { resposta: text, pedido: false, peca: null, veiculo: null, ano: null, motor: null, nome_cliente: null };
  }
}

async function enviarMensagem(numero: string, texto: string) {
  await fetch(EVOLUTION_URL + "/message/sendText/" + INSTANCE, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": EVOLUTION_KEY },
    body: JSON.stringify({ number: numero, textMessage: { text: texto } }),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("OK", { status: 200 });
  try {
    const body = await req.json();
    const data = body?.data || body;
    const key = data?.key || {};
    const remoteJid = key?.remoteJid || "";

    if (key?.fromMe) return new Response("ignored", { status: 200 });
    if (remoteJid.includes("@g.us")) return new Response("ignored", { status: 200 });
    if (remoteJid.includes("@broadcast")) return new Response("ignored", { status: 200 });

    // numero para banco (sem sufixo), numeroEnvio para Evolution API (com sufixo @lid ou @s.whatsapp.net)
    const numero = remoteJid.replace("@s.whatsapp.net", "").replace("@c.us", "").replace("@lid", "");
    const numeroEnvio = remoteJid.includes("@lid") ? remoteJid : numero;
    const pushName = data?.pushName || "";
    const tipo = data?.messageType || "text";
    const mensagem =
      data?.message?.conversation ||
      data?.message?.extendedTextMessage?.text ||
      data?.message?.imageMessage?.caption || "";

    if (!numero || !mensagem) return new Response("ignored", { status: 200 });

    const [cliente, historico] = await Promise.all([
      buscarCliente(numero),
      buscarHistorico(numero),
    ]);

    const nomeCliente = cliente?.nome || pushName || "Cliente";

    await Promise.all([
      salvarCliente(numero, nomeCliente, {}),
      supabase.from("mensagens_whatsapp").insert({
        numero, nome: nomeCliente, mensagem, tipo, de_mim: false, dados_raw: body,
      }),
    ]);

    let perfilCliente = "";
    if (cliente?.nome || cliente?.veiculo) {
      perfilCliente = "\n\nPERFIL DO CLIENTE:\n";
      if (cliente.nome) perfilCliente += "Nome: " + cliente.nome + "\n";
      if (cliente.veiculo) perfilCliente += "Veiculo: " + cliente.veiculo;
      if (cliente.ano) perfilCliente += " " + cliente.ano;
      if (cliente.motor) perfilCliente += " " + cliente.motor;
    }

    const ehPrimeiro = historico === "";
    const contexto = SYSTEM_PROMPT
      + perfilCliente
      + (ehPrimeiro ? "\n\nOBS: Este e o PRIMEIRO contato deste cliente." : "")
      + historico;

    const resultado = await chamarClaude(contexto, "Cliente enviou: " + mensagem);
    if (!resultado) return new Response("ok", { status: 200 });

    const { resposta, pedido, peca, veiculo, ano, motor, nome_cliente } = resultado;

    const updates: Record<string, string> = {};
    if (nome_cliente) updates.nome = nome_cliente;
    if (veiculo) updates.veiculo = veiculo;
    if (ano) updates.ano = ano;
    if (motor) updates.motor = motor;

    const ops: Promise<unknown>[] = [];
    if (Object.keys(updates).length > 0) {
      ops.push(salvarCliente(numero, updates.nome || nomeCliente, updates));
    }
    if (pedido && peca) {
      ops.push(supabase.from("pedidos").insert({
        numero,
        nome_cliente: updates.nome || nomeCliente,
        veiculo: veiculo || cliente?.veiculo || null,
        peca,
        status: "novo-pedido",
        mensagem_original: mensagem,
      }));
    }
    if (resposta) {
      ops.push(enviarMensagem(numeroEnvio, resposta));
      ops.push(supabase.from("mensagens_whatsapp").insert({
        numero, nome: "Marcelo", mensagem: resposta, tipo: "text", de_mim: true, dados_raw: null,
      }));
    }
    await Promise.all(ops);

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("ERRO:", err);
    return new Response("error", { status: 500 });
  }
});
