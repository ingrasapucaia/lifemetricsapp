import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useStore } from "@/hooks/useStore";
import { DailyRecord, MOOD_TAGS, getMoodTag, moodToNumber } from "@/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { calculateDailyAdherence, isHabitCompleted } from "@/lib/metrics";
import { toast } from "sonner";
import { Plus, Trash2, Search, X, CalendarDays, List, Moon, Droplets, Dumbbell, BarChart3 } from "lucide-react";

export default function Records() {
  const { records, habits, upsertRecord, deleteRecord } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [delTarget, setDelTarget] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");

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
  const active = habits.filter((h) => h.active);

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

  const handleCreate = () => {
    if (!newDate) return;
    if (dateset.has(newDate)) {
      toast.error("Já existe registro para esta data");
      setSelected(parseISO(newDate));
      setShowNew(false);
      return;
    }
    upsertRecord({ date: newDate });
    setSelected(parseISO(newDate));
    setShowNew(false);
    setNewDate("");
    toast("Registro criado");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meus Registros</h1>
        <Button onClick={() => { setShowNew(true); setNewDate(format(new Date(), "yyyy-MM-dd")); }}>
          <Plus size={16} /> Novo registro
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

        <TabsContent value="calendar">
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 mt-4">
            <Card className="w-fit h-fit">
              <CardContent className="p-2">
                <Calendar
                  mode="single"
                  selected={selected}
                  onSelect={setSelected}
                  locale={ptBR}
                  modifiers={{ hasRecord: (d: Date) => dateset.has(format(d, "yyyy-MM-dd")) }}
                  modifiersStyles={{
                    hasRecord: { fontWeight: 700, textDecoration: "underline", textDecorationColor: "hsl(168,64%,38%)", textUnderlineOffset: "3px" },
                  }}
                />
              </CardContent>
            </Card>

            <DayPanel
              record={selRecord}
              date={dateStr}
              habits={active}
              onUpdate={(u) => { upsertRecord({ date: dateStr, ...u }); toast("Salvo"); }}
              onDelete={() => selRecord && setDelTarget(selRecord.id)}
            />
          </div>
        </TabsContent>

        <TabsContent value="list">
          {filtered.length === 0 ? (
            <Card className="text-center py-8 mt-4">
              <CardContent>
                <p className="text-muted-foreground">
                  {search ? "Nenhum registro encontrado." : "Nenhum registro ainda."}
                </p>
                {search && <Button variant="link" onClick={() => setSearch("")}>Limpar busca</Button>}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 mt-4">
              {filtered.map((r) => {
                const adh = calculateDailyAdherence(r, habits);
                const tag = getMoodTag(r.mood);
                return (
                  <Card
                    key={r.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setSelected(parseISO(r.date))}
                  >
                    <CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-medium">{format(parseISO(r.date), "dd/MM/yyyy")}</span>
                        <div className="flex gap-1.5 flex-wrap">
                          {tag && (
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-sm"
                              style={{ backgroundColor: `hsl(${tag.bgHsl})` }}
                            >
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${tag.hsl})` }} />
                              {tag.label}
                            </span>
                          )}
                          {r.sleepHours > 0 && <Badge variant="secondary">{r.sleepHours}h</Badge>}
                          <Badge variant="secondary">{adh}%</Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Ver</Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

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
            <AlertDialogAction onClick={() => { deleteRecord(delTarget!); setDelTarget(null); toast("Registro deletado"); }}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DayPanel({ record, date, habits, onUpdate, onDelete }: {
  record: DailyRecord | undefined;
  date: string;
  habits: ReturnType<typeof Array.prototype.filter>;
  onUpdate: (u: Partial<DailyRecord>) => void;
  onDelete: () => void;
}) {
  if (!date) return null;

  if (!record) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-3">
            Sem registro para {date ? format(parseISO(date), "dd/MM/yyyy") : ""}.
          </p>
          <Button onClick={() => onUpdate({})}>Criar registro</Button>
        </CardContent>
      </Card>
    );
  }

  const adh = calculateDailyAdherence(record, habits as any);
  const moodTag = getMoodTag(record.mood);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {format(parseISO(date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 size={16} className="text-destructive" />
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Quick mood dropdown */}
          <Select
            value={typeof record.mood === "string" ? record.mood : ""}
            onValueChange={(v) => onUpdate({ mood: v })}
          >
            <SelectTrigger className="w-auto h-7 text-xs gap-1 px-2">
              <SelectValue placeholder="Humor">
                {moodTag && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs"
                    style={{ backgroundColor: `hsl(${moodTag.bgHsl})` }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${moodTag.hsl})` }} />
                    {moodTag.label}
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {MOOD_TAGS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-sm"
                    style={{ backgroundColor: `hsl(${m.bgHsl})` }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${m.hsl})` }} />
                    {m.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {record.sleepHours > 0 && (
            <Badge variant="outline" className="gap-1">
              <Moon size={12} /> {record.sleepHours}h
            </Badge>
          )}
          {record.exerciseMinutes > 0 && (
            <Badge variant="outline" className="gap-1">
              <Dumbbell size={12} /> {record.exerciseMinutes} min
            </Badge>
          )}
          <Badge variant="outline" className="gap-1">
            <BarChart3 size={12} /> {adh}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Hábitos</p>
          <div className="space-y-2">
            {(habits as any[]).map((h: any) => (
              <div key={h.id} className="flex items-center gap-3">
                {h.targetType === "check" ? (
                  <Checkbox
                    checked={record.habitChecks[h.id] === true}
                    onCheckedChange={(c) => onUpdate({ habitChecks: { ...record.habitChecks, [h.id]: !!c } })}
                  />
                ) : (
                  <Input
                    type="number"
                    className="w-20 h-8 text-sm"
                    value={typeof record.habitChecks[h.id] === "number" ? (record.habitChecks[h.id] as number) : ""}
                    onChange={(e) => onUpdate({ habitChecks: { ...record.habitChecks, [h.id]: Number(e.target.value) } })}
                  />
                )}
                <span className="text-sm">{h.name}</span>
              </div>
            ))}
          </div>
        </div>

        {(record.noteFeeling || record.noteProcrastination || record.noteGratitude) && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-sm font-medium">Diário</p>
            {record.noteFeeling && <p className="text-sm text-muted-foreground">{record.noteFeeling}</p>}
            {record.noteProcrastination && <p className="text-sm text-muted-foreground">{record.noteProcrastination}</p>}
            {record.noteGratitude && <p className="text-sm text-muted-foreground">{record.noteGratitude}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
