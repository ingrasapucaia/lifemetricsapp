# Redesign das Etiquetas de Humor

Baseado na imagem de referencia, as tags de humor devem ser **badges pill com fundo pastel** e um **dot colorido** a esquerda -- estilo similar a labels de status.

---

## O que muda

### 1. Cores mais suaves (pastel) no `MOOD_TAGS` (`src/types/index.ts`)

Atualizar os valores HSL para tons pastel que combinem com a imagem de referencia. Tambem adicionar uma propriedade `bg` (fundo pastel) separada da cor do dot:


| Tag       | Dot (saturado) | Background (pastel)  |
| --------- | -------------- | -------------------- |
| Feliz     | amarelo        | amarelo claro pastel |
| Produtiva | roxo           | roxo claro pastel    |
| Normal    | verde          | verde claro pastel   |
| Ansiosa   | marrom         | marrom claro pastel  |
| Cansada   | laranja        | laranja claro pastel |
| &nbsp;    | &nbsp;         | &nbsp;               |
| Emotiva   | rosa/magenta   | rosa quente pastel   |
| Triste    | azul claro     | azul claro pastel    |


**Nota:** Remova a opção TPM das tags.

### 2. Componente `MoodBadge` reutilizavel

Criar um pequeno componente (ou inline) que renderiza a tag como:

```
[dot colorido] [texto] -- com fundo pastel arredondado (rounded-full, px-3 py-1)
```

### 3. Atualizar todos os pontos de uso

- **CheckIn.tsx** (linhas 124-148): Dropdown de humor -- itens do select com o novo estilo pill
- **Records.tsx** (linha 155-161): Badge na lista de registros
- **Records.tsx** (linhas 257-272): Dropdown rapido no painel do dia
- **Metrics.tsx**: Dots do grafico e tooltip

---

## Arquivos modificados


| Arquivo                                | Mudanca                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/types/index.ts`                   | Atualizar HSL do MOOD_TAGS, adicionar campo `bgHsl` para fundo pastel, adicionar tag "tpm" |
| `src/components/dashboard/CheckIn.tsx` | Estilizar itens do Select com fundo pastel pill                                            |
| `src/pages/Records.tsx`                | Atualizar badges e dropdown do humor                                                       |
| `src/components/dashboard/Metrics.tsx` | Atualizar cores dos dots no grafico                                                        |


Nenhuma mudanca estrutural ou de layout -- apenas cores e estilo das tags de humor.