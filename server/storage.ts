import { personas, messages, conversations } from "@shared/schema";
import { type Persona, type InsertPersona, type Message, type InsertMessage, type Conversation, type InsertConversation } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Persona operations
  getPersona(id: number): Promise<Persona | undefined>;
  listPersonas(): Promise<Persona[]>;
  createPersona(persona: InsertPersona): Promise<Persona>;
  updatePersona(id: number, persona: InsertPersona): Promise<Persona | undefined>;
  deletePersona(id: number): Promise<void>;
  clearPersonas(): Promise<void>;

  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;

  // Conversation operations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: number): Promise<Conversation | undefined>;
  listConversations(): Promise<Conversation[]>;
  updateConversationStatus(id: number, status: string): Promise<void>;
  updateCurrentSpeaker(id: number, speakerId: number): Promise<void>;
  incrementTurn(id: number): Promise<void>;
  clearConversations(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getPersona(id: number): Promise<Persona | undefined> {
    const [persona] = await db.select().from(personas).where(eq(personas.id, id));
    return persona;
  }

  async listPersonas(): Promise<Persona[]> {
    return await db.select().from(personas);
  }

  async createPersona(persona: InsertPersona): Promise<Persona> {
    const [newPersona] = await db.insert(personas).values(persona).returning();
    return newPersona;
  }

  async updatePersona(id: number, persona: InsertPersona): Promise<Persona | undefined> {
    const [updatedPersona] = await db
      .update(personas)
      .set(persona)
      .where(eq(personas.id, id))
      .returning();
    return updatedPersona;
  }

  async deletePersona(id: number): Promise<void> {
    await db.delete(personas).where(eq(personas.id, id));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.conversationId, conversationId));
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db.insert(conversations).values({
      ...conversation,
      status: "active",
      currentTurn: 0,
    }).returning();
    return newConversation;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async listConversations(): Promise<Conversation[]> {
    return await db.select().from(conversations);
  }

  async updateConversationStatus(id: number, status: string): Promise<void> {
    await db.update(conversations)
      .set({ status })
      .where(eq(conversations.id, id));
  }

  async updateCurrentSpeaker(id: number, speakerId: number): Promise<void> {
    await db.update(conversations)
      .set({ currentSpeakerId: speakerId })
      .where(eq(conversations.id, id));
  }

  async incrementTurn(id: number): Promise<void> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    if (conversation) {
      await db.update(conversations)
        .set({ currentTurn: conversation.currentTurn + 1 })
        .where(eq(conversations.id, id));
    }
  }

  async clearPersonas(): Promise<void> {
    await db.delete(personas);
  }

  async clearConversations(): Promise<void> {
    await db.delete(messages);
    await db.delete(conversations);
  }
}

export const storage = new DatabaseStorage();