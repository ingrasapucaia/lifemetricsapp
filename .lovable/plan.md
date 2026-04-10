

## Plano: Adicionar card "Tarefas concluídas" na tela de Métricas

### Mudanças no arquivo `src/pages/MetricsPage.tsx`

**1. Importar tasks do useStore** (linha 35)
- Adicionar `tasks` ao destructuring: `const { habits, records, goals, tasks } = useStore();`

**2. Importar ícone** (linha 19)
- Adicionar `ListChecks` ao import do Lucide

**3. Novo cálculo `completedTasks`** (após linha 132)
```typescript
const completedTasks = useMemo(() => {
  return tasks.filter(t => {
    if (!t.completed) return false;
    // Filtro de área
    if (areaFilter !== "todas" && t.lifeArea !== areaFilter) return false;
    // Filtro de período
    if (period === "total") return true;
    if (period === "custom" && customStart && customEnd) {
      const d = parseISO(t.date);
      return (isAfter(d, startOfDay(customStart)) || d.getTime() === startOfDay(customStart).getTime()) &&
             (isBefore(d, startOfDay(customEnd)) || d.getTime() === startOfDay(customEnd).getTime());
    }
    const days = period === "7d" ? 7 : 30;
    return isAfter(parseISO(t.date), subDays(new Date(), days));
  }).length;
}, [tasks, areaFilter, period, customStart, customEnd]);
```

**4. Adicionar card no grid** (linha 321)
- Mudar grid para `lg:grid-cols-6` para 6 cards
- Inserir novo card após "Dias ativos":
```tsx
<SummaryCard icon={<ListChecks size={24} />} label="Tarefas concluídas" value={String(completedTasks)} bgColor="hsl(330, 60%, 94%)" iconColor="hsl(330, 50%, 45%)" />
```

### Resumo
- **1 arquivo modificado**: `src/pages/MetricsPage.tsx`
- O card respeita filtros de área e período existentes
- Nenhuma alteração no backend ou outras telas

