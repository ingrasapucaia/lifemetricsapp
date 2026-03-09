

# Redesign Visual — Health-Tech Dashboard

Evolucao visual completa mantendo 100% da logica, navegacao e funcionalidades existentes. Inspirado em Apple Health / Oura / Whoop.

---

## Mudancas Globais

### 1. CSS Variables e Paleta (`src/index.css`)
- Refinar background para tom mais quente/suave (similar ao off-white das refs)
- Adicionar variaveis para cores tematicas de metricas:
  - `--metric-habits`: verde suave (168)
  - `--metric-sleep`: roxo/lavanda (270)
  - `--metric-exercise`: laranja dourado (38)
  - `--metric-water`: azul claro (200)
  - `--metric-mood`: rosa suave (330)
- Refinar sombras: trocar `shadow-sm` por sombras mais suaves/difusas
- Adicionar classe utilitaria `shadow-card` com `shadow-[0_2px_12px_rgba(0,0,0,0.04)]`
- Adicionar transicoes suaves globais

### 2. Card Base (`src/components/ui/card.tsx`)
- Aumentar border-radius para `rounded-2xl`
- Aplicar sombra mais suave e difusa
- Borda mais sutil ou sem borda (apenas sombra)
- Transicao hover suave

### 3. Progress Bar (`src/components/ui/progress.tsx`)
- Border-radius mais arredondado
- Altura padrao menor (h-2)
- Gradiente suave no indicador ao inves de cor solida

### 4. Sidebar (`src/components/AppSidebar.tsx`)
- Apenas visual: tipografia refinada, espacamento maior, hover states mais suaves
- Logo com peso visual mais forte
- Separador visual mais sutil

### 5. Layout (`src/components/Layout.tsx`)
- Background com gradiente sutil ou tom mais quente

---

## Dashboard — Saudacao Melhorada (`src/pages/Dashboard.tsx`)

- Titulo "Ola, [nome]" maior e mais impactante (text-3xl font-bold)
- Subtitulo motivador "Seu progresso hoje" ou "Acompanhe sua evolucao"
- Remover "Dashboard" como titulo, substituir pela saudacao elegante
- Adicionar card compacto de "progresso do dia" logo abaixo da saudacao:
  - Progress ring circular (SVG) mostrando % habitos do dia
  - Texto "X de Y habitos" ao lado
  - Fundo pastel com cor tematica

---

## Check-in (`src/components/dashboard/CheckIn.tsx`)

- Cards com `rounded-2xl` e sombras suaves
- Cards de Humor e Sono com fundo pastel tematico sutil
- Card de Agua: gotas com cor mais vibrante, animacao suave
- Card de Habitos: separadores visuais mais claros, checkboxes mais elegantes
- Diario: botoes com cantos mais arredondados
- Secao header "Check-in do dia" com icone e estilo mais refinado

---

## Metricas (`src/components/dashboard/Metrics.tsx`)

- MetricCards: design inspirado nas referencias — valor grande e bold, label menor abaixo, icone no canto com fundo circular pastel
- Sparklines mais visíveis (opacity maior, stroke mais grosso)
- Cards de habitos individuais: fundo pastel por cor, rounded-2xl
- Graficos: tooltip mais elegante, cores mais suaves, grid mais sutil
- Pixel tracker de consistencia: pixels maiores (w-3.5 h-3.5), cantos mais arredondados
- Periodo switcher: mais arredondado, transicao mais suave

---

## Insights (`src/components/dashboard/Insights.tsx`)

- Cards com fundo pastel sutil diferente por tipo
- Icone Sparkles com cor tematica
- Lista com bullets estilizados ou numeracao
- Skeleton loading mais suave

---

## Metas (`src/pages/Goals.tsx`, `src/pages/GoalDetail.tsx`)

- Cards de meta com rounded-2xl, sombras suaves
- Badges mais arredondados (rounded-full)
- Progress bar com gradiente
- GoalDetail: secao de acoes com cards individuais mais elegantes
- Botoes de acao (editar/apagar) com hover states suaves

---

## Conquistas (`src/pages/Achievements.tsx`)

- Stats cards com fundo pastel por tipo (mes/ano/total)
- Cards de conquista com borda lateral colorida ou icone com fundo circular
- Hover state mais elegante

---

## Registros (`src/pages/Records.tsx`)

- Calendario com estilo mais moderno
- Cards de registro na lista com badges mais elegantes
- DayPanel com design mais limpo

---

## Projetos Arquivados (`src/pages/ArchivedGoals.tsx`)

- Cards com estilo consistente ao novo design
- Botao restaurar mais visivel

---

## Perfil (`src/pages/Profile.tsx`)

- Cards com rounded-2xl
- Tabela de habitos: rows com hover mais suave, badges mais elegantes
- Modal: inputs e selects com cantos mais arredondados
- Botoes de acao com cores mais suaves

---

## Arquivos Modificados (apenas visual)

| Arquivo | Mudanca |
|---|---|
| `src/index.css` | Paleta refinada, variaveis tematicas, classe shadow-card |
| `src/components/ui/card.tsx` | rounded-2xl, sombra suave, hover |
| `src/components/ui/progress.tsx` | Gradiente, rounded-full |
| `src/components/ui/badge.tsx` | Rounded-full padrao |
| `src/components/Layout.tsx` | Background refinado |
| `src/components/AppSidebar.tsx` | Tipografia, espacamento, hover |
| `src/pages/Dashboard.tsx` | Saudacao elegante, progress ring do dia |
| `src/components/dashboard/CheckIn.tsx` | Cards pastel, visual refinado |
| `src/components/dashboard/Metrics.tsx` | MetricCards redesenhados, sparklines, graficos |
| `src/components/dashboard/Insights.tsx` | Cards com fundos pastel diferenciados |
| `src/pages/Goals.tsx` | Cards arredondados, badges, sombras |
| `src/pages/GoalDetail.tsx` | Visual refinado |
| `src/pages/ArchivedGoals.tsx` | Estilo consistente |
| `src/pages/Achievements.tsx` | Stats pastel, cards elegantes |
| `src/pages/Records.tsx` | Visual mais moderno |
| `src/pages/Profile.tsx` | Tabela e modais refinados |

Nenhuma logica, funcionalidade, navegacao ou estrutura sera alterada.

