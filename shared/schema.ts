import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const personas = pgTable("personas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  background: text("background").notNull(),
  goal: text("goal").notNull(),
  modelType: text("model_type").notNull().default("gpt-4o"),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  personaId: integer("persona_id").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  status: text("status").notNull().default("active"),
  currentSpeakerId: integer("current_speaker_id"),
  maxTurns: integer("max_turns").notNull().default(10),
  currentTurn: integer("current_turn").notNull().default(0),
  systemPrompt: text("system_prompt").notNull().default(
    "You are participating in a structured negotiation aimed at reaching a point of reconciliation. " +
    "This does not necessarily mean agreement; rather, the goal is to explore viable paths forward. " +
    "Prioritise addressing the most crucial issues first, identifying any points of alignment, and clarifying key differences. " +
    "After establishing the core concerns, explore possible alternative solutions. " +
    "If reconciliation is impossible, provide clear, practical next-step recommendations that allow both parties to move forward productively."
  ),
});

export const insertPersonaSchema = createInsertSchema(personas).pick({
  name: true,
  background: true,
  goal: true,
  modelType: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  personaId: true,
  content: true,
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  maxTurns: true,
  currentSpeakerId: true,
  systemPrompt: true,
}).extend({
  systemPrompt: z.string().optional(),
});

export type Persona = typeof personas.$inferSelect;
export type InsertPersona = z.infer<typeof insertPersonaSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;