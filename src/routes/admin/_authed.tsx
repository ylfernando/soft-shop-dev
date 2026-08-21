import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard,
  ShoppingBag,
  Image,
  Receipt,
  Users,
  LogOut,
  Sparkles,
  Tag,
  Store,
  Heart,
} from "lucide-react";
import { getAdminSession, adminLogout } from "@/server-fns/admin/auth";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { to: "/admin", label: "Visão geral", Icon: LayoutDashboard },
  { to: "/admin/produtos", label: "Produtos", Icon: ShoppingBag },
  { to: "/admin/vitrine", label: "Vitrine", Icon: Sparkles },
  { to: "/admin/banners", label: "Banners", Icon: Image },
  { to: "/admin/divas", label: "Divas", Icon: Heart },
  { to: "/admin/cupons", label: "Cupons", Icon: Tag },
  { to: "/admin/pedidos", label: "Pedidos", Icon: Receipt },
  { to: "/admin/clientes", label: "Clientes", Icon: Users },
] as const;

export const Route = createFileRoute("/admin/_authed")({
  component: AdminLayout,
  beforeLoad: async () => {
    const { admin } = await getAdminSession();
    if (!admin) {
      throw redirect({ to: "/admin/entrar" });
    }
    return { admin };
  },
});

function AdminLayout() {
  const { admin } = Route.useRouteContext();
  const navigate = useNavigate();
  const adminLogoutCall = useServerFn(adminLogout);

  async function handleLogout() {
    await adminLogoutCall();
    navigate({ to: "/admin/entrar" });
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>painel admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map(({ to, label, Icon }) => (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={to}
                        activeOptions={{ exact: to === "/admin" }}
                        activeProps={{ "data-active": true }}
                      >
                        <Icon />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/">
                  <Store />
                  <span>voltar para a loja</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <div className="px-2 py-1 text-xs text-sidebar-foreground/60 truncate">
                {admin.nome}
              </div>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout}>
                <LogOut />
                <span>sair</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center gap-2 border-b px-4 py-3">
          <SidebarTrigger />
          <span className="text-sm text-muted-foreground">soft shop</span>
        </header>
        <div className="p-4 sm:p-6 overflow-x-hidden">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
