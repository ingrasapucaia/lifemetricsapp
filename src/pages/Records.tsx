import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useStore } from "@/hooks/useStore";
import { DailyRecord } from "@/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { calculateDailyAdherence } from "@/lib/metrics";
import { MOOD_OPTIONS } from "@/types";
import DayEditor from "@/components/DayEditor";
import { toast } from "sonner";
import { Plus, Trash2, Search, X, CalendarDays, List } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Records() {
  const { records, habits, upsertRecord, deleteRecord } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState<Date | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [delTarget, setDelTarget] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowNew(true);
      setNewDate(format(new Date(), "yyyy-MM-dd"));
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const dateset = useMemo(() => new Set(records.map((r) => r.date)), [records]);
  const dateStr = selected ? format(selected, "yyyy-MM-dd") : "";
  const selRecord = records.find((r) => r.date === dateStr);

  const filtered = useMemo(() => {
    let list = [...records].sort((a, b) => b.date.localeCompare(a.date));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.noteFeeling?.toLowerCase().includes(q) ||
          r.noteProcrastination?.toLowerCase().includes(q) ||
          r.noteGratitude?.toLowerCase().includes(q) ||
          r.date.includes(q)
      );
    }
    return list;
  }, [records, search]);

  const handleDayClick = (day: Date | undefined) => {
    setSelected(day);
    if (day) setDrawerOpen(true);
  };

  const handleCreate = () => {
    if (!newDate) return;
    if (dateset.has(newDate)) {
      toast.error("Já existe registro para esta data");
      setSelected(parseISO(newDate));
      setDrawerOpen(true);
      setShowNew(false);
      return;
    }
    upsertRecord({ date: newDate });
    setSelected(parseISO(newDate));
    setDrawerOpen(true);
    setShowNew(false);
    setNewDate("");
    toast("Registro criado");
  };

  const handleListClick = (r: DailyRecord) => {
    setSelected(parseISO(r.date));
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Meus Registros</h1>
        <Button variant="outline" size="sm" onClick={() => { setShowNew(true); setNewDate(format(new Date(), "yyyy-MM-dd")); }}>
          <Plus size={14} className="mr-1" /> Novo registro
        </Button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar nas notas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          id="records-search"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X size={14} className="text-muted-foreground" />
          </button>
        )}
      </div>

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar" className="gap-2"><CalendarDays size={14} /> Calendário</TabsTrigger>
          <TabsTrigger value="list" className="gap-2"><List size={14} /> Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <Card className="w-fit">
            <CardContent className="p-3">
              <Calendar
                mode="single"
                selected={selected}
                onSelect={handleDayClick}
                locale={ptBR}
                modifiers={{ hasRecord: (d: Date) => dateset.has(format(d, "yyyy-MM-dd")) }}
                modifiersStyles={{
                  hasRecord: {
                    fontWeight: 600,
                    textDecoration: "underline",
                    textDecorationColor: "hsl(0, 0%, 40%)",
                    textUnderlineOffset: "3px",
                  },
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          {filtered.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <p className="text-muted-foreground">
                  {search ? "Nenhum registro encontrado." : "Nenhum registro ainda."}
                </p>
                {search && <Button variant="link" onClick={() => setSearch("")}>Limpar busca</Button>}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-1">
              {filtered.map((r) => {
                const adh = calculateDailyAdherence(r, habits);
                const moodOpt = MOOD_OPTIONS.find((m) => m.label === r.moodLabel);
                return (
                  <button
                    key={r.id}
                    className="w-full flex items-center justify-between p-3 rounded hover:bg-muted/50 transition-colors text-left"
                    onClick={() => handleListClick(r)}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-medium">{format(parseISO(r.date), "dd/MM/yyyy")}</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {moodOpt && (
                          <Badge className={cn("font-normal capitalize border-0 text-xs", moodOpt.bg, moodOpt.text)}>
                            {moodOpt.label}
                          </Badge>
                        )}
                        {r.sleepHours > 0 && <Badge variant="secondary" className="text-xs">{r.sleepHours}h</Badge>}
                        <Badge variant="secondary" className="text-xs">{adh}%</Badge>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Day Editor Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-base">
                {dateStr ? format(parseISO(dateStr), "dd 'de' MMMM, yyyy", { locale: ptBR }) : ""}
              </SheetTitle>
              {selRecord && (
                <Button variant="ghost" size="icon" onClick={() => { setDelTarget(selRecord.id); }}>
                  <Trash2 size={16} className="text-destructive" />
                </Button>
              )}
            </div>
          </SheetHeader>

          {dateStr && (
            <DayEditor
              date={dateStr}
              record={selRecord}
              habits={habits}
              onUpdate={(u) => { upsertRecord({ date: dateStr, ...u }); }}
              showHeader={false}
            />
          )}

          {!selRecord && dateStr && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-3 text-sm">Sem registro para este dia.</p>
              <Button variant="outline" size="sm" onClick={() => upsertRecord({ date: dateStr })}>
                Criar registro
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* New record */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo registro</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Data</label>
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowNew(false)}>Cancelar</Button>
              <Button onClick={handleCreate}>Criar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!delTarget} onOpenChange={(o) => !o && setDelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar registro?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              deleteRecord(delTarget!);
              setDelTarget(null);
              setDrawerOpen(false);
              toast("Registro deletado");
            }}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
