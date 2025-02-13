import OpenAI from "openai";
import { Persona, Message, AI_MODELS } from "@shared/schema";

// Create OpenAI client for each provider
const openaiClient = new OpenAI();
const xaiClient = new OpenAI({ baseURL: "https://api.x.ai/v1", apiKey: process.env.XAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
export async function generateResponse(
  currentPersona: Persona,
  conversationHistory: Message[],
  otherPersonas: Persona[],
  systemPrompt: string
): Promise<string> {
  const personalizedPrompt = `You are ${currentPersona.name}. 
Background: ${currentPersona.background}
Your goal: ${currentPersona.goal}

You are in a conversation with:
${otherPersonas.map((p) => `- ${p.name}: ${p.background}`).join("\n")}

${systemPrompt}

Maintain your character's perspective and work towards your goal while engaging constructively with others.
Keep responses concise (2-3 sentences).
`;

  const conversationContext = conversationHistory
    .map((m) => `[${m.personaId}]: ${m.content}`)
    .join("\n");

  try {
    // Select the appropriate client based on the model provider
    const client = AI_MODELS[currentPersona.modelType as keyof typeof AI_MODELS].provider === 'xai' 
      ? xaiClient 
      : openaiClient;

    const response = await client.chat.completions.create({
      model: currentPersona.modelType,
      messages: [
        { role: "system", content: personalizedPrompt },
        { role: "user", content: `Conversation history:\n${conversationContext}\n\nRespond as ${currentPersona.name}:` }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "No response generated";
  } catch (error) {
    console.error("AI API error:", error);
    throw new Error("Failed to generate AI response");
  }
}