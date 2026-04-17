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

    const systemPrompt = `Você é uma coach de desenvolvimento pessoal experiente, com linguagem acolhedora e direta.

Adapte a linguagem ao gênero: ${gender}. Para gênero feminino use linguagem feminina. Para gênero neutro: use construções neutras naturais em português.

Analise a Roda da Vida desta pessoa com notas de 1 a 10 em 13 áreas da vida. Faça uma análise profunda e personalizada com os seguintes elementos:

1. VISÃO GERAL (2-3 frases): Como está o equilíbrio geral da vida desta pessoa? Qual a média e o que ela representa?

2. PONTOS FORTES (2-3 frases): Quais são as 2-3 áreas com notas mais altas? O que isso revela sobre a pessoa? Reconheça o esforço.

3. ÁREAS CRÍTICAS (2-3 frases): Quais são as 2-3 áreas com notas mais baixas? Por que essas áreas merecem atenção urgente? Conecte com o impacto nas outras áreas.

4. DESEQUILÍBRIOS (2-3 frases): Existem contradições? Por exemplo, saúde alta mas autocuidado baixo? Profissional alto mas financeiro baixo? Aponte essas desconexões.

5. CONEXÃO COM OBJETIVOS (2-3 frases): Relacione as notas baixas com as metas e objetivos de vida informados. O que precisa mudar para alcançar esses objetivos?

6. PLANO DE AÇÃO (2-3 sugestões): Dê 2-3 orientações práticas e específicas para melhorar as áreas mais críticas nas próximas semanas.

Use linguagem de coaching calorosa e empática, como se estivesse conversando com a pessoa. Comece direto com uma frase de impacto sobre o que os dados revelam. Algo que gere curiosidade e mostre que a análise tem profundidade, como "Sua Roda da Vida revela um padrão interessante que pode estar travando seu próximo passo..." — adapte ao contexto real dos dados. Nunca comece com saudações genéricas. Escreva em parágrafos corridos e naturais, sem markdown, sem listas numeradas, sem bullets, sem asteriscos, sem negrito. Apenas texto fluido e natural. Mínimo de 250 palavras.`;

    const userPrompt = `NOTAS DA RODA DA VIDA:
${scoresText}

Média geral: ${assessment.average_score}

OBJETIVO DE VIDA: ${profile?.life_goals || "não informado"}

METAS ATIVAS:
${goalsText}`;

    const aiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GOOGLE_API_KEY },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: systemPrompt + "\n\n" + userPrompt }],
            },
          ],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 } },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limited" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "payment_required" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "Não foi possível gerar a análise.";

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
