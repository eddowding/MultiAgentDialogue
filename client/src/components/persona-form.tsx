import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertPersonaSchema, type InsertPersona } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { UserCircle } from "lucide-react";

export function PersonaForm() {
  const { toast } = useToast();
  const { data: personas } = useQuery({
    queryKey: ["/api/personas"],
  });

  const form = useForm<InsertPersona>({
    resolver: zodResolver(insertPersonaSchema),
    defaultValues: {
      name: "",
      background: "",
      goal: "",
      modelType: "gpt-4o",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertPersona) => {
      await apiRequest("POST", "/api/personas", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personas"] });
      form.reset();
      toast({
        title: "Success",
        description: "Persona created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create persona",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      {personas && personas.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Existing Personas</h3>
          <Accordion type="single" collapsible className="w-full">
            {personas.map((persona) => (
              <AccordionItem key={persona.id} value={`persona-${persona.id}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5" />
                    <span>{persona.name}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    <div>
                      <span className="font-medium">Background:</span>
                      <p className="text-muted-foreground">{persona.background}</p>
                    </div>
                    <div>
                      <span className="font-medium">Goal:</span>
                      <p className="text-muted-foreground">{persona.goal}</p>
                    </div>
                    <div>
                      <span className="font-medium">Model:</span>
                      <p className="text-muted-foreground">{persona.modelType}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="font-semibold">Create New Persona</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter persona name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="background"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Background</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter persona background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter persona's goal"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="modelType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Model</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select AI model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create Persona"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default PersonaForm;