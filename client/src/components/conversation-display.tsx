import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { type Message, type Persona } from "@shared/schema";
import { useEffect, useRef } from "react";

interface ConversationResponse {
  conversation: {
    id: number;
    status: string;
    currentSpeakerId: number | null;
    maxTurns: number;
    currentTurn: number;
  } | null;
  messages: Message[];
  personas: Persona[];
}

function convertToMarkdown(messages: Message[], personas: Persona[]): string {
  const timestamp = new Date().toISOString().split('T')[0];
  let markdown = `# AI Conversation Export\nExported on: ${timestamp}\n\n`;

  markdown += `## Participants\n`;
  personas.forEach(persona => {
    markdown += `### ${persona.name}\n`;
    markdown += `- Background: ${persona.background}\n`;
    markdown += `- Goal: ${persona.goal}\n\n`;
  });

  markdown += `## Conversation\n\n`;
  messages.forEach(message => {
    const persona = personas.find(p => p.id === message.personaId);
    const time = new Date(message.timestamp).toLocaleTimeString();
    markdown += `**${persona?.name}** (${time}):\n${message.content}\n\n`;
  });

  return markdown;
}

function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ConversationDisplay() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useQuery<ConversationResponse>({
    queryKey: ["/api/conversations/current"],
    enabled: true,
    refetchInterval: (data) => 
      data?.conversation?.status === "active" ? 2000 : false,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [data?.messages]);

  const handleExport = () => {
    if (data?.messages && data.personas) {
      const markdown = convertToMarkdown(data.messages, data.personas);
      const filename = `conversation-export-${new Date().toISOString().split('T')[0]}.md`;
      downloadMarkdown(markdown, filename);
    }
  };

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

  const isConversationActive = data.conversation?.status === "active";
  const currentSpeaker = data.personas.find(p => p.id === data.conversation?.currentSpeakerId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <CardTitle className="text-xl">
              Conversation Progress: Turn {data.conversation?.currentTurn} of {data.conversation?.maxTurns}
            </CardTitle>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Status: {data.conversation?.status}
              </p>
              {isConversationActive && currentSpeaker && (
                <p className="text-sm">
                  • Current Speaker: <span className="text-primary font-medium">{currentSpeaker.name}</span>
                </p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            Export as Markdown
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {data.messages.map((message, index) => {
              const persona = data.personas.find((p) => p.id === message.personaId);
              const isLastMessage = index === data.messages.length - 1;

              return (
                <div
                  key={message.id}
                  className={`flex flex-col space-y-2 ${isLastMessage ? "animate-in fade-in-50" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">
                      {persona?.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    {message.content}
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}