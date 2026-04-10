

## Plano: Adicionar card "Dias ativos" e corrigir lógica do streak

### Problema atual do streak (linhas 102-112)
A lógica atual exige que pelo menos um hábito seja **concluído** (`isHabitCompleted`) para contar o dia. Isso ignora registros de sono, humor, ou hábitos parciais (ex: 4km de uma meta de 5km). Precisa ser corrigido para aceitar **qualquer valor registrado**.

### Mudanças no arquivo `src/pages/MetricsPage.tsx`

**1. Novo card "Dias ativos"** (após linha 305)
- Calcular via `useMemo`: contar registros do mês atual onde há qualquer dado (mood não vazio, sleepHours > 0, waterIntake > 0, ou qualquer chave em habitChecks com valor truthy/numérico > 0)
- Exibir como "20 dias" com label "Dias ativos"
- Mesmo estilo dos outros `SummaryCard`, com ícone `CalendarCheck2` do Lucide
- Cores: verde claro (similar ao card de hábitos)

**2. Corrigir lógica do streak** (linhas 102-112)
Substituir a lógica atual que usa `isHabitCompleted` por uma que aceita qualquer registro:
- Um dia conta se: `mood` não vazio, OU `sleepHours > 0`, OU `waterIntake > 0`, OU qualquer valor em `habitChecks` que seja `true` ou número `> 0`
- Manter tolerância de 1 dia (começar de ontem se hoje não tem registro)
- Verificar dias consecutivos reais (checar gaps entre datas)

```typescript
// Nova lógica do streak
const streak = useMemo(() => {
  const recordMap = new Map<string, DailyRecord>();
  records.forEach(r => {
    const hasData = r.mood || r.sleepHours > 0 || r.waterIntake > 0 ||
      Object.values(r.habitChecks).some(v => v === true || (typeof v === 'number' && v > 0));
    if (hasData) recordMap.set(r.date, r);
  });
  
  const today = format(new Date(), "yyyy-MM-dd");
  let checkDate = new Date();
  if (!recordMap.has(today)) {
    checkDate = subDays(checkDate, 1);
  }
  let count = 0;
  while (recordMap.has(format(checkDate, "yyyy-MM-dd"))) {
    count++;
    checkDate = subDays(checkDate, 1);
  }
  return count;
}, [records]);
```

**3. Ajuste no grid** (linha 301)
Mudar de `grid-cols-2 md:grid-cols-3` para `grid-cols-2 md:grid-cols-3 lg:grid-cols-5` para acomodar o 5º card.

### Resumo das alterações
- **1 arquivo modificado**: `src/pages/MetricsPage.tsx`
- Nenhuma alteração no backend, banco de dados, ou outras telas

