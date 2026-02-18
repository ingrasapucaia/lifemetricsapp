

# Melhorias de UX, Design e Funcionalidades

Plano completo com todas as alteracoes solicitadas, organizadas por area.

---

## 1. Fonte DM Sans

Trocar a fonte Inter por **DM Sans** (a fonte do print de referencia) no `src/index.css`.

---

## 2. Mensagem de boas-vindas no Dashboard

Adicionar abaixo do titulo "Dashboard" uma mensagem grande:
**"Seja bem vinda, [nome do perfil]."** usando o `profile.displayName` do store.

Arquivo: `src/pages/Dashboard.tsx`

---

## 3. Etiquetas de humor com palavras neutras

Atualizar labels no `MOOD_TAGS` em `src/types/index.ts`:

| value (interno) | Label atual | Novo label |
|---|---|---|
| feliz | Feliz | Feliz |
| produtiva | Produtiva | Produtividade |
| normal | Normal | Normal |
| ansiosa | Ansiosa | Ansiedade |
| cansada | Cansada | Cansaco |
| emotiva | Emotiva | Emocional |
| triste | Triste | Triste |

Tambem atualizar o mapeamento em `moodToNumber` e a migracao de records legados.

---

## 4. Correcao das horas de sono

O campo de sono usa `step={0.5}` com input numerico, gerando valores como 7.5 (que na verdade representam 7h30min). O problema e a exibicao.

**Solucao:** Substituir o input unico por dois campos separados (horas + minutos, step de 15min) no CheckIn e exibir como "7h 30min" em todos os locais.

Arquivos: `src/components/dashboard/CheckIn.tsx`, `src/components/dashboard/Metrics.tsx`, `src/pages/Records.tsx`

Internamente continua armazenando como numero decimal para compatibilidade, mas a entrada sera via dois campos intuitivos.

---

## 5. Icone do humor no check-in

Trocar `Moon` por `Smile` no card de Humor do CheckIn (mesmo icone usado em "Humor medio" nas metricas).

Arquivo: `src/components/dashboard/CheckIn.tsx`

---

## 6. Agua — correcao de overflow em tablet

Tornar o componente `WaterDrops` responsivo com `flex-wrap` e gotas menores em telas pequenas.

Arquivo: `src/components/dashboard/CheckIn.tsx`

---

## 7. Filtro de periodo abaixo de "Metricas de vida"

Mover o seletor de periodo para dentro do componente `Metrics`, logo abaixo do titulo (que sera renomeado). O Dashboard passa o `period` e `setPeriod` como props.

Arquivos: `src/pages/Dashboard.tsx`, `src/components/dashboard/Metrics.tsx`

---

## 8. Renomear "Metricas do periodo" para "Metricas de vida"

Arquivo: `src/components/dashboard/Metrics.tsx`

---

## 9. "Exercicio geral" vira "Fitness" + tipos de exercicio

### No CheckIn
Renomear o card "Exercicio geral" para "Fitness".

### No modelo de dados (`src/types/index.ts`)
Adicionar ao `Habit.targetType` os novos tipos: `"km"` e `"miles"` (alem dos existentes).

### No Perfil (`src/pages/Profile.tsx`)
Atualizar o seletor de tipo do habito para incluir as novas opcoes:
- Horas e minutos
- Quilometros (km)
- Milhas (miles)

### No CheckIn
Suportar exibicao de inputs adequados para km/miles (input numerico com label "km" ou "mi").

---

## 10. Reordenar habitos no Perfil

Adicionar botoes de seta (cima/baixo) na tabela de habitos para reorganizar a ordem. A ordem e persistida no array do store e refletida no Dashboard.

Arquivos: `src/pages/Profile.tsx`, `src/hooks/useStore.tsx` (adicionar `reorderHabit`)

---

## 11. Conquistas — melhorias

### Tags de areas coloridas em pastel
Cada area da vida recebe uma cor pastel fixa (fundo + dot), similar ao estilo das tags de humor.

### Sentimento como texto livre
Substituir o Select de sentimento por um Input/Textarea para texto livre.

### Seletor de icones
Adicionar campo de selecao de icone (reutilizando o `HABIT_ICONS` + popover) ao criar/editar conquista.

### Editar conquistas
Adicionar botao "Editar" em cada conquista e funcao `updateAchievement` no store.

Arquivos: `src/pages/Achievements.tsx`, `src/hooks/useStore.tsx`, `src/types/index.ts` (adicionar `icon?` ao Achievement)

---

## 12. Metricas — melhorias visuais

### Habitos concluidos — cores pastel
O grafico de barras usara cores pastel variadas por dia (em vez de cor unica).

### Consistencia dos habitos — grafico em pixels
Substituir a tabela top3/bottom3 por um **habit tracker em grid de pixels**: cada habito tem uma linha de quadradinhos (preenchido = dia concluido, vazio = nao), com porcentagem ao lado. Cores pastel por habito.

### Linha do humor — roxo pastel
Mudar a cor da linha de humor no grafico Sono & Humor para roxo claro pastel (`hsl(270, 80%, 75%)`).

### Remover "Humor medio"
Retirar o card de "Humor medio" da secao de metricas somadas.

### Metricas somadas com design colorido e mini-graficos
Redesenhar os cards de metricas (Habitos concluidos, Sono medio, Exercicio total) com:
- Fundo pastel colorido individual
- Mini-grafico circular (progresso) ou sparkline ao lado do valor
- Visual inspirado na imagem de referencia (Calories/Water/Sleep/Weight cards)

### Metricas de todos os habitos
Exibir um card de metrica para cada habito ativo, mostrando valor acumulado/medio e mini-grafico. Cada habito tera opcao de "mostrar/ocultar no dashboard" configuravel no Perfil.

Arquivos: `src/components/dashboard/Metrics.tsx`, `src/pages/Profile.tsx`, `src/hooks/useStore.tsx` (adicionar `preferences.dashboardHabits` ao UserProfile), `src/types/index.ts`

---

## Resumo dos arquivos modificados

| Arquivo | Mudancas |
|---|---|
| `src/index.css` | Fonte DM Sans |
| `src/types/index.ts` | Labels neutros nas tags, tipos km/miles, icon em Achievement, dashboardHabits em UserProfile |
| `src/data/seed.ts` | Atualizar migration de labels se necessario |
| `src/hooks/useStore.tsx` | reorderHabit, updateAchievement, dashboardHabits |
| `src/pages/Dashboard.tsx` | Mensagem boas-vindas, mover filtro para Metrics |
| `src/components/dashboard/CheckIn.tsx` | Icone humor, sono h+min, agua responsiva, Fitness, suporte km/miles |
| `src/components/dashboard/Metrics.tsx` | Titulo "Metricas de vida", filtro inline, remover humor medio, pixel tracker, cores pastel, mini-graficos, cards por habito |
| `src/pages/Profile.tsx` | Reordenar habitos, tipos km/miles, toggle mostrar/ocultar metricas |
| `src/pages/Achievements.tsx` | Tags pastel, texto livre sentimento, icone, editar conquistas |
| `src/pages/Records.tsx` | Exibicao sono h+min |
| `src/lib/insights.ts` | Sem mudancas estruturais (labels neutros propagam automaticamente) |

