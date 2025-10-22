import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Plus, Zap, Trash2, Eye } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Workflow, WorkflowExecution } from "@shared/schema";

export default function Workflows() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [viewingExecutions, setViewingExecutions] = useState<string | null>(null);

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

  const { data: workflows, isLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
    enabled: isAuthenticated,
  });

  const { data: executions } = useQuery<WorkflowExecution[]>({
    queryKey: ["/api/workflows", viewingExecutions, "executions"],
    enabled: !!viewingExecutions,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/workflows/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
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
        title: "Failed to update workflow",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/workflows/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Workflow deleted",
        description: "Your workflow has been deleted successfully",
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
        title: "Failed to delete workflow",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Workflows</h1>
        <Link href="/workflows/new">
          <Button data-testid="button-create-workflow">
            <Plus className="w-4 h-4 mr-2" />
            Create Workflow
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : workflows && workflows.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="p-4" data-testid={`workflow-card-${workflow.name}`}>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{workflow.name}</h3>
                    {workflow.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {workflow.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={workflow.isActive}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ id: workflow.id, isActive: checked })
                      }
                      data-testid={`switch-workflow-${workflow.name}`}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Badge variant="outline" className="capitalize">
                    <Zap className="w-3 h-3 mr-1" />
                    {workflow.frequency}
                  </Badge>
                  {workflow.lastRunAt && (
                    <Badge variant="outline" className="text-xs">
                      Last run: {new Date(workflow.lastRunAt).toLocaleDateString()}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setViewingExecutions(workflow.id)}
                    data-testid={`button-view-executions-${workflow.name}`}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Summaries
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete workflow "${workflow.name}"?`)) {
                        deleteMutation.mutate(workflow.id);
                      }
                    }}
                    data-testid={`button-delete-workflow-${workflow.name}`}
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
            <Zap className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
            <div className="text-lg font-medium">No workflows yet</div>
            <div className="text-sm text-muted-foreground">
              Create your first workflow to automate email summaries
            </div>
            <Link href="/workflows/new">
              <Button className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Create Workflow
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {viewingExecutions && executions && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Execution History</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingExecutions(null)}
              >
                Close
              </Button>
            </div>

            {executions.length > 0 ? (
              <div className="space-y-3">
                {executions.map((execution) => (
                  <Card key={execution.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <Badge variant="outline">
                          {execution.emailCount} emails
                        </Badge>
                        <span className="text-muted-foreground">
                          {new Date(execution.executedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm whitespace-pre-wrap" data-testid="text-execution-summary">
                        {execution.summary}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No executions yet
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
