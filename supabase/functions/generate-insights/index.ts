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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth user
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

    const userId = user.id;

    // Rate limiting: max 5 generations per user per day
    const today = new Date().toISOString().slice(0, 10);
    const { count: insightCount, error: countError } = await userClient
      .from("daily_insights")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("date", today);

    if (!countError && (insightCount ?? 0) >= 5) {
      return new Response(JSON.stringify({ error: "daily_limit", message: "Limite diário de insights atingido. Tente novamente amanhã." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather all context data in parallel
    const [
      profileRes,
      goalsRes,
      tasksRes,
      habitsRes,
      recordsRes,
    ] = await Promise.all([
      userClient.from("profiles").select("*").eq("user_id", userId).single(),
      userClient.from("goals").select("*, goal_actions(*)").eq("user_id", userId),
      userClient.from("tasks").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(100),
      userClient.from("habits").select("*").eq("user_id", userId),
      userClient.from("daily_records").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(60),
    ]);

    const profile = profileRes.data;
    const goals = goalsRes.data || [];
    const tasks = tasksRes.data || [];
    const habits: any[] = habitsRes.data || [];
    const records: any[] = (recordsRes.data || []).map((r: any) => ({
      date: r.date,
      mood: r.mood,
      sleepHours: Number(r.sleep_hours) || 0,
      waterIntake: r.water_intake || 0,
      exerciseMinutes: r.exercise_minutes || 0,
      habitChecks: r.habit_checks || {},
      noteFeeling: r.note_feeling,
    }));

    // Build context
    const today = new Date().toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    const recentRecords = records.filter((r: any) => r.date >= sevenDaysAgo).sort((a: any, b: any) => b.date.localeCompare(a.date));
    const monthRecords = records.filter((r: any) => r.date >= thirtyDaysAgo);
    const todayRecord = records.find((r: any) => r.date === today);

    // Habit stats (30 days)
    const activeHabits = habits.filter((h: any) => h.active);
    const habitStats = activeHabits.map((h: any) => {
      const daysCompleted = monthRecords.filter((r: any) => {
        const val = r.habitChecks?.[h.id];
        if (val === undefined) return false;
        if (h.targetType === "check") return val === true;
        if (typeof val === "number") return h.targetValue ? val >= h.targetValue : val > 0;
        return false;
      }).length;
      const rate = monthRecords.length > 0 ? Math.round((daysCompleted / monthRecords.length) * 100) : 0;
      return {
        name: h.name,
        area: h.lifeArea || "geral",
        rate,
        icon: h.icon,
      };
    });

    const bestHabit = habitStats.reduce((a: any, b: any) => (b.rate > a.rate ? b : a), habitStats[0]);
    const worstHabit = habitStats.reduce((a: any, b: any) => (b.rate < a.rate ? b : a), habitStats[0]);

    // Sleep & mood stats (7 days)
    const sleepDays = recentRecords.filter((r: any) => r.sleepHours > 0);
    const avgSleep = sleepDays.length > 0
      ? (sleepDays.reduce((a: number, r: any) => a + r.sleepHours, 0) / sleepDays.length).toFixed(1)
      : "0";
    
    const moodMap: Record<string, number> = {
      feliz: 5, produtiva: 4, normal: 3, emotiva: 3, ansiosa: 2, cansada: 2, triste: 1,
    };
    const moodDays = recentRecords.filter((r: any) => r.mood && moodMap[r.mood]);
    const moodCounts: Record<string, number> = {};
    moodDays.forEach((r: any) => { moodCounts[r.mood] = (moodCounts[r.mood] || 0) + 1; });
    const predominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "sem dados";

    // Goals stats
    const goalsInProgress = goals.filter((g: any) => g.status === "em_progresso");
    const goalsLate = goals.filter((g: any) => g.status === "atrasado" || (g.deadline && g.deadline < today && g.status !== "concluido"));
    const goalsCompletedRecently = goals.filter((g: any) => g.status === "concluido" && g.completed_at && g.completed_at >= thirtyDaysAgo);
    const goalsNoActions = goals.filter((g: any) => !g.goal_actions || g.goal_actions.length === 0);

    // Task stats (7 days)
    const recentTasks = tasks.filter((t: any) => t.date >= sevenDaysAgo);
    const tasksCreated = recentTasks.length;
    const tasksCompleted = recentTasks.filter((t: any) => t.completed).length;
    const taskCompletionRate = tasksCreated > 0 ? Math.round((tasksCompleted / tasksCreated) * 100) : 0;

    // Today habit adherence
    const todayChecks = todayRecord?.habitChecks || {};
    const todayDone = activeHabits.filter((h: any) => {
      const val = todayChecks[h.id];
      if (val === undefined) return false;
      if (h.targetType === "check") return val === true;
      if (typeof val === "number") return h.targetValue ? val >= h.targetValue : val > 0;
      return false;
    }).length;
    const todayAdherence = activeHabits.length > 0 ? Math.round((todayDone / activeHabits.length) * 100) : 0;

    // Build the tone instruction
    const tone = profile?.insights_tone || "direto";
    const gender = profile?.gender || "neutro";
    const name = profile?.name || "usuário";

    const dataContext = `
SOBRE O USUÁRIO:
- Nome: ${name}
- Gênero: ${gender} — adapte toda a linguagem ao gênero informado. Para gênero neutro: use construções neutras naturais em português, sem palavras terminadas em "e" como "produtive" ou "cansade".
- Tom solicitado: ${tone}
  · Direto: objetivo, baseado em dados, sem rodeios, foco em ação imediata
  · Gentil: empático, encorajador, acolhedor, reconhece o esforço antes de sugerir melhorias

OBJETIVO DO USUÁRIO COM O APP: ${(profile?.main_objective || []).join(", ") || "não informado"}
ÁREAS DE FOCO: ${(profile?.life_areas || []).join(", ") || "não informado"}
OBJETIVOS DE VIDA: ${profile?.life_goals || "não informado"}

DIAGNÓSTICO PESSOAL:
- Desafios: ${(profile?.challenges || []).join(", ") || "não informado"}
- Pontos fortes: ${(profile?.strengths || []).join(", ") || "não informado"}
- Oportunidades: ${(profile?.opportunities || []).join(", ") || "não informado"}

HÁBITOS — ÚLTIMOS 30 DIAS:
${habitStats.length > 0 ? habitStats.map(h => `- ${h.name} (${h.area}): ${h.rate}% de conclusão`).join("\n") : "Nenhum hábito cadastrado"}
${bestHabit ? `- Melhor desempenho: ${bestHabit.name} (${bestHabit.rate}%)` : ""}
${worstHabit ? `- Pior desempenho: ${worstHabit.name} (${worstHabit.rate}%)` : ""}

HOJE:
- Hábitos concluídos: ${todayDone}/${activeHabits.length} (${todayAdherence}%)
${todayRecord ? `- Humor: ${todayRecord.mood || "não registrado"}
- Sono: ${todayRecord.sleepHours > 0 ? todayRecord.sleepHours + "h" : "não registrado"}
- Exercício: ${todayRecord.exerciseMinutes > 0 ? todayRecord.exerciseMinutes + " min" : "não registrado"}` : "- Nenhum registro feito hoje"}

SONO E HUMOR — ÚLTIMOS 7 DIAS:
- Média de sono: ${avgSleep}h
- Humor predominante: ${predominantMood}
- Registros: ${recentRecords.length} dias

METAS:
- Em progresso: ${goalsInProgress.length > 0 ? goalsInProgress.map((g: any) => {
  const actions = g.goal_actions || [];
  const done = actions.filter((a: any) => a.completed).length;
  const pct = actions.length > 0 ? Math.round((done / actions.length) * 100) : 0;
  const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000) : null;
  return `${g.title} (${g.life_area || "sem área"}, ${pct}%${daysLeft !== null ? `, ${daysLeft} dias restantes` : ""})`;
}).join("; ") : "nenhuma"}
- Atrasadas: ${goalsLate.length > 0 ? goalsLate.map((g: any) => g.title).join(", ") : "nenhuma"}
- Concluídas recentemente: ${goalsCompletedRecently.length}
- Sem ações definidas: ${goalsNoActions.filter((g: any) => g.status !== "concluido").length}

TAREFAS — ÚLTIMOS 7 DIAS:
- Criadas: ${tasksCreated} | Concluídas: ${tasksCompleted} | Taxa: ${taskCompletionRate}%
`;

    const systemPrompt = `Você é um coach pessoal especializado em desenvolvimento de hábitos e produtividade, dentro do app Metrics.

${dataContext}

INSTRUÇÕES PARA GERAR OS INSIGHTS:

1. Use os dados reais acima — nunca invente informações ou use dados genéricos
2. Baseie os insights nos princípios do livro "Hábitos Atômicos" de James Clear:
   - Pequenas melhorias de 1% ao dia
   - Foco em sistemas, não apenas em metas
   - Identidade: "Sou uma pessoa que..."
   - Reduzir fricção para hábitos bons
   - Aumentar fricção para hábitos ruins
   - Reforço positivo imediato
3. Seja específico — mencione nomes reais de hábitos, metas e áreas do usuário. Nunca dê conselhos genéricos.
4. Máximo de 3 frases por bloco. Linguagem natural, nunca robótica.
5. Se não houver dados suficientes para algum bloco: gere com base no que existe, sem inventar dados.
6. Responda APENAS com um JSON válido no formato abaixo, sem texto adicional:

{
  "summary": ["frase 1", "frase 2", "frase 3"],
  "orientations": ["orientação 1", "orientação 2", "orientação 3"],
  "patterns": ["padrão 1", "padrão 2"]
}

Onde:
- summary: 2-3 frases sobre o desempenho de hoje e da semana
- orientations: 2-3 sugestões práticas e específicas baseadas nos dados reais
- patterns: 1-2 padrões identificados nos dados (correlações, tendências)`;

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Gere os insights personalizados para hoje com base nos dados acima." },
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
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response
    let parsed: { summary: string[]; orientations: string[]; patterns: string[] };
    try {
      // Strip markdown code fences if present
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      parsed = {
        summary: ["Não foi possível gerar o resumo. Tente novamente."],
        orientations: ["Tente gerar novamente em alguns instantes."],
        patterns: ["Dados insuficientes para identificar padrões."],
      };
    }

    // Save to daily_insights (upsert)
    const { error: upsertError } = await userClient
      .from("daily_insights")
      .upsert(
        {
          user_id: userId,
          date: today,
          summary: parsed.summary,
          orientations: parsed.orientations,
          patterns: parsed.patterns,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,date" }
      );

    if (upsertError) {
      console.error("Error saving insights:", upsertError);
    }

    return new Response(JSON.stringify({
      summary: parsed.summary,
      orientations: parsed.orientations,
      patterns: parsed.patterns,
    }), {
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
