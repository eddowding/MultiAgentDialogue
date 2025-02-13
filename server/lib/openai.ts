import OpenAI from "openai";
import { Persona, Message } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI();

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
    const response = await openai.chat.completions.create({
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
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate AI response");
  }
}