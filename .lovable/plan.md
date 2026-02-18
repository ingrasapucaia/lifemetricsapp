

# Melhorias no Check-in, Metricas e Perfil

---

## 1. Check-in: Unificar "Acordei as" e "Sono" em uma unica caixa

Substituir os dois cards separados ("Acordei as" e "Sono") por um unico card "Sono" com:
- Campo "Dormi as" (input time HH:mm)
- Campo "Acordei as" (input time HH:mm)
- Calculo automatico das horas dormidas exibido abaixo (ex: "7h 30min")
- Remover o campo manual de horas de sono — sera calculado automaticamente
- Adicionar campo `sleepTime` ao `DailyRecord` em `src/types/index.ts`

O calculo leva em conta que "dormi as 23:00, acordei as 06:30" = 7h30min (cruza meia-noite).

Arquivo: `src/types/index.ts`, `src/components/dashboard/CheckIn.tsx`, `src/hooks/useStore.tsx`

---

## 2. Design do seletor de horario "Acordei as" / "Dormi as"

Ambos os campos usarao o mesmo design: dois selects lado a lado (horas 0-23 + minutos 0-59, todos os minutos disponiveis), mesmo estilo dos selects de sono atuais.

Arquivo: `src/components/dashboard/CheckIn.tsx`

---

## 3. Remover caixa "Fitness" do check-in

Excluir o card "Fitness" (linhas 298-321) do CheckIn, ja que exercicios sao registrados nos habitos da categoria "exercicio".

Arquivo: `src/components/dashboard/CheckIn.tsx`

---

## 4. Metricas de vida: exercicio baseado nos habitos

Substituir a metrica fixa "Exercicio total" (que usava `exerciseMinutes` do record) por metricas dinamicas calculadas a partir dos habitos da categoria "exercicio":

| Tipo do habito | Metrica exibida | Exemplo |
|---|---|---|
| minutes ou hours_minutes | Tempo somado do periodo | "Treino: 200min" |
| km | KMs somados do periodo | "Corrida: 45km" |
| miles | Milhas somadas | "Natacao: 10mi" |
| check | Porcentagem padrao | "Leitura: 85%" |

Para habitos "check" (categoria geral ou exercicio), continua exibindo a porcentagem de dias concluidos.

Para habitos com tipo tempo (minutes/hours_minutes), soma o valor numerico registrado no periodo.

Para habitos km/miles, soma os valores numericos.

Os cards de metrica de cada habito visivel mostrarao o valor somado/percentual adequado ao tipo, com sparkline e fundo pastel.

Arquivos: `src/components/dashboard/Metrics.tsx`, `src/lib/metrics.ts`

---

## 5. Perfil: filtrar tipos por categoria

No modal de novo/editar habito, os tipos disponiveis mudam conforme a categoria selecionada:

**Categoria "Exercicio":**
- Horas e minutos
- Quilometros (km)

**Categoria "Geral":**
- Check (sim/nao)
- Contagem
- Horas e minutos

Ao trocar a categoria, se o tipo selecionado nao for compativel, resetar para o primeiro tipo disponivel.

Arquivo: `src/pages/Profile.tsx`

---

## Resumo dos arquivos modificados

| Arquivo | Mudancas |
|---|---|
| `src/types/index.ts` | Adicionar `sleepTime?: string` ao DailyRecord |
| `src/components/dashboard/CheckIn.tsx` | Unificar sono (dormi/acordei + calculo auto), remover Fitness, novo design selects de horario |
| `src/components/dashboard/Metrics.tsx` | Metricas de exercicio dinamicas por tipo de habito (tempo/km/%) |
| `src/lib/metrics.ts` | Funcao para calcular metricas por habito (soma tempo, km, %) |
| `src/pages/Profile.tsx` | Filtrar tipos de habito por categoria |
| `src/hooks/useStore.tsx` | Suporte ao novo campo sleepTime |

