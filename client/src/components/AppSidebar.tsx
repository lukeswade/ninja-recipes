import { Home, Users, Heart, User, Plus } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    title: "My Recipes",
    icon: Home,
    id: "home",
    testId: "sidebar-nav-home",
  },
  {
    title: "Community",
    icon: Users,
    id: "community",
    testId: "sidebar-nav-community",
  },
  {
    title: "Favorites",
    icon: Heart,
    id: "favorites",
    testId: "sidebar-nav-favorites",
  },
  {
    title: "Profile",
    icon: User,
    id: "profile",
    testId: "sidebar-nav-profile",
  },
];

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAddRecipe: () => void;
}

export function AppSidebar({ activeTab, onTabChange, onAddRecipe }: AppSidebarProps) {
  return (
    <Sidebar className="hidden md:flex">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    isActive={activeTab === item.id}
                    data-testid={item.testId}
                    className="text-sm"
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium tracking-wide">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Button
          onClick={onAddRecipe}
          className="w-full gap-2"
          data-testid="button-sidebar-add-recipe"
        >
          <Plus className="h-4 w-4" />
          <span>Add Recipe</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
