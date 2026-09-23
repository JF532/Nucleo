# VisualizaC

**Visualizador Interativo de Estruturas de Dados em C — focado nas cadeiras de AED (Algoritmos e Estruturas de Dados) da faculdade.**

Projeto educacional, **estático e sem backend**, para relacionar de forma didática:

**CÓDIGO C → ESTRUTURA → PONTEIROS → OPERAÇÃO → VISUALIZAÇÃO**

Cole um código em `C` com `struct` e ponteiros, clique em **Analisar código** e o sistema identifica automaticamente a estrutura, monta a visualização e libera operações passo a passo — sem precisar escolher manualmente “Pilha”, “Fila”, etc.

> Desenvolvido por **João Filipe** — projeto da disciplina de AED. O Professor Ricardo aparece como avatar-guia (`Avatares/professor_ricardo.gif`) nas explicações.

---

## 🎯 Objetivo nas cadeiras de AED

Ajudar estudantes de Ciência da Computação a **ver** o que o código faz com a memória:

* Como `struct No { int valor; struct No *prox; }` forma listas, pilhas, filas e árvores
* Como `malloc`, `prox`, `ant`, `esquerda/direita`, `topo`, `inicio/fim`, `pai` e `cor` alteram ponteiros
* Como cada operação (`inserir`, `remover`, `empilhar`, `enfileirar`, `rotacionar`) muda a estrutura em etapas com código C, explicação e estado dos ponteiros lado a lado

O foco não é compilar C de verdade, mas **interpretar padrões em JavaScript** e simular com uma representação interna segura.

---

## 🧩 Estruturas suportadas

Detecção automática por **tokens, regex e pontuação** (sem compilador completo):

| Estrutura | Sinais principais |
|---|---|
| **Lista simplesmente encadeada** | `struct No *prox` (um ponteiro para o próprio tipo), `inicio` |
| **Lista duplamente encadeada** | `prox` + `ant/prev` |
| **Pilha** | `topo/top` + `push/pop` ou `empilhar/desempilhar` + `novo->prox = topo` |
| **Fila** | `inicio` + `fim` + `enqueue/dequeue` ou `enfileirar/desenfileirar` |
| **Árvore binária** | `esquerda/esq + direita/dir` |
| **Árvore binária de busca (BST)** | árvore + `valor < raiz->valor` (regra de ordenação) |
| **Árvore Rubro-Negra** *(em validação, botão desabilitado)* | `esq/dir + cor + pai + RED/BLACK + rotação + corrigirInsercao` — tratada como estrutura própria, não só “árvore com cor” |

Se o código tiver `inicio+fim+prox` sem funções de fila, o sistema mostra as possibilidades (`Lista` vs `Fila`) em vez de chutar.

---

## ▶️ Fluxo de uso

```
Usuário cola código C
        ↓
Clica em “Analisar código”
        ↓
Sistema analisa (ponteiros, nomes, funções, comparações)
        ↓
Mostra “Estrutura detectada: …”
        ↓
Cria visualização inicial (ex: [10] → [20] → NULL) e libera operações compatíveis
```

Exemplo:

```c
typedef struct No {
    int valor;
    struct No *prox;
} No;
No *inicio = NULL;
```

→ **Lista simplesmente encadeada** → `inicio ↓ [10] → [20] → [30] → NULL`

---

## 🖥️ Como rodar localmente (sem backend)

Projeto 100% estático — compatível com **GitHub Pages**. Para testar localmente precisa de um servidor HTTP por causa dos `ES Modules`:

```bash
# na pasta do projeto (use o atalho sem acento para evitar encoding)
cd "C:\Users\JoaoFilipe\Desktop\Faculdade\PROJETOS\Projeto_AED"
python -m http.server 8000
# abra http://localhost:8000
```

Ou `npx serve .` / Live Server do VS Code. Abrir `file://` direto não funciona para `import`.

---

## 🎨 Visualização e passo a passo

* **Lista/ Dupla:** nós com `valor` + `prox → próximo valor / prox → NULL` (dupla mostra `ant → anterior` também), setas entre nós, `NULL` tracejado, `inicio/fim` com `→` lateral (bem arejado, gap 22px, scroll horizontal fino azul)
* **Pilha:** coluna vertical `topo ↓ [30] → 20 → 10 → NULL` — no estado normal `topo` reto; só no Passo 3 (`novo->prox=topo`) faz **L pela esquerda** para não confundir
* **Fila:** `inicio → [10] → [20] → NULL` com `fim ↑`
* **Árvore/BST/RBT:** SVG hierárquico (`inorder` para `x`, `depth` para `y`), `NIL` como folha preta tracejada, nós com `valor + cor` (`VERMELHO/PRETO` + `R/B`) e `pai` quando RBT
* **Inserção na árvore:** mostra **descida** `50 → 30 → 20` com trilha `highlightPath` e `Descida: 50 → 30` abaixo do SVG

Controles: `[← Anterior] [▶ Executar] [Próximo →] [■ Parar visualização / Reiniciar]` + explicação + código C destacado + `Ponteiros:` + `Memória simulada` com endereços fictícios `0x001`.

Avatares (`Avatares/*.png` 96px, fundo transparente) aparecem em balão saindo do avatar: `Professor Ricardo` (padrão, `professor_ricardo.gif`), `pensando`, `usando_computador`, `joinha`, `comemorando`, `raiva` trocando por contexto; favicon é `acenando.png` croppado.

---

## 🔍 Detecção automática — como funciona

`js/analyzer/tokenizer.js` → `patterns.js` → `scorer.js` → `detector.js`

* Não tenta compilar C. Usa regex para `struct`, campos (`prox/next`, `ant/prev`, `esq/left`, `dir/right`, `cor`, `pai/parent`), variáveis globais (`topo`, `inicio/fim`), funções (`push`, `enqueue`, `rotacaoEsquerda`, `corrigirInsercao`) e comparações `valor < raiz->valor`.
* Cada estrutura ganha pontos (ex: `prox +30`, `ant +30`, `topo+push/pop`, `RED/BLACK +30`). Escolhe maior pontuação com limiar e trata ambiguidade (`lista vs fila` só se `inicio+fim` presentes).

Fácil de estender para debug futuro via `_debug` interno (sem expor pontuação por padrão, conforme pedido).

---

## 🌳 Árvore Rubro-Negra — seção própria

A RBT não é “BST colorida”. Tem **painel dedicado**:

* **5 propriedades** visuais com `✓/✗` interativo (Regras 1-5)
* **Nós** com `valor + PRETO/VERMELHO + R/B`, `NIL` preto
* **Inserção em 5 etapas:** achar posição (BST) → criar vermelho → checar pai → identificar `pai/avô/tio` → Caso A (tio vermelho → recolorir) / Caso B (triangular → rotação) / Caso C (linear → rotação + recolorir) com espelho direita
* **Rotações** à esquerda/direita com destaque de `X/Y`, filho transferido e `pai/raiz`
* **Recoloração** como etapa própria com animação
* **Validação** em tempo real, **remoção** com `duplo preto` e casos do irmão, **travessias** `pré/em/pós` animadas nó a nó
* Comparação `BST vs Rubro-Negra` sobre balanceamento
* Exemplo pronto em `Carregar exemplo` (botão **desabilitado** em validação, para testar antes de liberar)

> Observação pedida: nós com cores reais **vermelho e preto** (não só borda), e botão RBT desabilitado para testes.

---

## 📁 Estrutura do projeto

```
/
├── index.html
├── favicon.ico (+ Avatares/favicon-*.png)
├── Avatares/ (acenando, pensando, usando_computador, joinha, comemorando, raiva, professor_ricardo.gif)
├── css/
│   ├── variables.css
│   ├── layout.css (grid, visualization 460px, scroll formatado, avatar 96px)
│   ├── editor.css (gutter + highlight overlay)
│   └── visualizations.css (nodes, arrows, fork SVG, tree)
├── js/
│   ├── main.js (bootstrap, buildOperations, History, avatar dinâmico, pilha topo reto)
│   ├── editor.js (gutter, highlight.js CDN com fallback, examples)
│   ├── analyzer/ (tokenizer, patterns, scorer, detector)
│   ├── engine/ (steps, history, memory)
│   └── visualizations/ (list, doubly, stack, queue, tree, rbt)
└── .nojekyll (desativa Jekyll no GitHub Pages)
```

Reutiliza `History`, `steps`, `render*`, `memory`, `detector` existentes — nada das outras estruturas foi refeito.

---

## ✅ Testes que o projeto cobre

* Lista: inserir no início/meio/fim, remover início/meio/fim, buscar
* Dupla: idem com `ant/prev` nos dois sentidos
* Pilha: empilhar/desempilhar/consultar topo
* Fila: enfileirar/desenfileirar/consultar início/fim + remover por valor
* Árvore/BST: inserir, remover, buscar, pré/em/pós-ordem
* RBT: 12 cenários — inserção sem violação, tio vermelho, rotação esq/dir, triangular/linear espelhado, recoloração, remoção (duplo preto), travessias, validação das 5 propriedades, botões de passos

---

## 🚀 Deploy no GitHub Pages

Repositório: `JF532/Projeto_AED_Faculdade` (branch `main`). Como é privado, o Pages exige repo **público** no plano Free — torne público em `Settings → Danger Zone → Change visibility` e ative `Settings → Pages → Source: main / root`. O `.nojekyll` já garante que `Avatares/` e `css/js` sejam servidos.

---

## 📚 Foco

Projeto feito **focando nas cadeiras de AED** — para estudar e demonstrar estruturas encadeadas e arbóreas em C de forma visual, interativa e didática, com o Professor Ricardo como guia.

---

## 👤 Autor

Desenvolvido por **João Filipe** — Projeto educacional **VisualizaC**.
