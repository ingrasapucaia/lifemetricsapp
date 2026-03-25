import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, CalendarDays, User, Menu, Trophy, Target, Archive, LogOut, Bell, CheckSquare, BarChart3, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

const mainLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/metricas", label: "Métricas", icon: BarChart3 },
  { to: "/registros", label: "Meus Registros", icon: CalendarDays },
  { to: "/habitos", label: "Controle de hábitos", icon: CheckSquare },
  { to: "/metas", label: "Metas de Vida", icon: Target },
  { to: "/prazos", label: "Prazos e lembretes", icon: Bell },
  { to: "/conquistas", label: "Minhas Conquistas", icon: Trophy },
  { to: "/arquivados", label: "Arquivados", icon: Archive },
];

function Links({ onClick, onLogout }: { onClick?: () => void; onLogout: () => void }) {
  return (
    <>
      <nav className="flex-1 flex flex-col gap-0.5 p-4">
        <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
          Menu
        </p>
        {mainLinks.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            onClick={onClick}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary font-medium shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )
            }
          >
            <l.icon size={18} strokeWidth={1.8} />
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border/50 p-4">
        <NavLink
          to="/perfil"
          onClick={onClick}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
              isActive
                ? "bg-primary/10 text-primary font-medium shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )
          }
        >
          <User size={18} strokeWidth={1.8} />
          Meu Perfil
        </NavLink>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 w-full"
        >
          <LogOut size={18} strokeWidth={1.8} />
          Sair
        </button>
      </div>
    </>
  );
}

export function AppSidebar() {
  const [open, setOpen] = useState(false);
  const { signOut } = useAuth();

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r border-border/50 bg-sidebar z-30">
        <div className="px-6 py-6 border-b border-border/50">
          <h1 className="text-xl font-bold tracking-tight text-foreground">metrics</h1>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5 tracking-wide">performance pessoal</p>
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto">
          <Links onLogout={signOut} />
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-lg border-b border-border/50 px-4 h-14 flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0 flex flex-col">
            <div className="px-6 py-6 border-b border-border/50">
              <h1 className="text-xl font-bold tracking-tight">metrics</h1>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 tracking-wide">performance pessoal</p>
            </div>
            <div className="flex flex-col flex-1">
              <Links onClick={() => setOpen(false)} onLogout={signOut} />
            </div>
          </SheetContent>
        </Sheet>
        <span className="text-sm font-bold tracking-tight">metrics</span>
      </header>
    </>
  );
}
