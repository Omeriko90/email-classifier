import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Label as LabelType } from "@shared/schema";

const workflowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  frequency: z.enum(["weekly", "biweekly"]),
  labelIds: z.array(z.string()).min(1, "Select at least one label"),
  prompt: z.string().min(1, "Prompt is required"),
});

type WorkflowFormValues = z.infer<typeof workflowSchema>;

export default function WorkflowNew() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: labels } = useQuery<LabelType[]>({
    queryKey: ["/api/labels"],
    enabled: isAuthenticated,
  });

  const form = useForm<WorkflowFormValues>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      name: "",
      description: "",
      frequency: "weekly",
      labelIds: [],
      prompt: "Summarize the key points from these emails, highlighting important action items and deadlines.",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: WorkflowFormValues) => {
      await apiRequest("POST", "/api/workflows", values);
    },
    onSuccess: () => {
      toast({
        title: "Workflow created",
        description: "Your workflow has been created successfully",
      });
      setLocation("/workflows");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Failed to create workflow",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: WorkflowFormValues) => {
    createMutation.mutate(values);
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/workflows">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workflows
          </Button>
        </Link>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Create Workflow
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Set up automated email summaries with AI
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workflow Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Weekly Work Summary"
                        {...field}
                        data-testid="input-workflow-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What will this workflow summarize?"
                        {...field}
                        data-testid="input-workflow-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="weekly" id="weekly" data-testid="radio-weekly" />
                          <Label htmlFor="weekly">Weekly</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="biweekly" id="biweekly" data-testid="radio-biweekly" />
                          <Label htmlFor="biweekly">Biweekly</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>
                      How often should this workflow run?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="labelIds"
                render={() => (
                  <FormItem>
                    <FormLabel>Select Labels</FormLabel>
                    <FormDescription>
                      Choose which labels to include in the summary
                    </FormDescription>
                    <div className="space-y-2 pt-2">
                      {labels && labels.length > 0 ? (
                        labels.map((label) => (
                          <FormField
                            key={label.id}
                            control={form.control}
                            name="labelIds"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={label.id}
                                  className="flex flex-row items-center space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(label.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, label.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== label.id
                                              )
                                            );
                                      }}
                                      data-testid={`checkbox-label-${label.name}`}
                                    />
                                  </FormControl>
                                  <FormLabel className="flex items-center gap-2 font-normal cursor-pointer">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: `hsl(${label.color})` }}
                                    />
                                    {label.name}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No labels created yet.{" "}
                          <Link href="/labels">
                            <span className="text-primary hover:underline">Create a label</span>
                          </Link>{" "}
                          first.
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AI Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what you want the AI to do with the emails..."
                        className="min-h-32"
                        {...field}
                        data-testid="input-workflow-prompt"
                      />
                    </FormControl>
                    <FormDescription>
                      Customize how AI should summarize your emails
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Link href="/workflows">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="button-create-workflow"
                >
                  {createMutation.isPending ? "Creating..." : "Create Workflow"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </Card>
    </div>
  );
}
