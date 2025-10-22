import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Tags, Zap, Plus, RefreshCw } from "lucide-react";
import type { EmailAccount, Label, Workflow } from "@shared/schema";
import { Link } from "wouter";

export default function Dashboard() {
  const { toast } = useToast();
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

  const { data: emailAccounts, isLoading: accountsLoading } = useQuery<EmailAccount[]>({
    queryKey: ["/api/email-accounts"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalEmails: number;
    unreadEmails: number;
    totalLabels: number;
    activeWorkflows: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const { data: labels } = useQuery<Label[]>({
    queryKey: ["/api/labels"],
  });

  const { data: workflows } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
  });

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/labels">
            <Button variant="outline" data-testid="button-manage-labels">
              <Tags className="w-4 h-4 mr-2" />
              Manage Labels
            </Button>
          </Link>
          <Link href="/workflows/new">
            <Button data-testid="button-create-workflow">
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          {statsLoading ? (
            <Skeleton className="h-20" />
          ) : (
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Total Emails</div>
                <div className="text-2xl font-bold" data-testid="stat-total-emails">
                  {stats?.totalEmails || 0}
                </div>
              </div>
              <Mail className="w-5 h-5 text-primary" />
            </div>
          )}
        </Card>

        <Card className="p-4">
          {statsLoading ? (
            <Skeleton className="h-20" />
          ) : (
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Unread</div>
                <div className="text-2xl font-bold" data-testid="stat-unread-emails">
                  {stats?.unreadEmails || 0}
                </div>
              </div>
              <Mail className="w-5 h-5 text-chart-3" />
            </div>
          )}
        </Card>

        <Card className="p-4">
          {statsLoading ? (
            <Skeleton className="h-20" />
          ) : (
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Labels</div>
                <div className="text-2xl font-bold" data-testid="stat-total-labels">
                  {stats?.totalLabels || 0}
                </div>
              </div>
              <Tags className="w-5 h-5 text-chart-2" />
            </div>
          )}
        </Card>

        <Card className="p-4">
          {statsLoading ? (
            <Skeleton className="h-20" />
          ) : (
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Active Workflows</div>
                <div className="text-2xl font-bold" data-testid="stat-active-workflows">
                  {stats?.activeWorkflows || 0}
                </div>
              </div>
              <Zap className="w-5 h-5 text-chart-4" />
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connected Accounts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Connected Accounts</h2>
          </div>

          {accountsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : emailAccounts && emailAccounts.length > 0 ? (
            <div className="space-y-3">
              {emailAccounts.map((account) => (
                <Card key={account.id} className="p-4" data-testid={`account-${account.provider}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium capitalize">{account.provider}</div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {account.email}
                        </div>
                        {account.lastSyncedAt && (
                          <div className="text-xs text-muted-foreground">
                            Last synced: {new Date(account.lastSyncedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                      Connected
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center">
                  <Mail className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <div className="font-medium">No email accounts connected</div>
                  <div className="text-sm text-muted-foreground">
                    Connect your Gmail or Outlook account to get started
                  </div>
                </div>
                <Button variant="outline" className="mt-2" data-testid="button-connect-account">
                  <Plus className="w-4 h-4 mr-2" />
                  Connect Account
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/inbox">
              <Card className="p-4 hover-elevate cursor-pointer" data-testid="link-inbox">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-medium">View Inbox</div>
                    <div className="text-xs text-muted-foreground">Browse your emails</div>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/labels">
              <Card className="p-4 hover-elevate cursor-pointer" data-testid="link-labels">
                <div className="flex items-center gap-3">
                  <Tags className="w-5 h-5 text-chart-2" />
                  <div>
                    <div className="font-medium">Manage Labels</div>
                    <div className="text-xs text-muted-foreground">
                      {labels?.length || 0} labels
                    </div>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/workflows">
              <Card className="p-4 hover-elevate cursor-pointer" data-testid="link-workflows">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-chart-4" />
                  <div>
                    <div className="font-medium">Workflows</div>
                    <div className="text-xs text-muted-foreground">
                      {workflows?.length || 0} workflows
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
