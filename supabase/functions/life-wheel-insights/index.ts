import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) {
      return new Response(JSON.stringify({ error: "GOOGLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { assessmentId } = await req.json();
    if (!assessmentId) {
      return new Response(JSON.stringify({ error: "assessmentId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch assessment, profile, and active goals in parallel
    const [assessmentRes, profileRes, goalsRes] = await Promise.all([
      userClient.from("life_wheel_assessments").select("*").eq("id", assessmentId).single(),
      userClient.from("profiles").select("*").eq("user_id", user.id).single(),
      userClient.from("goals").select("title, life_area, status").eq("user_id", user.id).neq("status", "concluido"),
    ]);

    if (assessmentRes.error || !assessmentRes.data) {
      return new Response(JSON.stringify({ error: "Assessment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const assessment = assessmentRes.data;
    const profile = profileRes.data;
    const goals = goalsRes.data || [];
    const scores = assessment.scores as Record<string, number>;

    const LABELS: Record<string, string> = {
      criatividade_hobbies_diversao: "Criatividade, Hobbies e Diversão",
      plenitude_felicidade: "Plenitude e Felicidade",
      espiritualidade: "Espiritualidade",
      saude_disposicao: "Saúde e Disposição",
      desenvolvimento_intelectual: "Desenvolvimento Intelectual",
      equilibrio_emocional: "Equilíbrio Emocional",
      autocuidado: "Autocuidado",
      realizacao_proposito: "Realização e Propósito",
      recursos_financeiros: "Recursos Financeiros",
      contribuicao_social: "Contribuição Social",
      familia: "Família",
      relacionamento_amoroso: "Relacionamento Amoroso",
      vida_social: "Vida Social",
    };

    const scoresText = Object.entries(scores)
      .map(([k, v]) => `- ${LABELS[k] || k}: ${v}/10`)
      .join("\n");

    const goalsText = goals.length > 0
      ? goals.map((g: any) => `- ${g.title} (${g.life_area || "sem área"}, status: ${g.status})`).join("\n")
      : "Nenhuma meta ativa";

    const gender = profile?.gender || "neutro";

    const systemPrompt = `Você é um coach pessoal especializado em desenvolvimento humano integral.
Adapte a linguagem ao gênero: ${gender}. Para gênero neutro: use construções neutras naturais em português.

Analise a Roda da Vida desta pessoa com notas entre 1 e 10 em 13 áreas. Identifique:
1. As 2-3 áreas mais críticas (notas mais baixas)
2. As 2-3 áreas mais fortes (notas mais altas)
3. Desequilíbrios entre áreas relacionadas
4. Conexão entre as notas baixas e as metas e objetivos de vida informados
5. 2-3 sugestões práticas e específicas para melhorar o equilíbrio

Use linguagem de coaching, seja direto e específico. Máximo 200 palavras no total.
Responda em texto corrido, sem markdown, sem listas numeradas, sem bullets. Apenas parágrafos naturais.`;

    const userPrompt = `NOTAS DA RODA DA VIDA:
${scoresText}

Média geral: ${assessment.average_score}

OBJETIVO DE VIDA: ${profile?.life_goals || "não informado"}

METAS ATIVAS:
${goalsText}`;

    const aiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GOOGLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "payment_required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "Não foi possível gerar a análise.";

    return new Response(JSON.stringify({ analysis: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
