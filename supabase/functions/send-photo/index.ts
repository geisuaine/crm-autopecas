import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const EVOLUTION_URL = "http://75.119.131.233:8080";
const EVOLUTION_KEY = "crm-autopecas-2025";
const INSTANCE = "geisa";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("OK", { status: 200 });
  if (req.method !== "POST") return new Response("OK", { status: 200 });

  try {
    const { numero, imageDataUrl, caption } = await req.json();

    if (!numero || !imageDataUrl) {
      return new Response("numero e imageDataUrl obrigatorios", { status: 400 });
    }

    // Strip the data:image/...;base64, prefix
    const base64 = imageDataUrl.includes(",") ? imageDataUrl.split(",")[1] : imageDataUrl;

    const res = await fetch(`${EVOLUTION_URL}/message/sendMedia/${INSTANCE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": EVOLUTION_KEY },
      body: JSON.stringify({
        number: numero,
        mediatype: "image",
        media: base64,
        caption: caption || "",
      }),
    });

    const body = await res.text();
    return new Response(body, { status: res.status });
  } catch (err) {
    console.error("ERRO send-photo:", err);
    return new Response("error", { status: 500 });
  }
});
