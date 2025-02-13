import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { Persona } from "@shared/schema";
import { Trash2 } from "lucide-react";

interface ConversationControlsProps {
  personas: Persona[];
}

interface CurrentConversation {
  id: number;
  status: string;
  currentSpeakerId: number | null;
  maxTurns: number;
  currentTurn: number;
  systemPrompt: string;
}

const DEFAULT_SYSTEM_PROMPT = "You are participating in a structured negotiation aimed at reaching a point of reconciliation. " +
  "This does not necessarily mean agreement; rather, the goal is to explore viable paths forward. " +
  "Prioritise addressing the most crucial issues first, identifying any points of alignment, and clarifying key differences. " +
  "After establishing the core concerns, explore possible alternative solutions. " +
  "If reconciliation is impossible, provide clear, practical next-step recommendations that allow both parties to move forward productively.";

export function ConversationControls({ personas }: ConversationControlsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [firstSpeakerId, setFirstSpeakerId] = useState<string>("");
  const [maxTurns, setMaxTurns] = useState("10");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [isRunningMultipleTurns, setIsRunningMultipleTurns] = useState(false);

  const startMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/conversations", {
        currentSpeakerId: parseInt(firstSpeakerId),
        maxTurns: parseInt(maxTurns),
        systemPrompt,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations/current"] });
      toast({
        title: "Success",
        description: "Conversation started successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Starting Conversation",
        description: error.message || "Failed to start conversation",
        variant: "destructive",
      });
    },
  });

  const nextTurnMutation = useMutation({
    mutationFn: async () => {
      const conversation = await queryClient.getQueryData<{ conversation: CurrentConversation }>(["/api/conversations/current"]);
      if (conversation?.conversation?.id) {
        await apiRequest("POST", `/api/conversations/${conversation.conversation.id}/next`, {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations/current"] });
    },
    onError: (error: any) => {
      let description = "Failed to generate next response";

      // Extract specific error message from the API response
      if (error.message?.includes("Invalid turn order")) {
        description = "Waiting for the other participant to respond first";
      } else if (error.message?.includes("Conversation is not active")) {
        description = "This conversation has ended";
      }

      toast({
        title: "Turn Error",
        description,
        variant: "destructive",
      });
    },
  });

  const runMultipleTurns = async (numberOfTurns: number) => {
    setIsRunningMultipleTurns(true);
    try {
      for (let i = 0; i < numberOfTurns; i++) {
        const currentData = await queryClient.getQueryData<{ conversation: CurrentConversation }>(["/api/conversations/current"]);
        const conversation = currentData?.conversation;

        if (!conversation || conversation.status !== "active") {
          if (conversation?.status === "completed") {
            toast({
              title: "Conversation Complete",
              description: "All turns have been completed",
            });
          }
          break;
        }

        try {
          await nextTurnMutation.mutateAsync();
        } catch (error: any) {
          console.error("Error during turn:", error);
          toast({
            title: "Turn Error",
            description: error.message || `Failed at turn ${conversation.currentTurn + 1}`,
            variant: "destructive",
          });
          break;
        }

        // Check if the conversation is still active
        const updatedData = await queryClient.getQueryData<{ conversation: CurrentConversation }>(["/api/conversations/current"]);
        if (updatedData?.conversation?.status !== "active") {
          break;
        }
      }
    } finally {
      setIsRunningMultipleTurns(false);
    }
  };

  const clearChatMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/conversations", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations/current"] });
      toast({
        title: "Success",
        description: "Chat history cleared",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear chat history",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Conversation Controls</h3>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => clearChatMutation.mutate()}
          disabled={clearChatMutation.isPending}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Clear Chat
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">First Speaker</label>
        <Select onValueChange={setFirstSpeakerId} value={firstSpeakerId}>
          <SelectTrigger>
            <SelectValue placeholder="Select first speaker" />
          </SelectTrigger>
          <SelectContent>
            {personas.map((persona) => (
              <SelectItem key={persona.id} value={persona.id.toString()}>
                {persona.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Max Turns</label>
        <Input
          type="number"
          value={maxTurns}
          onChange={(e) => setMaxTurns(e.target.value)}
          min="1"
          max="50"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">System Prompt</label>
        <Textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          className="min-h-[100px]"
          placeholder="Enter system prompt..."
        />
      </div>

      <div className="space-y-2">
        <Button
          className="w-full"
          onClick={() => startMutation.mutate()}
          disabled={!firstSpeakerId || startMutation.isPending}
        >
          {startMutation.isPending ? "Starting..." : "Start Conversation"}
        </Button>

        <Button
          className="w-full"
          onClick={() => nextTurnMutation.mutate()}
          disabled={nextTurnMutation.isPending || isRunningMultipleTurns}
          variant="secondary"
        >
          {nextTurnMutation.isPending ? "Generating..." : "Next Turn"}
        </Button>

        <Button
          className="w-full"
          onClick={() => runMultipleTurns(10)}
          disabled={nextTurnMutation.isPending || isRunningMultipleTurns}
          variant="outline"
        >
          {isRunningMultipleTurns ? "Running 10 Turns..." : "Run 10 Turns"}
        </Button>
      </div>
    </div>
  );
}