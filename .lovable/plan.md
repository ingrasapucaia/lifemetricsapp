

# metrics — Controle de Hábitos e Autoconsciência Guiada

App web completo para check-in diário, acompanhamento de hábitos e insights simulados. Sem backend, sem auth — tudo local com localStorage e dados mock realistas.

---

## Estrutura e Navegação

- **Sidebar fixa** com links: Dashboard, Meus Registros, e Meu Perfil (no rodapé)
- Sidebar colapsável em mobile (drawer/overlay)
- Destaque visual na rota ativa
- Tipografia Inter, tema claro, layout clean e espaçado
- **3 rotas**: `/dashboard`, `/registros`, `/perfil`

---

## Dados e Persistência Local

- Interfaces TypeScript: `Habit`, `DailyRecord`, `UserProfile`
- **Seed inicial**: 6 hábitos ativos + 45 registros diários com variações realistas (humor, sono, exercício, aderência 60-85%)
- Persistência em localStorage; ao carregar, usa seed se vazio
- Botão "resetar dados de demonstração" no perfil

---

## Dashboard (página principal)

### Filtro de Período
- Segmented control: 7 dias / 30 dias / Total

### Check-in do Dia (cards)
- **Humor**: 5 botões (1–5) com toast ao selecionar
- **Sono**: input numérico (step 0.5, 0–12h)
- **Hábitos**: checklist com checkboxes e inputs numéricos conforme tipo; progresso do dia (ex: 4/6); ações "marcar tudo" e "limpar"
- **Exercício**: input de minutos
- **Diário opcional** (colapsável): 3 botões que abrem modais com textarea — "como se sentiu", "procrastinação", "gratidão"
- Autosave com indicador discreto "salvo"

### Métricas do Período
- Cards: aderência média, sono médio, humor médio, exercício total
- **Gráfico 1**: aderência diária (barras) com tooltip
- **Gráfico 2**: sono + humor (linhas duplas)
- Tabela: top 3 e bottom 3 hábitos por consistência

### Insights (micro-orientações simuladas)
- "Resumo do dia" (3-5 bullets baseados nos dados de hoje)
- "Micro-orientações para amanhã" (3 sugestões práticas geradas por regras locais)
- "Padrões do período" (2 correlações simples)
- Botão "gerar insights" com skeleton loading simulado (800-1200ms)
- Empty state se poucos dados no período

---

## Meus Registros

### Visualização
- **Duas abas**: Calendário e Lista
- Calendário mensal com dots nos dias com registro; ao clicar, abre painel lateral com detalhes do dia
- Lista com resumo por registro e botão "ver"

### Painel do Dia
- Resumo em chips (humor, sono, exercício, aderência)
- Hábitos editáveis inline
- Diário com preview e botão editar

### Ações
- Criar novo registro (modal com seletor de data, opção "copiar do dia anterior")
- Editar inline com autosave
- Deletar com modal de confirmação

### Filtros
- Busca por texto nas notas
- Filtro por humor, sono, registro completo
- Chips de filtros ativos com botão limpar
- Empty states para sem registros e sem resultados

---

## Meu Perfil

### Informações
- Nome, objetivo principal, área de foco (select), preferências (início da semana, tom dos insights)

### Hábitos (CRUD)
- Tabela com nome, tipo, meta, ativo (switch), ações (editar/deletar)
- Modal para criar/editar com validações (nome obrigatório, sem duplicados)
- Deletar com confirmação

### Ações Utilitárias
- Exportar dados (JSON com botão copiar)
- Importar dados (textarea + validação)
- Resetar dados de demonstração
- "Limpar dados locais" (reset completo)

---

## Microinterações e UX

- **Toasts** em todas as ações (criar, editar, deletar, importar, erro)
- **Skeleton loading** ao carregar dados e gerar insights
- **Empty states** com CTAs claros
- **Modais de confirmação** para ações destrutivas
- Hover states suaves, animações de expansão/colapso
- Indicador "salvo agora" que desaparece em 1.5s

---

## Atalhos de Teclado

- `G D` → Dashboard, `G R` → Registros, `G P` → Perfil
- `N` → Novo registro, `T` → Ir para hoje, `/` → Focar busca
- `?` → Modal de atalhos
- Indicações em tooltips

