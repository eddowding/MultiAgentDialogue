import { Persona, InsertPersona, Message, InsertMessage, Conversation, InsertConversation } from "@shared/schema";

export interface IStorage {
  // Persona operations
  getPersona(id: number): Promise<Persona | undefined>;
  listPersonas(): Promise<Persona[]>;
  createPersona(persona: InsertPersona): Promise<Persona>;
  deletePersona(id: number): Promise<void>;

  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;

  // Conversation operations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: number): Promise<Conversation | undefined>;
  updateConversationStatus(id: number, status: string): Promise<void>;
  updateCurrentSpeaker(id: number, speakerId: number): Promise<void>;
  incrementTurn(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private personas: Map<number, Persona>;
  private messages: Map<number, Message>;
  private conversations: Map<number, Conversation>;
  private currentId: { [key: string]: number };

  constructor() {
    this.personas = new Map();
    this.messages = new Map();
    this.conversations = new Map();
    this.currentId = {
      persona: 1,
      message: 1,
      conversation: 1,
    };
  }

  async getPersona(id: number): Promise<Persona | undefined> {
    return this.personas.get(id);
  }

  async listPersonas(): Promise<Persona[]> {
    return Array.from(this.personas.values());
  }

  async createPersona(persona: InsertPersona): Promise<Persona> {
    const id = this.currentId.persona++;
    const newPersona: Persona = {
      ...persona,
      id,
      modelType: persona.modelType || "gpt-4o",
    };
    this.personas.set(id, newPersona);
    return newPersona;
  }

  async deletePersona(id: number): Promise<void> {
    this.personas.delete(id);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.currentId.message++;
    const newMessage: Message = {
      ...message,
      id,
      timestamp: new Date(),
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (m) => m.conversationId === conversationId
    );
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const id = this.currentId.conversation++;
    const newConversation: Conversation = {
      ...conversation,
      id,
      status: "active",
      currentTurn: 0,
      maxTurns: conversation.maxTurns || 10,
      currentSpeakerId: conversation.currentSpeakerId || null,
    };
    this.conversations.set(id, newConversation);
    return newConversation;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async updateConversationStatus(id: number, status: string): Promise<void> {
    const conversation = this.conversations.get(id);
    if (conversation) {
      this.conversations.set(id, { ...conversation, status });
    }
  }

  async updateCurrentSpeaker(id: number, speakerId: number): Promise<void> {
    const conversation = this.conversations.get(id);
    if (conversation) {
      this.conversations.set(id, { ...conversation, currentSpeakerId: speakerId });
    }
  }

  async incrementTurn(id: number): Promise<void> {
    const conversation = this.conversations.get(id);
    if (conversation) {
      this.conversations.set(id, {
        ...conversation,
        currentTurn: conversation.currentTurn + 1,
      });
    }
  }
}

export const storage = new MemStorage();