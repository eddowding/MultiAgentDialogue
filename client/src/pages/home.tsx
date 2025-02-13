import { PersonaForm } from "@/components/persona-form";
import { ConversationDisplay } from "@/components/conversation-display";
import { ConversationControls } from "@/components/conversation-controls";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const { data: personas } = useQuery({
    queryKey: ["/api/personas"],
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Multi-Agent Conversation</h1>
          <p className="text-muted-foreground">
            Configure AI personas and watch them engage in meaningful dialogue
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[350px_1fr]">
          {/* Left column - Persona Form */}
          <div>
            <Card>
              <CardContent className="pt-6">
                <PersonaForm />
              </CardContent>
            </Card>
          </div>

          {/* Right column - Controls and Conversation */}
          <div className="space-y-6">
            {personas && personas.length > 1 && (
              <Card>
                <CardContent className="pt-6">
                  <ConversationControls personas={personas} />
                </CardContent>
              </Card>
            )}

            <ConversationDisplay />
          </div>
        </div>
      </div>
    </div>
  );
}