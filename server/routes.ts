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

  // Conversation routes
  app.get("/api/conversations/current", async (req, res) => {
    // Get all conversations and find the most recent active one
    const conversations = await Promise.all(
      Array.from({ length: 10 }, (_, i) => storage.getConversation(i + 1))
    );

    const activeConversation = conversations
      .filter((c): c is NonNullable<typeof c> => c !== undefined)
      .find(c => c.status === "active");

    if (!activeConversation) {
      return res.json({ conversation: null, messages: [], personas: [] });
    }

    const messages = await storage.getMessagesByConversation(activeConversation.id);
    const personas = await storage.listPersonas();

    res.json({
      conversation: activeConversation,
      messages,
      personas,
    });
  });

  app.post("/api/conversations", async (req, res) => {
    const result = insertConversationSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid conversation data" });
    }
    const conversation = await storage.createConversation(result.data);
    res.json(conversation);
  });

  app.get("/api/conversations/:id", async (req, res) => {
    const conversation = await storage.getConversation(parseInt(req.params.id));
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    const messages = await storage.getMessagesByConversation(conversation.id);
    res.json({ conversation, messages });
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

    const messages = await storage.getMessagesByConversation(conversationId);
    const currentPersona = await storage.getPersona(conversation.currentSpeakerId!);
    if (!currentPersona) {
      return res.status(404).json({ error: "Current speaker not found" });
    }

    const personas = await storage.listPersonas();
    const otherPersonas = personas.filter(p => p.id !== currentPersona.id);

    try {
      const content = await generateResponse(currentPersona, messages, otherPersonas);
      const message = await storage.createMessage({
        conversationId,
        personaId: currentPersona.id,
        content,
      });

      await storage.incrementTurn(conversationId);

      if (conversation.currentTurn + 1 >= conversation.maxTurns) {
        await storage.updateConversationStatus(conversationId, "completed");
      } else {
        // Select next speaker (simple round-robin)
        const nextPersonaId = otherPersonas[0].id;
        await storage.updateCurrentSpeaker(conversationId, nextPersonaId);
      }

      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}