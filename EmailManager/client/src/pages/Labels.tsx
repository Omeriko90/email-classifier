import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { LABEL_COLORS } from "@/lib/labelColors";
import type { Label } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const labelFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string(),
  description: z.string().optional(),
});

type LabelFormValues = z.infer<typeof labelFormSchema>;

export default function Labels() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);

  const form = useForm<LabelFormValues>({
    resolver: zodResolver(labelFormSchema),
    defaultValues: {
      name: "",
      color: LABEL_COLORS[0].value,
      description: "",
    },
  });

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

  useEffect(() => {
    if (editingLabel) {
      form.reset({
        name: editingLabel.name,
        color: editingLabel.color,
        description: editingLabel.description || "",
      });
    } else {
      form.reset({
        name: "",
        color: LABEL_COLORS[0].value,
        description: "",
      });
    }
  }, [editingLabel, form]);

  const { data: labels, isLoading } = useQuery<Label[]>({
    queryKey: ["/api/labels"],
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: async (values: LabelFormValues) => {
      await apiRequest("POST", "/api/labels", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/labels"] });
      setIsCreateOpen(false);
      form.reset();
      toast({
        title: "Label created",
        description: "Your label has been created successfully",
      });
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
        title: "Failed to create label",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: LabelFormValues }) => {
      await apiRequest("PUT", `/api/labels/${id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/labels"] });
      setEditingLabel(null);
      form.reset();
      toast({
        title: "Label updated",
        description: "Your label has been updated successfully",
      });
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
        title: "Failed to update label",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/labels/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/labels"] });
      toast({
        title: "Label deleted",
        description: "Your label has been deleted successfully",
      });
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
        title: "Failed to delete label",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: LabelFormValues) => {
    if (editingLabel) {
      updateMutation.mutate({ id: editingLabel.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Labels</h1>
        <Button
          onClick={() => setIsCreateOpen(true)}
          data-testid="button-create-label"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Label
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : labels && labels.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {labels.map((label) => (
            <Card key={label.id} className="p-4" data-testid={`label-card-${label.name}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: `hsl(${label.color})` }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{label.name}</div>
                    {label.description && (
                      <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {label.description}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditingLabel(label)}
                    data-testid={`button-edit-${label.name}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      if (confirm(`Delete label "${label.name}"?`)) {
                        deleteMutation.mutate(label.id);
                      }
                    }}
                    data-testid={`button-delete-${label.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center space-y-3">
            <div className="text-lg font-medium">No labels yet</div>
            <div className="text-sm text-muted-foreground">
              Create your first label to start organizing your emails
            </div>
            <Button onClick={() => setIsCreateOpen(true)} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Create Label
            </Button>
          </div>
        </Card>
      )}

      <Dialog open={isCreateOpen || !!editingLabel} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setEditingLabel(null);
          form.reset();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLabel ? "Edit Label" : "Create Label"}
            </DialogTitle>
            <DialogDescription>
              {editingLabel
                ? "Update your label information"
                : "Create a new label to organize your emails"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Work, Personal, Important..."
                        {...field}
                        data-testid="input-label-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <div className="grid grid-cols-6 gap-2">
                      {LABEL_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`w-full h-10 rounded-md border-2 ${
                            field.value === color.value
                              ? "border-primary ring-2 ring-primary ring-offset-2"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: `hsl(${color.value})` }}
                          onClick={() => field.onChange(color.value)}
                          data-testid={`color-${color.name}`}
                        />
                      ))}
                    </div>
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
                        placeholder="What is this label for?"
                        {...field}
                        data-testid="input-label-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingLabel(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-label"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingLabel
                    ? "Update"
                    : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
