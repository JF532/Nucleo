# Núcleo

**Plataforma Interativa para Aprendizagem de Computação — Estruturas de Dados, Autômatos e mais.**

Cole código C ou monte um autômato e veja a execução passo a passo com explicação, código destacado e estados visuais — com o Professor Ricardo guiando.

---

## Visão Geral

Plataforma dual com abas em `index.html`:

* **Estruturas de Dados** — tema claro, editor C com detecção automática
* **Autômatos Finitos** — tema dark ouro (`css/automata.css`), editor visual SVG `800x520`

Troca via `nav.tabs` (`#tabEstruturas` / `#tabAutomatos`) com `showEstruturas()/showAutomatos()` e suporte a `#automatos`.

---

## 1. Estruturas de Dados em C

Detecção por `js/analyzer/{tokenizer,patterns,scorer,detector}.js` (regex em `struct`, `prox/ant`, `topo`, `esq/dir`, `cor/pai`, sem compilador).

| Estrutura | Sinais |
|---|---|
| Lista simples | `struct No *prox`, `inicio` |
| Lista dupla | `prox` + `ant/prev` |
| Pilha | `topo` + `push/pop` |
| Fila | `inicio` + `fim` + `enqueue/dequeue` |
| Árvore / BST | `esq/dir` + `valor < raiz->valor` |
| Rubro-Negra | `cor + pai + RED/BLACK + rotação` |

Fluxo: `colar código → Analisar → Estrutura detectada → visualização + operações`

Visualização em `js/visualizations/*` + `js/engine/*` (steps/history/memory): listas com `prox/ant→NULL`, pilha `topo ↓`, fila `inicio/fim`, árvores SVG com `NIL` e trilha de descida. Controles `← Anterior | ▶ Executar | Próximo → | Reiniciar` + `Memória simulada`.

---

## 2. Autômatos Finitos

Editor em `js/automata/*` (7 arquivos) — AFD / AFN / AFN-ε.

* **Canvas:** 6 ferramentas `Selecionar ○ Estado → Transição ★ Inicial ◎ Final ⌫ Excluir` (`automata-editor.js` com hit geométrico `r=28/34`, drag, prompt de símbolo com auto-add ao alfabeto)
* **Alfabeto:** chips `Σ` editáveis + auto-sync (`getEffectiveAlphabet` em `automata-state.js`)
* **Linguagem:** `textarea` com inferência `inferLanguage` (`L={"a"}`, `possui ao menos um a`, `termina em ab`, `L ⊆ Σ*`)
* **Formal:** `A=(Q,Σ,δ,q0,F)` e tabela de transições (`toFormal`/`toTableData`)
* **Validação:** `validate` (sem inicial/final, AFD determinismo, ε, símbolo fora, estado isolado)
* **Execução:** `runWord` com `epsilonClosure`, highlight de estados/transições, `wordHighlight`, `execPos`, `exec-history` e resultado `✓/✕` (`automata-engine.js` + `automata-main.js`)
* **Exemplos:** `termina_ab` (triângulo), `par_zeros`, `comeca_1` (2 estados), `contem_101`, `afn_simples` (`possui ao menos um a`, 2 estados), `afn_epsilon`

---

## Como rodar (sem backend)

```bash
git clone https://github.com/<seu-usuario>/Projeto_AED.git
cd Projeto_AED
python -m http.server 8000
# http://localhost:8000
```

---

## Estrutura do projeto

```
/
├── index.html
├── Avatares/ (professor_ricardo.gif + 6 estados)
├── css/ variables.css, layout.css, editor.css, visualizations.css, automata.css
├── js/
│   ├── main.js, editor.js
│   ├── analyzer/ (tokenizer, patterns, scorer, detector)
│   ├── engine/ (steps, history, memory)
│   ├── visualizations/ (list, doubly, stack, queue, tree)
│   └── automata/ (state, examples, engine, validator, renderer, editor, main)
└── .nojekyll
```

---

## Testes

* Lista/Dupla/Pilha/Fila/Árvore/BST/RBT: inserir/remover/buscar, rotações RBT
* Autômatos: `termina_ab` (`ab` ok), `comeca_1` (`10` ok, `0` rejeitado), `afn_simples` (`bab` ok)

---

## Foco

Plataforma para **Ciência da Computação** — extensível para novas disciplinas (Grafos, Compiladores, etc.) além de AED.

---

## Autor

Desenvolvido por **João Filipe** — Projeto educacional **Núcleo**.
