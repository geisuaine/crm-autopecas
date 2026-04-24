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
  "Atenda como vendedor humano real, profissional e natural. Voce e capaz de: ler texto, interpretar fotos, identificar pecas por imagem, ler numero de etiqueta, analisar documentos do veiculo, entender audios transcritos.",
  "",
  "NUNCA: pareca robo, repita perguntas, peca info que o cliente ja enviou, responda de forma engessada, fale formal ou carinhoso demais, use emoji ou simbolos nas mensagens.",
  "SEMPRE: fale como vendedor experiente, seja profissional, humano, objetivo, natural. Passe confianca. Evite mensagens longas. Maximo 5 linhas por mensagem.",
  "",
  "=== REGRA ABSOLUTA — DISPONIBILIDADE (NUNCA VIOLE) ===",
  "PROIBIDO: 'temos sim', 'tem sim', 'trabalhamos com', 'a gente trabalha com', 'tenho sim', 'esta disponivel', 'pode ser que sim', 'geralmente temos', 'costumamos ter', 'sim temos', 'claro que temos'.",
  "OBRIGATORIO: 'Vou verificar para voce', 'Deixa eu checar', 'Ja vejo para voce', 'Vou checar no estoque'.",
  "EXEMPLO — Cliente: 'Tem farol?' → ERRADO: 'Sim, temos!' → CERTO: 'Vou verificar para voce. E dianteiro ou traseiro?'",
  "EXEMPLO — Cliente: 'tem ou nao tem?' → ERRADO: 'Temos sim!' → CERTO: 'Preciso verificar no estoque. Ja vejo e te retorno.'",
  "",
  "=== MEMORIA E CONTINUIDADE ===",
  "Use o PERFIL DO CLIENTE e o HISTORICO fornecidos para personalizar o atendimento.",
  "Se o cliente ja se identificou: use o nome naturalmente. Nao pergunte nome de novo.",
  "Se o cliente voltar: 'Ola [nome], tudo bem? O que posso te ajudar hoje?'",
  "Se voltar sobre mesma peca: 'Ola [nome], sobre a peca que voce consultou, vou verificar novamente.'",
  "Analise o historico completo: ultima mensagem, penultima, assunto atual, status do atendimento.",
  "Entenda: se o cliente respondeu uma pergunta anterior, se mudou de peca, se esta pedindo preco, confirmando compra, enviando foto ou retomando conversa antiga.",
  "NUNCA reinicie conversa do zero se ja houver historico.",
  "",
  "=== FLUXO DE ATENDIMENTO ===",
  "PRIMEIRO CONTATO sem dados: pergunte APENAS modelo e ano do carro.",
  "Apos modelo/ano: pergunte qual peca.",
  "Apos peca: pergunte se precisa de mais alguma. ('So essa ou precisa de mais alguma? Verifico tudo de uma vez.')",
  "Apos confirmar que nao precisa de mais nada: 'Perfeito! Seu pedido ja foi pro nosso painel. Verificamos e te retornamos em breve!'",
  "SE ja veio com modelo/ano: pule para peca. SE ja veio com peca: pule para 'mais alguma?'. NUNCA repita o que o cliente ja informou.",
  "",
  "=== TIPOS DE PECA ===",
  "LATARIA (porta, paralama, capo, parachoque, grade): sempre pergunte a cor primeiro.",
  "MECANICA/ELETRICA/MANGUEIRA: peca foto ou numero: 'Me manda a foto ou o numero da peca para comparar certinho e evitar erro.'",
  "CONDICAO (original, recuperado, usado): 'Vou verificar a condicao e ja te mando a foto para voce ver.'",
  "LADO (farol, espelho, paralama): 'Essa peca e lado esquerdo ou direito?'",
  "MOTOR COMPLETO: 'No momento nao trabalhamos com motor completo.'",
  "FOTO enviada: analise e identifique. Se identificou: 'Consegui ver a foto. Vou verificar essa peca e ja te retorno.' Se ruim: 'Consegue mandar uma foto mais nitida ou o numero da peca?'",
  "AUDIO: ja foi transcrito. Responda naturalmente baseado no conteudo.",
  "",
  "=== FRASES NATURAIS ===",
  "use: 'vou verificar para voce', 'ja te retorno', 'me confirma so um detalhe', 'ja te mando a foto', 'vou ver com meus colaboradores', 'ja vejo para voce', 'so um momento'.",
  "",
  "NUNCA inventar precos, disponibilidade ou condicao de peca.",
  "",
  "=== RESPOSTA OBRIGATORIA EM JSON VALIDO (sem texto fora do JSON) ===",
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

async function salvarCliente(numero: string, nome: string, updates: Record<string, unknown>) {
  await supabase.from("clientes").upsert(
    { numero, nome, ...updates, atualizado_em: new Date().toISOString() },
    { onConflict: "numero" }
  );
}

function estaEmPausaHumana(cliente: Record<string, unknown> | null): boolean {
  if (!cliente?.modo_humano) return false;
  if (!cliente?.pausa_expira) return false;
  return new Date(cliente.pausa_expira as string) > new Date();
}

async function ativarPausaHumana(numero: string) {
  const expira = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  await supabase.from("clientes").upsert(
    { numero, modo_humano: true, pausa_expira: expira, atualizado_em: new Date().toISOString() },
    { onConflict: "numero" }
  );
}

async function renovarPausaHumana(numero: string) {
  const expira = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  await supabase.from("clientes").update(
    { pausa_expira: expira, atualizado_em: new Date().toISOString() }
  ).eq("numero", numero);
}

async function desativarPausaHumana(numero: string) {
  await supabase.from("clientes").update(
    { modo_humano: false, pausa_expira: null, atualizado_em: new Date().toISOString() }
  ).eq("numero", numero);
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

const FERIADOS_BR = ["01-01","04-21","05-01","09-07","10-12","11-02","11-15","12-25"];

function isHorarioComercial(): boolean {
  // Brazil UTC-3
  const now = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const day = now.getUTCDay(); // 0=Dom, 6=Sab
  const hour = now.getUTCHours();
  const min = now.getUTCMinutes();
  const time = hour + min / 60;
  const mmdd = String(now.getUTCMonth() + 1).padStart(2, "0") + "-" + String(now.getUTCDate()).padStart(2, "0");
  const feriado = FERIADOS_BR.includes(mmdd);
  if (day === 0) return false;                          // Domingo: fechado
  if (feriado) return time >= 8 && time < 13;           // Feriado: 8h-13h
  if (day >= 1 && day <= 5) return time >= 8 && time < 17; // Seg-Sex: 8h-17h
  if (day === 6) return time >= 8 && time < 12.5;       // Sábado: 8h-12h30
  return false;
}

function msgForaHorario(nome: string, peca: string | null, veiculo: string | null, ano: string | null): string {
  const now = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const day = now.getUTCDay();
  const mmdd = String(now.getUTCMonth() + 1).padStart(2, "0") + "-" + String(now.getUTCDate()).padStart(2, "0");
  const feriado = FERIADOS_BR.includes(mmdd);
  const firstName = nome.split(" ")[0];
  const motivo = feriado
    ? "📅 Hoje é feriado, estamos com horário reduzido."
    : day === 0
    ? "📅 Estamos fora do expediente no momento."
    : "⏰ Estamos fora do horário comercial no momento.";

  const veiculoStr = veiculo ? `\n🚗 Veículo: ${veiculo}${ano ? " " + ano : ""}` : "";
  const pecaStr = peca ? `\nRecebemos o seu pedido:\n• ${peca}${veiculoStr}\n\n` : "";

  return `Olá, ${firstName}! 👋\n\nObrigado por entrar em contato com a *Auto Peças*!\n\n${pecaStr}${motivo}\n\n🕐 *Horário de atendimento:*\n• Segunda a Sexta: 8h às 17h\n• Sábado: 8h às 12h30\n• Feriados: 8h às 13h\n\n✅ Seu pedido *já foi para o nosso painel de atendimento!*\n\nAssim que iniciarmos o expediente entraremos em contato. Caso não tenhamos todas as peças disponíveis, verificaremos com nossos colaboradores! 💪`;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("OK", { status: 200 });
  try {
    const body = await req.json();
    const data = body?.data || body;
    const key = data?.key || {};
    const remoteJid = key?.remoteJid || "";

    if (remoteJid.includes("@g.us")) return new Response("ignored", { status: 200 });
    if (remoteJid.includes("@broadcast")) return new Response("ignored", { status: 200 });

    // Mensagem enviada pelo atendente humano → ativa pausa de 5 minutos
    if (key?.fromMe) {
      const numHumano = remoteJid
        .replace("@s.whatsapp.net", "").replace("@c.us", "")
        .replace("@lid", "").replace(/:\d+$/, "").trim();
      if (numHumano) await ativarPausaHumana(numHumano);
      return new Response("humano-pausado", { status: 200 });
    }

    // Deduplicar pelo ID único da mensagem do WhatsApp
    const wamid = key?.id || "";
    if (wamid) {
      const { data: existe } = await supabase
        .from("mensagens_whatsapp")
        .select("id")
        .eq("wamid", wamid)
        .limit(1)
        .maybeSingle();
      if (existe) return new Response("duplicate", { status: 200 });
    }

    // Extract clean number (strip JID suffix + device index like :0 from @lid format)
    let numero = remoteJid
      .replace("@s.whatsapp.net", "")
      .replace("@c.us", "")
      .replace("@lid", "")
      .replace(/:\d+$/, "")
      .trim();

    // For @lid JIDs, try to resolve real phone number via Evolution API
    const lidRawNumber = remoteJid.includes("@lid") ? numero : "";
    if (remoteJid.includes("@lid")) {
      try {
        const res = await fetch(`${EVOLUTION_URL}/contact/getContacts/${INSTANCE}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": EVOLUTION_KEY },
          body: JSON.stringify({ where: { id: remoteJid } }),
        });
        if (res.ok) {
          const contacts = await res.json();
          const real = contacts?.[0]?.number ||
            contacts?.[0]?.remoteJid?.replace("@s.whatsapp.net", "").replace("@c.us", "");
          if (real && /^\d{10,15}$/.test(real)) {
            // Migrate existing records from @lid number to real phone
            if (lidRawNumber && lidRawNumber !== real) {
              await Promise.all([
                supabase.from("pedidos").update({ numero: real }).eq("numero", lidRawNumber),
                supabase.from("clientes").update({ numero: real }).eq("numero", lidRawNumber),
                supabase.from("mensagens_whatsapp").update({ numero: real }).eq("numero", lidRawNumber),
              ]);
            }
            numero = real;
          }
        }
      } catch (_) { /* keep raw numeric id as fallback */ }
    }

    // For @lid JIDs Evolution API needs the full JID to reply correctly
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

    // Sempre salvar mensagem do cliente
    await Promise.all([
      salvarCliente(numero, nomeCliente, {}),
      supabase.from("mensagens_whatsapp").insert({
        numero, nome: nomeCliente, mensagem, tipo, de_mim: false, dados_raw: body, wamid: wamid || null,
      }),
    ]);

    // ── TRANSFERÊNCIA PARA GEISA: cliente pediu para falar com a dona/Geisa ──
    const msgLower = mensagem.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const pedidoGeisa =
      /\b(geisa|dona|gerente|responsavel|chefe|dono)\b/.test(msgLower) &&
      /\b(falar|chamar|quero|preciso|chama|passa|pode|ver|fala)\b/.test(msgLower);

    if (pedidoGeisa) {
      // Mover pedido ativo para coluna geisa e marcar prioridade alta
      await supabase
        .from("pedidos")
        .update({ status: "geisa", priority: "urgent" })
        .eq("numero", numero)
        .in("status", ["novo-pedido", "em-busca", "peca-encontrada", "aguardando-preco", "venda-concretizada"]);

      // Ativar pausa humana para pausar IA
      await ativarPausaHumana(numero);

      const nomeResp = nomeCliente.split(" ")[0];
      const msgGeisa = `Olá, ${nomeResp}! Vou transferir seu atendimento para a Geisa agora mesmo. Em instantes ela entrará em contato com você!`;

      await Promise.all([
        enviarMensagem(numeroEnvio, msgGeisa),
        supabase.from("mensagens_whatsapp").insert({
          numero, nome: "Marcelo", mensagem: msgGeisa, tipo: "text", de_mim: true, dados_raw: null,
        }),
      ]);

      return new Response("transferido-geisa", { status: 200 });
    }

    // ── PAUSA HUMANA: se atendente humano assumiu, renovar pausa e não responder ──
    if (estaEmPausaHumana(cliente)) {
      await renovarPausaHumana(numero);
      return new Response("em-pausa-humana", { status: 200 });
    }

    // ── FORA DO HORÁRIO: atende normalmente mas finaliza com aviso de horário ──
    const foraHorario = !isHorarioComercial();

    let perfilCliente = "";
    if (cliente) {
      const linhas: string[] = ["\n\nPERFIL DO CLIENTE:"];
      if (cliente.nome) linhas.push("Nome: " + cliente.nome);
      if (cliente.veiculo) {
        linhas.push("Veiculo: " + cliente.veiculo + (cliente.ano ? " " + cliente.ano : "") + (cliente.motor ? " " + cliente.motor : ""));
      }
      perfilCliente = linhas.join("\n");
    }

    const ehPrimeiro = historico === "";

    const now = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const mmdd2 = String(now.getUTCMonth() + 1).padStart(2, "0") + "-" + String(now.getUTCDate()).padStart(2, "0");
    const feriado2 = FERIADOS_BR.includes(mmdd2);
    const domingo2 = now.getUTCDay() === 0;
    const motivoFora = feriado2 ? "hoje e feriado (horario: 8h-13h)" : domingo2 ? "hoje e domingo (fechado)" : "estamos fora do horario comercial (seg-sex 8h-17h, sab 8h-12h30)";

    const avisoForaHorario = foraHorario ? [
      "",
      "SITUACAO ATUAL: FORA DO HORARIO COMERCIAL (" + motivoFora + ").",
      "COMPORTAMENTO FORA DO HORARIO:",
      "Faca o atendimento completo normalmente: pergunte modelo e ano, qual peca, se e mecanica/eletrica peca foto ou numero da peca, pergunte se precisa de mais alguma peca.",
      "Quando o cliente confirmar que nao precisa de mais nada (ou quando voce tiver todas as infos), finalize com:",
      "'Anotei tudo certinho! Seu pedido ja foi pro nosso painel. Vamos verificar a disponibilidade assim que iniciarmos o expediente e te retornamos em breve!'",
      "NAO mencione horario de atendimento a nao ser que o cliente pergunte.",
      "NAO diga que vai verificar 'agora' ou 'em breve hoje'. Diga 'no proximo expediente' ou 'assim que iniciarmos o expediente'.",
    ].join("\n") : "";

    const contexto = SYSTEM_PROMPT
      + avisoForaHorario
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

    // Criar pedido quando a IA identificar a peça (pedido=true OU peca detectada)
    if (peca) {
      const { data: pedidoAtivo } = await supabase
        .from("pedidos")
        .select("id, peca")
        .eq("numero", numero)
        .in("status", ["novo-pedido", "em-busca", "peca-encontrada", "aguardando-preco"])
        .order("criado_em", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pedidoAtivo) {
        // Adicionar peça ao pedido existente se ainda não estiver listada
        if (!pedidoAtivo.peca.toLowerCase().includes(peca.toLowerCase())) {
          const pecasAtualizadas = pedidoAtivo.peca + ", " + peca;
          ops.push(supabase.from("pedidos").update({ peca: pecasAtualizadas }).eq("id", pedidoAtivo.id));
        }
      } else {
        ops.push(supabase.from("pedidos").insert({
          numero,
          nome_cliente: updates.nome || nomeCliente,
          veiculo: veiculo || cliente?.veiculo || null,
          peca,
          status: "novo-pedido",
          mensagem_original: mensagem,
        }));
      }
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
