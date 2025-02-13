import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { Persona } from "@shared/schema";

interface ConversationControlsProps {
  personas: Persona[];
}

interface CurrentConversation {
  id: number;
  status: string;
  currentSpeakerId: number | null;
  maxTurns: number;
  currentTurn: number;
}

export function ConversationControls({ personas }: ConversationControlsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [firstSpeakerId, setFirstSpeakerId] = useState<string>("");
  const [maxTurns, setMaxTurns] = useState("10");
  const [isRunningMultipleTurns, setIsRunningMultipleTurns] = useState(false);

  const startMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/conversations", {
        currentSpeakerId: parseInt(firstSpeakerId),
        maxTurns: parseInt(maxTurns),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations/current"] });
      toast({
        title: "Success",
        description: "Conversation started successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start conversation",
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
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate next response",
        variant: "destructive",
      });
    },
  });

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const runMultipleTurns = async (numberOfTurns: number) => {
    setIsRunningMultipleTurns(true);
    try {
      for (let i = 0; i < numberOfTurns; i++) {
        const currentData = await queryClient.getQueryData<{ conversation: CurrentConversation }>(["/api/conversations/current"]);
        const conversation = currentData?.conversation;

        if (!conversation || conversation.status !== "active") {
          if (conversation?.status === "completed") {
            toast({
              title: "Info",
              description: "Conversation completed successfully",
            });
          }
          break;
        }

        // Add a small delay between turns to prevent rate limiting
        if (i > 0) {
          await delay(1000);
        }

        try {
          await nextTurnMutation.mutateAsync();
        } catch (error) {
          console.error("Error during turn:", error);
          toast({
            title: "Error",
            description: `Failed at turn ${conversation.currentTurn + 1}`,
            variant: "destructive",
          });
          break;
        }

        // Verify the conversation is still active after the turn
        const updatedData = await queryClient.getQueryData<{ conversation: CurrentConversation }>(["/api/conversations/current"]);
        if (updatedData?.conversation?.status !== "active") {
          break;
        }
      }
    } finally {
      setIsRunningMultipleTurns(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Conversation Controls</h3>

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