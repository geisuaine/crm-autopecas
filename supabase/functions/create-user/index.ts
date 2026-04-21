import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("OK", { status: 200, headers: CORS });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: CORS });

  try {
    const { email, senha, nome, cargo, telefone, permissoes } = await req.json();

    if (!email || !senha || !nome) {
      return new Response(
        JSON.stringify({ error: "email, senha e nome são obrigatórios" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Create auth user (no email confirmation required)
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // Insert profile into usuarios table
    const { error: profileError } = await admin.from("usuarios").insert({
      id: authData.user.id,
      nome,
      email,
      telefone: telefone || null,
      cargo: cargo || "funcionario",
    });

    if (profileError) {
      console.error("Profile insert error:", profileError);
    }

    // Insert permissions
    if (permissoes && Array.isArray(permissoes) && permissoes.length > 0) {
      const rows = permissoes.map((modulo: string) => ({
        usuario_id: authData.user.id,
        modulo,
        pode_ver: true,
        pode_editar: true,
      }));
      const { error: permError } = await admin.from("permissoes").insert(rows);
      if (permError) console.error("Permissions insert error:", permError);
    }

    return new Response(
      JSON.stringify({ ok: true, id: authData.user.id }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ERRO create-user:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
