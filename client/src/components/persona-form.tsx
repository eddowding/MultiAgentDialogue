import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertPersonaSchema, type InsertPersona, type Persona } from "@shared/schema";
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
import { UserCircle, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

export function PersonaForm() {
  const { toast } = useToast();
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
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
      if (editingPersona) {
        await apiRequest("PATCH", `/api/personas/${editingPersona.id}`, data);
      } else {
        await apiRequest("POST", "/api/personas", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personas"] });
      form.reset();
      setEditingPersona(null);
      toast({
        title: "Success",
        description: editingPersona ? "Persona updated successfully" : "Persona created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: editingPersona ? "Failed to update persona" : "Failed to create persona",
        variant: "destructive",
      });
    },
  });

  const clearPersonasMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/personas", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personas"] });
      form.reset();
      setEditingPersona(null);
      toast({
        title: "Success",
        description: "All personas cleared",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear personas",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (persona: Persona) => {
    setEditingPersona(persona);
    form.reset({
      name: persona.name,
      background: persona.background,
      goal: persona.goal,
      modelType: persona.modelType,
    });
  };

  const handleCancel = () => {
    setEditingPersona(null);
    form.reset();
  };

  return (
    <div className="space-y-6">
      {personas && personas.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Existing Personas</h3>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => clearPersonasMutation.mutate()}
              disabled={clearPersonasMutation.isPending}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear All Personas
            </Button>
          </div>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(persona)}
                      className="mt-2"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Persona
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="font-semibold">
          {editingPersona ? `Edit Persona: ${editingPersona.name}` : "Create New Persona"}
        </h3>
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

            <div className="flex gap-2">
              <Button type="submit" disabled={mutation.isPending} className="flex-1">
                {mutation.isPending
                  ? (editingPersona ? "Updating..." : "Creating...")
                  : (editingPersona ? "Update Persona" : "Create Persona")}
              </Button>
              {editingPersona && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancel Edit
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default PersonaForm;