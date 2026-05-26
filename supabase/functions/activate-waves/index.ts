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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const today = new Date().toISOString().slice(0, 10);
  const in14 = new Date();
  in14.setUTCDate(in14.getUTCDate() + 14);
  const in14str = in14.toISOString().slice(0, 10);

  // 1. Activate waves whose release date has arrived
  const { data: toActivate, error: e1 } = await supabase
    .from("waves")
    .select("wave")
    .lte("release_date", today)
    .in("status", ["inativo", "pre_lancamento", "futuro"]);

  let activated = 0;
  if (!e1 && toActivate?.length) {
    const { error } = await supabase
      .from("waves")
      .update({ status: "ativo" })
      .in(
        "wave",
        toActivate.map((w: any) => w.wave),
      );
    if (!error) activated = toActivate.length;
  }

  // 2. Mark as pre_lancamento waves within 14 days of release
  const { data: toPre, error: e2 } = await supabase
    .from("waves")
    .select("wave")
    .gt("release_date", today)
    .lte("release_date", in14str)
    .in("status", ["inativo", "futuro"]);

  let preLaunched = 0;
  if (!e2 && toPre?.length) {
    const { error } = await supabase
      .from("waves")
      .update({ status: "pre_lancamento" })
      .in(
        "wave",
        toPre.map((w: any) => w.wave),
      );
    if (!error) preLaunched = toPre.length;
  }

  return new Response(
    JSON.stringify({ date: today, activated, pre_launched: preLaunched }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});