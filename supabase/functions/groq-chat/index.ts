import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Verify the user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    // Fetch the user's Groq API key from user_settings
    // Use service role client to bypass RLS for reading user_settings
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: settings, error: settingsError } = await adminClient
      .from("user_settings")
      .select("groq_api_key")
      .eq("user_id", userId)
      .maybeSingle();

    if (settingsError) {
      return new Response(JSON.stringify({ error: "Failed to fetch settings" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!settings?.groq_api_key) {
      return new Response(JSON.stringify({ error: "No Groq API key configured. Please add your Groq API key in Settings." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the request body
    const body = await req.json();
    const { messages, model } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the system prompt for a study assistant
    const systemPrompt = {
      role: "system",
      content: "You are StudyFlow AI, a helpful study assistant for college students. You help with explaining concepts, answering questions about subjects, creating study plans, and providing academic guidance. Be concise, clear, and educational. Use formatting like bullet points and bold text when helpful. If asked about creating flashcards or study materials, provide structured content that can be easily converted to flashcards.",
    };

    // Call the Groq API
    const groqResponse = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${settings.groq_api_key}`,
      },
      body: JSON.stringify({
        model: model || DEFAULT_MODEL,
        messages: [systemPrompt, ...messages],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.text();
      let errorMsg = "Groq API request failed";
      try {
        const parsed = JSON.parse(errorData);
        errorMsg = parsed.error?.message || errorMsg;
      } catch {
        // use default error message
      }
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: groqResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const groqData = await groqResponse.json();
    const reply = groqData.choices?.[0]?.message?.content || "No response generated.";

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
