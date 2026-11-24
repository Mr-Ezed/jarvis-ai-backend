import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json({ limit: "32kb" }));

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("Missing OPENAI_API_KEY environment variable.");
  process.exit(1);
}

const openai = new OpenAI({ apiKey });
const PORT = process.env.PORT || 3000;
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

app.get("/health", (_req, res) => res.json({ ok: true, service: "JARVIS AI backend" }));

app.post("/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) return res.status(400).json({ error: "message is required" });
    if (message.length > 8000) return res.status(413).json({ error: "message too long" });

    const history = Array.isArray(req.body?.history) ? req.body.history.slice(-12) : [];
    const safeHistory = history
      .filter(x => x && ["user", "assistant"].includes(x.role) && typeof x.content === "string")
      .map(x => ({ role: x.role, content: x.content.slice(0, 4000) }));

    const response = await openai.responses.create({
      model: MODEL,
      instructions: "You are JARVIS, a capable, calm, concise personal AI assistant inspired by a futuristic cinematic assistant. Be helpful and honest. Do not claim to control the user's phone unless the app explicitly performs that action. Never request passwords or secret API keys.",
      input: [
        ...safeHistory,
        { role: "user", content: message }
      ]
    });

    res.json({ reply: response.output_text || "I couldn't generate a response just now." });
  } catch (error) {
    console.error("OpenAI request failed:", error?.message || error);
    res.status(500).json({ error: "AI request failed. Check server logs and API billing/configuration." });
  }
});

app.listen(PORT, () => console.log(`JARVIS backend listening on ${PORT}`));
