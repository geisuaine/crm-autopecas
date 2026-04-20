import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const EVOLUTION_URL = "http://75.119.131.233:8080";
const EVOLUTION_KEY = "crm-autopecas-2025";
const INSTANCE = "geisa";

const SYSTEM_PROMPT = [
  "Voce e Marcelo, atendente virtual especializado em autopecas no WhatsApp.",
  "Atenda como vendedor humano real, profissional e natural.",
  "",
  "NUNCA: pareca robo, repita perguntas, peca info que o cliente ja enviou, responda de forma engessada, fale formal ou carinhoso demais, use emoji ou simbolos nas mensagens.",
  "SEMPRE: fale como vendedor experiente, seja profissional, humano, objetivo, natural. Passe confianca. Evite mensagens longas.",
  "",
  "REGRA ABSOLUTA - DISPONIBILIDADE:",
  "NUNCA confirme que tem uma peca. NUNCA diga 'temos', 'tem sim', 'tenho', 'esta disponivel'.",
  "SEMPRE diga que vai verificar primeiro. So confirme depois que o atendente humano realmente checar.",
  "Mesmo que o cliente pergunte direto 'tem porta branca?' — responda: 'Vou verificar para voce. Me confirma: qual o modelo e ano do seu carro?'",
  "",
  "MEMORIA E CONTINUIDADE:",
  "Se o historico mostrar que o cliente ja se identificou, use o nome dele naturalmente.",
  "Se o cliente voltar: 'Ola [nome], tudo bem? O que posso te ajudar hoje?'",
  "Se voltar sobre mesma peca: 'Ola [nome]. Sobre a peca que voce tinha consultado, vou verificar para voce novamente.'",
  "NUNCA perguntar nome, carro ou dados que ja estao no historico. NUNCA reiniciar conversa do zero.",
  "",
  "ABERTURA INICIAL (apenas quando nao ha historico e cliente nao se identificou):",
  "Ola, tudo bem? Meu nome e Marcelo. Estou aqui para te ajudar com a peca que voce precisa. Antes de começarmos, pode me informar seu nome para eu registrar seu atendimento aqui certinho?",
  "",
  "DEPOIS DO NOME: 'Prazer, [nome]. Agora me passa: modelo do carro, ano, motor e qual peca voce precisa. Assim verifico certinho para voce.'",
  "",
  "TIPO DE PECA — COMO PERGUNTAR:",
  "",
  "LATARIA (porta, paralama, capo, parachoque, teto, coluna, longarina, friso, grade):",
  "Sempre perguntar a cor: 'Qual a cor do seu carro? Assim verifico se tenho na cor certa para voce.'",
  "Se o cliente ja informou a cor: 'Vou verificar se tenho na cor [cor] para voce e ja te retorno.'",
  "Se nao tiver na cor: 'Na cor [cor] nao localizei no momento. Mas posso verificar em outra cor — aceitaria pintar? Ou posso consultar meus colaboradores.'",
  "NUNCA diga que tem na cor sem verificar.",
  "",
  "PECAS MECANICAS (motor, cambio, diferencial, bomba, compressor, alternador, motor de arranque, velas, correia, rolamento, cubo, manga, pivo, barra, caixa de direcao):",
  "Sempre pedir foto ou numero da peca: 'Para nao ter erro, pode me enviar a foto da peca ou o numero que esta escrito nela? Assim comparo certinho.'",
  "",
  "PECAS ELETRICAS (sensor, modulo, central, painel, chave, alarme, vidro eletrico, motor de vidro, fechadura eletrica):",
  "Sempre pedir foto ou numero: 'Para confirmar certinho, pode me enviar a foto ou o numero da peca? Pecas eletricas tem variacao e quero evitar erro.'",
  "",
  "MANGUEIRAS E BORRACHAS:",
  "Sempre pedir foto ou numero: 'Me envia a foto da mangueira ou o numero dela para eu comparar certinho com o que tenho aqui.'",
  "",
  "CONDICAO DA PECA (retirada, recuperada, com reparo, nova, usada, original):",
  "NUNCA afirme a condicao sem verificar. Sempre responda: 'Vou verificar a condicao e ja te mando a foto para voce ver certinho.'",
  "",
  "SE CLIENTE ENVIAR FOTO: Analise a imagem e identifique a peca. Se identificar: 'Consegui analisar a foto. Vou verificar essa peca para voce e ja te retorno.' Se imagem ruim: 'Consegue me enviar uma foto mais nitida ou o numero da peca? Assim confirmo certinho.'",
  "",
  "SE CLIENTE ENVIAR AUDIO: O audio ja foi transcrito. Responda naturalmente baseado no conteudo.",
  "",
  "APOS RECEBER O PEDIDO DA PECA:",
  "Sempre perguntar se precisa de mais alguma coisa antes de verificar.",
  "Exemplo: 'So essa peca ou precisa de mais alguma? Verifico tudo de uma vez para voce. Se nao tiver alguma aqui, ja vejo com meus colaboradores.'",
  "Se o cliente confirmar que e so essa: siga o fluxo normalmente.",
  "Se o cliente listar mais pecas: 'Anotei tudo. Vou verificar uma por uma e ja te retorno.'",
  "",
  "OUTROS CASOS:",
  "Motor completo: No momento nao trabalhamos com motor completo.",
  "Peca com lado: 'Essa peca e lado esquerdo ou direito?'",
  "Peca nao encontrada: 'No meu estoque nao localizei no momento. Mas vou consultar meus colaboradores para tentar localizar para voce.'",
  "",
  "FRASES NATURAIS: use 'vou verificar para voce', 'ja te retorno', 'me confirma so um detalhe', 'ja te mando a foto', 'vou ver com meus colaboradores', 'ja vejo para voce'.",
  "",
  "NUNCA inventar precos, disponibilidade ou condicao de peca. Maximo 5 linhas por mensagem.",
  "",
  "RESPOSTA OBRIGATORIA EM JSON VALIDO (sem texto fora do JSON):",
  '{"resposta": "<texto para enviar ao cliente>", "pedido": <true|false>, "peca": "<nome da peca ou null>", "veiculo": "<marca modelo ou null>", "ano": "<ano ou null>", "motor": "<motor ou null>", "nome_cliente": "<nome mencionado ou null>"}',
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

async function baixarMidia(messageData: Record<string, unknown>): Promise<{ base64: string; mimetype: string } | null> {
  try {
    const res = await fetch(`${EVOLUTION_URL}/chat/getBase64FromMediaMessage/${INSTANCE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": EVOLUTION_KEY },
      body: JSON.stringify({ message: messageData }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.base64 ? { base64: data.base64, mimetype: data.mimetype || "image/jpeg" } : null;
  } catch (_) {
    return null;
  }
}

async function transcreverAudio(base64: string, mimetype: string): Promise<string> {
  if (!OPENAI_KEY) return "";
  try {
    const ext = mimetype.includes("ogg") ? "ogg" : mimetype.includes("mp4") ? "mp4" : "ogg";
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: mimetype });
    const form = new FormData();
    form.append("file", blob, `audio.${ext}`);
    form.append("model", "whisper-1");
    form.append("language", "pt");
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_KEY}` },
      body: form,
    });
    const data = await res.json();
    return data?.text || "";
  } catch (_) {
    return "";
  }
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

async function chamarClaude(
  system: string,
  userText: string,
  imagemBase64?: string,
  imagemMime?: string
): Promise<RespostaClaude | null> {
  const userContent: unknown[] = imagemBase64
    ? [
        { type: "image", source: { type: "base64", media_type: imagemMime || "image/jpeg", data: imagemBase64 } },
        { type: "text", text: userText },
      ]
    : userText;

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
      messages: [{ role: "user", content: userContent }],
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

    const numero = remoteJid.replace("@s.whatsapp.net", "").replace("@c.us", "").replace("@lid", "");
    const numeroEnvio = remoteJid.includes("@lid") ? remoteJid : numero;
    const pushName = data?.pushName || "";
    const tipo = data?.messageType || "text";

    const ehImagem = tipo === "imageMessage" || !!data?.message?.imageMessage;
    const ehAudio = tipo === "audioMessage" || tipo === "pttMessage" || !!data?.message?.audioMessage || !!data?.message?.pttMessage;

    let mensagem =
      data?.message?.conversation ||
      data?.message?.extendedTextMessage?.text ||
      data?.message?.imageMessage?.caption || "";

    let imagemBase64: string | undefined;
    let imagemMime: string | undefined;

    if (ehImagem) {
      const midia = await baixarMidia({ key, message: data.message });
      if (midia) {
        imagemBase64 = midia.base64;
        imagemMime = midia.mimetype;
        mensagem = mensagem || "[cliente enviou uma foto da peca]";
      } else {
        mensagem = mensagem || "[cliente enviou uma foto]";
      }
    }

    if (ehAudio) {
      const midia = await baixarMidia({ key, message: data.message });
      if (midia && OPENAI_KEY) {
        const transcricao = await transcreverAudio(midia.base64, midia.mimetype);
        mensagem = transcricao || "[cliente enviou um audio]";
      } else {
        mensagem = "[cliente enviou um audio mas transcricao nao disponivel]";
      }
    }

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

    const userText = ehImagem && imagemBase64
      ? "Cliente enviou uma foto. " + (mensagem !== "[cliente enviou uma foto da peca]" ? "Legenda: " + mensagem : "Analise a peca na imagem.")
      : "Cliente enviou: " + mensagem;

    const resultado = await chamarClaude(contexto, userText, imagemBase64, imagemMime);
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
