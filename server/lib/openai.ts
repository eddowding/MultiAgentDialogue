import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Persona, Message, AI_MODELS } from "@shared/schema";

// Create clients for each provider
const openaiClient = new OpenAI();
const xaiClient = new OpenAI({ baseURL: "https://api.x.ai/v1", apiKey: process.env.XAI_API_KEY });
const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

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
    const modelInfo = AI_MODELS[currentPersona.modelType as keyof typeof AI_MODELS];

    if (modelInfo.provider === 'google') {
      // Handle Google AI models
      const model = googleAI.getGenerativeModel({ model: currentPersona.modelType });

      const prompt = `${personalizedPrompt}\nConversation history:\n${conversationContext}\n\nRespond as ${currentPersona.name}:`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } else {
      // Handle OpenAI and xAI models using their compatible APIs
      const client = modelInfo.provider === 'xai' ? xaiClient : openaiClient;

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
    }
  } catch (error) {
    console.error("AI API error:", error);
    throw new Error("Failed to generate AI response");
  }
}