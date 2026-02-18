import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, CalendarDays, User, Menu, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const mainLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/registros", label: "Meus Registros", icon: CalendarDays },
  { to: "/conquistas", label: "Minhas Conquistas", icon: Trophy },
];

function Links({ onClick }: { onClick?: () => void }) {
  return (
    <>
      <nav className="flex-1 flex flex-col gap-1 p-4">
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Menu
        </p>
        {mainLinks.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            onClick={onClick}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <l.icon size={18} />
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t p-4">
        <NavLink
          to="/perfil"
          onClick={onClick}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              isActive
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
        >
          <User size={18} />
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
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r bg-card z-30">
        <div className="px-6 py-5 border-b">
          <h1 className="text-lg font-bold tracking-tight text-foreground">metrics</h1>
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto">
          <Links />
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-b px-4 h-14 flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0 flex flex-col">
            <div className="px-6 py-5 border-b">
              <h1 className="text-lg font-bold tracking-tight">metrics</h1>
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
