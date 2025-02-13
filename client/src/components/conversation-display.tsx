import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { type Message, type Persona } from "@shared/schema";

interface ConversationResponse {
  conversation: {
    id: number;
    status: string;
    currentSpeakerId: number | null;
    maxTurns: number;
    currentTurn: number;
  };
  messages: Message[];
  personas: Persona[];
}

export function ConversationDisplay() {
  const { data, isLoading } = useQuery<ConversationResponse>({
    queryKey: ["/api/conversations/current"],
    enabled: false, // Only enable when conversation starts
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.messages?.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No conversation in progress. Create personas and start a new conversation.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {data.messages.map((message) => (
              <div
                key={message.id}
                className="flex flex-col space-y-2"
              >
                <div className="font-semibold">
                  {data.personas.find((p) => p.id === message.personaId)?.name}:
                </div>
                <div className="bg-muted rounded-lg p-3">
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}