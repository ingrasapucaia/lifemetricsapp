import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, BarChart3, CalendarDays, Trophy, User, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const mainLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/metricas", label: "Métricas", icon: BarChart3 },
  { to: "/registros", label: "Meus Registros", icon: CalendarDays },
  { to: "/conquistas", label: "Conquistas", icon: Trophy },
];

function Links({ onClick }: { onClick?: () => void }) {
  return (
    <>
      <nav className="flex-1 flex flex-col gap-0.5 p-3">
        <p className="px-3 mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Menu
        </p>
        {mainLinks.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            onClick={onClick}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors",
                isActive
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )
            }
          >
            <l.icon size={16} strokeWidth={1.5} />
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t p-3">
        <NavLink
          to="/perfil"
          onClick={onClick}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors",
              isActive
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )
          }
        >
          <User size={16} strokeWidth={1.5} />
          Meu Perfil
        </NavLink>
      </div>
    </>
  );
}

export function AppSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 border-r bg-background z-30">
        <div className="px-5 py-4 border-b">
          <h1 className="text-sm font-semibold tracking-tight text-foreground">metrics</h1>
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto">
          <Links />
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-b px-4 h-12 flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
              <Menu size={18} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-56 p-0 flex flex-col">
            <div className="px-5 py-4 border-b">
              <h1 className="text-sm font-semibold tracking-tight">metrics</h1>
            </div>
            <div className="flex flex-col flex-1">
              <Links onClick={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        <span className="text-sm font-semibold">metrics</span>
      </header>
    </>
  );
}
