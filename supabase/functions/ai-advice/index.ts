import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MenuItem {
  name: string;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  category: string;
}

interface UserProfile {
  goal: string;
  target_calories: number;
  target_protein: number;
  weight_kg?: number;
  activity_level?: string;
}

interface AdviceRequest {
  selectedItems: MenuItem[];
  profile: UserProfile;
}

const goalLabels: Record<string, string> = {
  lose_weight: "減量・ダイエット",
  gain_muscle: "筋肥大・筋トレ",
  maintain: "健康維持",
  focus: "集中力向上",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    const { selectedItems, profile }: AdviceRequest = await req.json();

    const totalCalories = selectedItems.reduce((s, i) => s + i.calories, 0);
    const totalProtein = selectedItems.reduce((s, i) => s + i.protein_g, 0);
    const totalFat = selectedItems.reduce((s, i) => s + i.fat_g, 0);
    const totalCarbs = selectedItems.reduce((s, i) => s + i.carbs_g, 0);

    const goalLabel = goalLabels[profile.goal] ?? profile.goal;

    // If no OpenAI key, return a rule-based advice
    if (!openaiKey) {
      const calorieRatio = totalCalories / (profile.target_calories / 3);
      const proteinRatio = totalProtein / (profile.target_protein / 3);

      let score = 70;
      let advice = "";
      const suggestions: string[] = [];

      if (profile.goal === "lose_weight") {
        if (calorieRatio > 1.2) {
          score -= 20;
          advice = "このメニューはカロリーがやや高めです。";
          suggestions.push("ご飯を小盛りに変更する");
          suggestions.push("揚げ物を焼き物に代替する");
        } else if (calorieRatio < 0.7) {
          score += 10;
          advice = "カロリーが適切に抑えられています。";
        } else {
          score += 5;
          advice = "バランスの良い選択です。";
        }
        if (proteinRatio < 0.8) {
          suggestions.push("冷奴やサラダチキンをプラスしてタンパク質を補給");
        }
      } else if (profile.goal === "gain_muscle") {
        if (proteinRatio < 1.0) {
          score -= 15;
          advice = "タンパク質がやや不足しています。";
          suggestions.push("サラダチキンを追加する");
          suggestions.push("プロテインスムージーを追加する");
          suggestions.push("冷奴や卵料理をプラスする");
        } else {
          score += 10;
          advice = "筋トレに適したタンパク質量が確保できています。";
        }
        if (totalCarbs < 60) {
          suggestions.push("ご飯またはパンを追加してエネルギーを補給");
        }
      } else if (profile.goal === "focus") {
        advice = "集中力向上のため、糖分の急激な上昇を避けましょう。";
        if (totalCarbs > 100) {
          suggestions.push("精製糖質を減らし、全粒穀物を選ぶ");
        }
        suggestions.push("緑茶やコーヒーで集中力をサポート");
        suggestions.push("ナッツ類で良質な脂質を補給");
        score = 75;
      } else {
        advice = "バランスの取れた食事選択です。";
        if (totalCalories < 400) suggestions.push("副菜を追加してビタミン・ミネラルを補給");
        score = 80;
      }

      const clampedScore = Math.max(20, Math.min(100, score));

      return new Response(
        JSON.stringify({
          score: clampedScore,
          summary: advice,
          goal_match: goalLabel,
          suggestions,
          nutrients: { totalCalories, totalProtein, totalFat, totalCarbs },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const itemsText = selectedItems
      .map((i) => `・${i.name}（${i.calories}kcal, タンパク質${i.protein_g}g, 脂質${i.fat_g}g, 炭水化物${i.carbs_g}g）`)
      .join("\n");

    const prompt = `あなたは大学食堂専門の栄養士AIです。
ユーザーの目標は「${goalLabel}」で、1食の目標カロリーは${Math.round(profile.target_calories / 3)}kcal、タンパク質は${Math.round(profile.target_protein / 3)}gです。

選択メニュー:
${itemsText}

合計: ${totalCalories}kcal / タンパク質${totalProtein.toFixed(1)}g / 脂質${totalFat.toFixed(1)}g / 炭水化物${totalCarbs.toFixed(1)}g

以下のJSON形式のみで返答してください（他のテキスト不要）:
{
  "score": <0-100の整数。目標との適合度>,
  "summary": "<2-3文の日本語アドバイス>",
  "suggestions": ["<プラス一品や代替案1>", "<提案2>", "<提案3（任意）>"]
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const rawContent = aiData.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(rawContent);

    return new Response(
      JSON.stringify({
        ...parsed,
        goal_match: goalLabel,
        nutrients: { totalCalories, totalProtein, totalFat, totalCarbs },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
