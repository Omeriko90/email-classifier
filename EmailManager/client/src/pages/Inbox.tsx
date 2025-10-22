import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmailBadge } from "@/components/EmailBadge";
import { Search, Sparkles, Mail as MailIcon, ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { EmailWithLabels, Label } from "@shared/schema";

export default function Inbox() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

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

  const { data: emails, isLoading: emailsLoading } = useQuery<EmailWithLabels[]>({
    queryKey: ["/api/emails", searchQuery],
    enabled: isAuthenticated,
  });

  const { data: selectedEmail, isLoading: emailLoading } = useQuery<EmailWithLabels>({
    queryKey: ["/api/emails", selectedEmailId],
    enabled: !!selectedEmailId,
  });

  const classifyMutation = useMutation({
    mutationFn: async (emailId: string) => {
      await apiRequest("POST", `/api/emails/${emailId}/classify`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      toast({
        title: "Email classified",
        description: "AI has categorized this email",
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
        title: "Classification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async ({ emailId, isRead }: { emailId: string; isRead: boolean }) => {
      await apiRequest("PATCH", `/api/emails/${emailId}/read`, { isRead });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
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
      }
    },
  });

  if (authLoading || !isAuthenticated) {
    return null;
  }

  const filteredEmails = emails?.filter((email) =>
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.bodyPreview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full">
      {/* Email List */}
      <div className="w-96 border-r flex flex-col">
        <div className="p-4 border-b space-y-3">
          <h2 className="text-xl font-semibold">Inbox</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-emails"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {emailsLoading ? (
            <div className="p-2 space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : filteredEmails && filteredEmails.length > 0 ? (
            <div>
              {filteredEmails.map((email) => (
                <div
                  key={email.id}
                  className={`p-4 border-b cursor-pointer hover-elevate ${
                    selectedEmailId === email.id ? "bg-accent" : ""
                  } ${!email.isRead ? "bg-primary/5" : ""}`}
                  onClick={() => {
                    setSelectedEmailId(email.id);
                    if (!email.isRead) {
                      markReadMutation.mutate({ emailId: email.id, isRead: true });
                    }
                  }}
                  data-testid={`email-item-${email.id}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className={`font-medium truncate ${!email.isRead ? "font-semibold" : ""}`}>
                        {email.sender}
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(email.receivedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={`text-sm truncate ${!email.isRead ? "font-medium" : ""}`}>
                      {email.subject}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {email.bodyPreview}
                    </div>
                    {email.labels.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-2">
                        {email.labels.map((el) => (
                          <EmailBadge key={el.id} label={el.label} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <MailIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <div>No emails found</div>
            </div>
          )}
        </div>
      </div>

      {/* Email Detail */}
      <div className="flex-1 flex flex-col">
        {selectedEmailId && selectedEmail ? (
          <>
            <div className="p-6 border-b space-y-4">
              <div className="flex items-start justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEmailId(null)}
                  data-testid="button-back-to-list"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => classifyMutation.mutate(selectedEmail.id)}
                  disabled={classifyMutation.isPending}
                  data-testid="button-classify-email"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {classifyMutation.isPending ? "Classifying..." : "AI Classify"}
                </Button>
              </div>

              <div className="flex items-start gap-3">
                <Avatar>
                  <AvatarFallback>
                    {selectedEmail.sender.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="font-medium">{selectedEmail.sender}</div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {selectedEmail.senderEmail}
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold" data-testid="text-email-subject">
                  {selectedEmail.subject}
                </h2>
                <div className="text-sm text-muted-foreground mt-1">
                  {new Date(selectedEmail.receivedAt).toLocaleString()}
                </div>
              </div>

              {selectedEmail.labels.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {selectedEmail.labels.map((el) => (
                    <EmailBadge key={el.id} label={el.label} />
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {emailLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              ) : (
                <div className="prose prose-sm max-w-none" data-testid="text-email-body">
                  <div className="whitespace-pre-wrap">{selectedEmail.bodyFull || selectedEmail.bodyPreview}</div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MailIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <div>Select an email to view</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
