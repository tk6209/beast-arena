import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing auth" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Validate caller is admin
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData, error: uErr } = await userClient.auth.getUser();
  if (uErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "Invalid user" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: isAdminRow } = await serviceClient.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });
  if (!isAdminRow) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let sorteioId: string | undefined;
  try {
    const body = await req.json();
    sorteioId = body.sorteio_id;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!sorteioId || typeof sorteioId !== "string") {
    return new Response(JSON.stringify({ error: "sorteio_id required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: sorteio, error: sErr } = await serviceClient
    .from("sorteios")
    .select("id, max_ganhadores, item_id, item_tipo, status")
    .eq("id", sorteioId)
    .maybeSingle();
  if (sErr || !sorteio) {
    return new Response(JSON.stringify({ error: "Sorteio not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (sorteio.status === "sorteado") {
    return new Response(JSON.stringify({ error: "Já sorteado" }), {
      status: 409,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: participantes } = await serviceClient
    .from("sorteio_participacoes")
    .select("user_id")
    .eq("sorteio_id", sorteioId);

  if (!participantes?.length) {
    return new Response(JSON.stringify({ error: "Sem participantes" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const shuffled = [...participantes].sort(() => Math.random() - 0.5);
  const ganhadores = shuffled
    .slice(0, sorteio.max_ganhadores)
    .map((p: any) => p.user_id as string);

  await serviceClient
    .from("sorteios")
    .update({
      status: "sorteado",
      ganhadores,
      sorteado_em: new Date().toISOString(),
    })
    .eq("id", sorteioId);

  if (ganhadores.length) {
    await serviceClient.from("early_access_items").upsert(
      ganhadores.map((uid) => ({
        user_id: uid,
        item_id: sorteio.item_id,
        item_tipo: sorteio.item_tipo,
        expira_em: null,
      })),
      { onConflict: "user_id,item_id" },
    );
  }

  return new Response(
    JSON.stringify({ ok: true, ganhadores, total: ganhadores.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});