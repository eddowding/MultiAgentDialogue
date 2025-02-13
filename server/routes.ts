import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateResponse } from "./lib/openai";
import { insertPersonaSchema, insertConversationSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  // Persona routes
  app.get("/api/personas", async (req, res) => {
    const personas = await storage.listPersonas();
    res.json(personas);
  });

  app.post("/api/personas", async (req, res) => {
    const result = insertPersonaSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid persona data" });
    }
    const persona = await storage.createPersona(result.data);
    res.json(persona);
  });

  app.patch("/api/personas/:id", async (req, res) => {
    const result = insertPersonaSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid persona data" });
    }
    const id = parseInt(req.params.id);
    const persona = await storage.updatePersona(id, result.data);
    if (!persona) {
      return res.status(404).json({ error: "Persona not found" });
    }
    res.json(persona);
  });

  // Conversation routes with improved turn handling
  app.get("/api/conversations/current", async (req, res) => {
    try {
      const personas = await storage.listPersonas();
      const conversations = await storage.listConversations();

      // If there are no conversations yet, just return the personas
      if (!conversations || conversations.length === 0) {
        return res.json({ conversation: null, messages: [], personas });
      }

      // Find the most recent active conversation
      const activeConversation = conversations
        .filter(c => c.status === "active")
        .sort((a, b) => b.id - a.id)[0];

      if (!activeConversation) {
        return res.json({ conversation: null, messages: [], personas });
      }

      const messages = await storage.getMessagesByConversation(activeConversation.id);

      res.json({
        conversation: activeConversation,
        messages,
        personas,
      });
    } catch (error) {
      console.error("Error fetching current conversation:", error);
      res.status(500).json({ error: "Failed to fetch current conversation" });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    const result = insertConversationSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid conversation data" });
    }
    const conversation = await storage.createConversation(result.data);
    res.json(conversation);
  });

  app.post("/api/conversations/:id/next", async (req, res) => {
    const conversationId = parseInt(req.params.id);
    const conversation = await storage.getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    if (conversation.status !== "active") {
      return res.status(400).json({ error: "Conversation is not active" });
    }

    // Get current speaker
    const currentPersona = await storage.getPersona(conversation.currentSpeakerId!);
    if (!currentPersona) {
      return res.status(404).json({ error: "Current speaker not found" });
    }

    const messages = await storage.getMessagesByConversation(conversationId);
    const personas = await storage.listPersonas();
    const otherPersonas = personas.filter(p => p.id !== currentPersona.id);

    try {
      const content = await generateResponse(
        currentPersona,
        messages,
        otherPersonas,
        conversation.systemPrompt
      );

      const message = await storage.createMessage({
        conversationId,
        personaId: currentPersona.id,
        content,
      });

      await storage.incrementTurn(conversationId);

      // Select next speaker (round-robin between participants)
      const nextPersonaId = otherPersonas[0].id;
      await storage.updateCurrentSpeaker(conversationId, nextPersonaId);

      // Check if conversation should end
      if (conversation.currentTurn + 1 >= conversation.maxTurns) {
        await storage.updateConversationStatus(conversationId, "completed");
      }

      res.json(message);
    } catch (error) {
      console.error("Error generating response:", error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  app.get("/api/conversations/:id", async (req, res) => {
    const conversation = await storage.getConversation(parseInt(req.params.id));
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    const messages = await storage.getMessagesByConversation(conversation.id);
    res.json({ conversation, messages });
  });

  app.delete("/api/personas", async (req, res) => {
    await storage.clearPersonas();
    res.json({ success: true });
  });

  app.delete("/api/conversations", async (req, res) => {
    await storage.clearConversations();
    res.json({ success: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}