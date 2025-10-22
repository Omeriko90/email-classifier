import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Mail, Tags, Zap, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    testId: "link-dashboard",
  },
  {
    title: "Inbox",
    url: "/inbox",
    icon: Mail,
    testId: "link-inbox-sidebar",
  },
  {
    title: "Labels",
    url: "/labels",
    icon: Tags,
    testId: "link-labels-sidebar",
  },
  {
    title: "Workflows",
    url: "/workflows",
    icon: Zap,
    testId: "link-workflows-sidebar",
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-semibold flex items-center gap-2 h-16 px-4">
            <Mail className="w-5 h-5 text-primary" />
            Email Manager
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={item.testId}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 border-t space-y-3">
          {user && (
            <div className="flex items-center gap-3">
              <Avatar>
                {user.profileImageUrl && <AvatarImage src={user.profileImageUrl} />}
                <AvatarFallback>
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {user.firstName || user.email}
                </div>
                <div className="text-xs text-muted-foreground truncate font-mono">
                  {user.email}
                </div>
              </div>
            </div>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.href = "/api/logout"}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
