import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const shortcuts = [
  { keys: "G → D", desc: "Ir para Dashboard" },
  { keys: "G → M", desc: "Ir para Métricas" },
  { keys: "G → R", desc: "Ir para Registros" },
  { keys: "G → C", desc: "Ir para Conquistas" },
  { keys: "G → P", desc: "Ir para Perfil" },
  { keys: "N", desc: "Novo registro" },
  { keys: "/", desc: "Focar busca" },
  { keys: "?", desc: "Atalhos de teclado" },
];

export function KeyboardShortcuts() {
  const nav = useNavigate();
  const [show, setShow] = useState(false);
  const last = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;

      const k = e.key.toLowerCase();

      if (k === "?") { e.preventDefault(); setShow(true); return; }

      if (last.current === "g") {
        last.current = null;
        clearTimeout(timer.current);
        if (k === "d") nav("/dashboard");
        else if (k === "m") nav("/metricas");
        else if (k === "r") nav("/registros");
        else if (k === "c") nav("/conquistas");
        else if (k === "p") nav("/perfil");
        return;
      }

      if (k === "g") {
        last.current = "g";
        clearTimeout(timer.current);
        timer.current = setTimeout(() => { last.current = null; }, 1000);
        return;
      }

      if (k === "n") { nav("/registros?new=1"); return; }
      if (k === "/") {
        e.preventDefault();
        nav("/registros");
        setTimeout(() => document.getElementById("records-search")?.focus(), 150);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [nav]);

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Atalhos de teclado</DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          {shortcuts.map((s) => (
            <div key={s.keys} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-muted-foreground">{s.desc}</span>
              <kbd className="px-2 py-0.5 text-xs bg-muted rounded font-mono">{s.keys}</kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
