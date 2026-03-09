# Metas de Vida e Projetos Arquivados

## Resumo

Criar um sistema completo de metas/projetos com ações internas, barra de progresso, etiquetas de prioridade coloridas em pastel, e integração com conquistas e arquivo.

---

## Modelo de Dados (`src/types/index.ts`)

Novas interfaces:

```typescript
interface GoalAction {
  id: string;
  title: string;
  completed: boolean;
  priority?: "importante" | "urgente" | "atrasado" | "proximo";
  createdAt: string;
}

interface Goal {
  id: string;
  title: string;
  type: "meta" | "projeto";
  status: "começar" | "em progresso" | "concluída" | "arquivada";
  actions: GoalAction[]; // max 30
  createdAt: string;
  deadline?: string; // yyyy-MM-dd, editável
}
```

Constantes para cores pastel das etiquetas de prioridade:

- prioridade: verde pastel
- urgente: laranja pastel
- atrasado: vermelho pastel
- proximo: amarelo pastel

---

## Store (`src/hooks/useStore.tsx`)

Adicionar estado `goals` com localStorage key `metrics-goals`. Novas funções:

- `addGoal`, `updateGoal`, `deleteGoal`
- `addGoalAction`, `updateGoalAction`, `deleteGoalAction`, `toggleGoalAction`

Quando status muda para "concluída": criar automaticamente uma Achievement na aba conquistas.
Quando status muda para "arquivada": a meta aparece apenas em "Projetos Arquivados".

---

## Página "Metas de Vida" (`src/pages/Goals.tsx`)

- Lista de metas/projetos com etiqueta tipo (meta/projeto), status, barra de progresso (% = ações concluídas / total de ações)
- Botão "Nova meta/projeto" abre modal com: título, tipo (meta/projeto), prazo, status
- Clicar numa meta abre página de detalhe com lista de ações
- Cada ação: checkbox, título, etiqueta de prioridade (colorida pastel), botões editar/apagar
- Barra de progresso 0-100% calculada automaticamente
- Limite de 30 ações por meta

---

## Página "Projetos Arquivados" (`src/pages/ArchivedGoals.tsx`)

- Lista metas com status "arquivada"
- Botão para restaurar (muda status de volta para "começar"), movendo para "Metas de Vida"

---

## Sidebar (`src/components/AppSidebar.tsx`)

Adicionar dois links ao menu:

- "Metas de Vida" (ícone `Target`) entre "Meus Registros" e "Minhas Conquistas"
- "Arquivados" (ícone `Archive`) após "Minhas Conquistas"

---

## Rotas (`src/App.tsx`)

Adicionar:

- `/metas` → Goals
- `/metas/:id` → GoalDetail (detalhe da meta com ações)
- `/arquivados` → ArchivedGoals

---

## Arquivos a criar/modificar


| Arquivo                         | Ação                                            |
| ------------------------------- | ----------------------------------------------- |
| `src/types/index.ts`            | Adicionar Goal, GoalAction, constantes de cores |
| `src/hooks/useStore.tsx`        | Estado goals + CRUD completo                    |
| `src/pages/Goals.tsx`           | Criar - lista de metas                          |
| `src/pages/GoalDetail.tsx`      | Criar - detalhe com ações                       |
| `src/pages/ArchivedGoals.tsx`   | Criar - metas arquivadas                        |
| `src/components/AppSidebar.tsx` | Adicionar links                                 |
| `src/App.tsx`                   | Adicionar rotas                                 |
