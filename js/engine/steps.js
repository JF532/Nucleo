// Each operation returns { steps: Array<Step>, newState }
 // Step = { titulo, codigo, explicacao, ponteirosAlterados, snapshot, highlightIndex?, activeValue? }

export function stepsListaInserirInicio(estado, valor, meta){
  const steps=[];
  const prox = meta.no.proximo||'prox';
  const inicio = meta.ponteiros.inicio||'inicio';
  const before = [...estado];
  steps.push({
    titulo:'Passo 1 — Alocar novo nó',
    codigo:`No *novo = malloc(sizeof(No));`,
    explicacao:`Alocando memória para o novo nó com valor ${valor}.`,
    ponteirosAlterados:'novo (temporário)',
    snapshot: before,
    tempNode: valor
  });
  steps.push({
    titulo:'Passo 2 — Armazenar valor',
    codigo:`novo->${meta.no.valor||'valor'} = ${valor};`,
    explicacao:`O campo ${meta.no.valor||'valor'} do novo nó recebe ${valor}.`,
    ponteirosAlterados:'—',
    snapshot: before,
    tempNode: valor
  });
  steps.push({
    titulo:'Passo 3 — Apontar para o antigo início',
    codigo:`novo->${prox} = ${inicio};`,
    explicacao:`O campo ${prox} do novo nó passa a apontar para o nó que atualmente está no início da lista.`,
    ponteirosAlterados:`novo->${prox}`,
    snapshot: before,
    tempNode: valor,
    arrowFromTemp: true
  });
  const after = [valor, ...before];
  steps.push({
    titulo:'Passo 4 — Atualizar início',
    codigo:`${inicio} = novo;`,
    explicacao:`O ponteiro ${inicio} passa a apontar para o novo nó. A lista agora começa em ${valor}.`,
    ponteirosAlterados:`${inicio}`,
    snapshot: after
  });
  return { steps, newState: after };
}

export function stepsListaInserirFim(estado, valor, meta){
  const steps=[];
  const prox = meta.no.proximo||'prox';
  const inicio = meta.ponteiros.inicio||'inicio';
  if(estado.length===0){
    return stepsListaInserirInicio(estado, valor, meta);
  }
  steps.push({
    titulo:'Passo 1 — Criar novo nó',
    codigo:`No *novo = malloc(sizeof(No));\nnovo->${meta.no.valor||'valor'} = ${valor};\nnovo->${prox} = NULL;`,
    explicacao:`Criando nó ${valor} com ${prox}=NULL (será o último).`,
    ponteirosAlterados:`novo->${prox}=NULL`,
    snapshot: [...estado],
    tempNode: valor
  });
  steps.push({
    titulo:'Passo 2 — Percorrer até o último',
    codigo:`No *atual = ${inicio};\nwhile(atual->${prox} != NULL) atual = atual->${prox};`,
    explicacao:`Percorrendo a lista até encontrar o último nó (${estado[estado.length-1]}).`,
    ponteirosAlterados:'atual (temporário)',
    snapshot: [...estado],
    highlightIndex: estado.length-1
  });
  const after = [...estado, valor];
  steps.push({
    titulo:'Passo 3 — Encadear',
    codigo:`atual->${prox} = novo;`,
    explicacao:`O último nó passa a apontar para o novo nó.`,
    ponteirosAlterados:`atual->${prox}`,
    snapshot: after
  });
  return { steps, newState: after };
}

export function stepsListaInserirMeio(estado, valor, pos, meta){
  // pos is index where to insert (0..len)
  if(pos<=0) return stepsListaInserirInicio(estado, valor, meta);
  if(pos>=estado.length) return stepsListaInserirFim(estado, valor, meta);
  const prox = meta.no.proximo||'prox';
  const steps=[];
  steps.push({
    titulo:'Passo 1 — Criar novo nó',
    codigo:`No *novo = malloc(sizeof(No));\nnovo->${meta.no.valor||'valor'} = ${valor};`,
    explicacao:`Novo nó ${valor} a ser inserido na posição ${pos}.`,
    ponteirosAlterados:'novo',
    snapshot: [...estado],
    tempNode: valor
  });
  steps.push({
    titulo:'Passo 2 — Encontrar posição',
    codigo:`No *atual = ${meta.ponteiros.inicio||'inicio'};\n// avançar ${pos-1} vezes`,
    explicacao:`Percorrendo até o nó na posição ${pos-1} (valor ${estado[pos-1]}).`,
    ponteirosAlterados:'atual',
    snapshot: [...estado],
    highlightIndex: pos-1
  });
  steps.push({
    titulo:'Passo 3 — Ajustar ponteiro do novo',
    codigo:`novo->${prox} = atual->${prox};`,
    explicacao:`novo->${prox} aponta para o sucessor de atual (${estado[pos]}).`,
    ponteirosAlterados:`novo->${prox}`,
    snapshot: [...estado],
    tempNode: valor,
    arrowFromTemp: true
  });
  const after = [...estado.slice(0,pos), valor, ...estado.slice(pos)];
  steps.push({
    titulo:'Passo 4 — Inserir',
    codigo:`atual->${prox} = novo;`,
    explicacao:`atual->${prox} passa a apontar para o novo nó.`,
    ponteirosAlterados:`atual->${prox}`,
    snapshot: after
  });
  return { steps, newState: after };
}

export function stepsListaRemoverInicio(estado, meta){
  if(estado.length===0) return { steps:[{titulo:'Lista vazia',codigo:'if(inicio==NULL) return;',explicacao:'Nada a remover.',ponteirosAlterados:'—',snapshot:[]}], newState:[] };
  const prox = meta.no.proximo||'prox';
  const inicio = meta.ponteiros.inicio||'inicio';
  const steps=[];
  const removed = estado[0];
  steps.push({
    titulo:'Passo 1 — Guardar nó a remover',
    codigo:`No *tmp = ${inicio};`,
    explicacao:`Guardando referência ao primeiro nó (${removed}).`,
    ponteirosAlterados:'tmp',
    snapshot:[...estado],
    highlightIndex:0
  });
  steps.push({
    titulo:'Passo 2 — Avançar início',
    codigo:`${inicio} = ${inicio}->${prox};`,
    explicacao:`${inicio} passa a apontar para o segundo nó (${estado[1] ?? 'NULL'}).`,
    ponteirosAlterados:`${inicio}`,
    snapshot: estado.slice(1)
  });
  steps.push({
    titulo:'Passo 3 — Liberar memória',
    codigo:`free(tmp);`,
    explicacao:`Memória do nó ${removed} liberada.`,
    ponteirosAlterados:'free(tmp)',
    snapshot: estado.slice(1)
  });
  return { steps, newState: estado.slice(1) };
}

export function stepsListaRemoverFim(estado, meta){
  if(estado.length===0) return stepsListaRemoverInicio(estado, meta);
  if(estado.length===1) return stepsListaRemoverInicio(estado, meta);
  const prox = meta.no.proximo||'prox';
  const steps=[];
  steps.push({
    titulo:'Passo 1 — Percorrer até penúltimo',
    codigo:`No *atual = ${meta.ponteiros.inicio||'inicio'};\nwhile(atual->${prox}->${prox} != NULL) atual = atual->${prox};`,
    explicacao:`Encontrando penúltimo nó (${estado[estado.length-2]}).`,
    ponteirosAlterados:'atual',
    snapshot:[...estado],
    highlightIndex: estado.length-2
  });
  steps.push({
    titulo:'Passo 2 — Desconectar último',
    codigo:`free(atual->${prox});\natual->${prox} = NULL;`,
    explicacao:`Liberando último nó (${estado[estado.length-1]}) e marcando fim com NULL.`,
    ponteirosAlterados:`atual->${prox}=NULL`,
    snapshot: estado.slice(0,-1)
  });
  return { steps, newState: estado.slice(0,-1) };
}

export function stepsListaRemoverMeio(estado, pos, meta){
  if(pos<=0) return stepsListaRemoverInicio(estado, meta);
  if(pos>=estado.length-1) return stepsListaRemoverFim(estado, meta);
  const prox = meta.no.proximo||'prox';
  const steps=[];
  steps.push({
    titulo:'Passo 1 — Encontrar antecessor',
    codigo:`No *atual = ${meta.ponteiros.inicio||'inicio'}; // avançar até ${pos-1}`,
    explicacao:`Localizando nó anterior ao alvo (valor ${estado[pos-1]}).`,
    ponteirosAlterados:'atual',
    snapshot:[...estado],
    highlightIndex: pos-1
  });
  steps.push({
    titulo:'Passo 2 — Guardar alvo',
    codigo:`No *tmp = atual->${prox}; // ${estado[pos]}`,
    explicacao:`Guardando nó a remover (${estado[pos]}).`,
    ponteirosAlterados:'tmp',
    snapshot:[...estado],
    highlightIndex: pos
  });
  steps.push({
    titulo:'Passo 3 — Bypass',
    codigo:`atual->${prox} = tmp->${prox};`,
    explicacao:`Desviando ponteiro: ${estado[pos-1]} passa a apontar para ${estado[pos+1]}.`,
    ponteirosAlterados:`atual->${prox}`,
    snapshot: [...estado.slice(0,pos), ...estado.slice(pos+1)]
  });
  steps.push({
    titulo:'Passo 4 — Liberar',
    codigo:`free(tmp);`,
    explicacao:`Memória de ${estado[pos]} liberada.`,
    ponteirosAlterados:'free',
    snapshot: [...estado.slice(0,pos), ...estado.slice(pos+1)]
  });
  return { steps, newState: [...estado.slice(0,pos), ...estado.slice(pos+1)] };
}

export function stepsBusca(estado, valor){
  const steps=[];
  const idx = estado.indexOf(valor);
  for(let i=0;i<estado.length;i++){
    const found = estado[i]===valor;
    steps.push({
      titulo:`Passo ${i+1} — Comparar ${estado[i]} == ${valor}`,
      codigo:`if(atual->valor == ${valor}) encontrou;`,
      explicacao: found ? `Encontrado! Valor ${valor} na posição ${i}.` : `Valor ${estado[i]} ≠ ${valor}, avançar.`,
      ponteirosAlterados:'atual',
      snapshot:[...estado],
      highlightIndex:i,
      found: found
    });
    if(found) break;
  }
  if(idx===-1){
    steps.push({
      titulo:'Resultado — Não encontrado',
      codigo:`// fim da lista, não encontrado`,
      explicacao:`Valor ${valor} não existe na estrutura.`,
      ponteirosAlterados:'NULL',
      snapshot:[...estado],
      notFound:true
    });
  }
  return { steps, newState: estado };
}

// Duplamente encadeada — reutiliza lógica mas com ant
export function stepsDuplaInserirMeio(estado, valor, pos, meta){
  // estado is array; meta has ant/prox
  if(pos<=0) return stepsListaInserirInicio(estado, valor, meta); // still works visually will show double?
  if(pos>=estado.length) return stepsListaInserirFim(estado, valor, meta);
  const prox = meta.no.proximo||'prox';
  const ant = meta.no.anterior||'ant';
  const steps=[];
  steps.push({
    titulo:'Passo 1 — Criar novo nó',
    codigo:`No *novo = malloc(sizeof(No));\nnovo->${meta.no.valor||'valor'} = ${valor};`,
    explicacao:`Novo nó ${valor}.`,
    ponteirosAlterados:'novo',
    snapshot:[...estado],
    tempNode: valor
  });
  steps.push({
    titulo:'Passo 2 — Localizar atual',
    codigo:`No *atual = inicio; // posição ${pos-1}`,
    explicacao:`Encontrando nó ${estado[pos-1]}.`,
    ponteirosAlterados:'atual',
    snapshot:[...estado],
    highlightIndex:pos-1
  });
  steps.push({
    titulo:'Passo 3 — Ajustar ponteiros do novo',
    codigo:`novo->${ant} = atual;\nnovo->${prox} = atual->${prox};`,
    explicacao:`Novo aponta para antecessor e sucessor.`,
    ponteirosAlterados:`novo->${ant}, novo->${prox}`,
    snapshot:[...estado],
    tempNode: valor
  });
  steps.push({
    titulo:'Passo 4 — Ajustar vizinhos',
    codigo:`atual->${prox}->${ant} = novo;\natual->${prox} = novo;`,
    explicacao:`Vizinhos passam a apontar para o novo nó nos dois sentidos.`,
    ponteirosAlterados:`atual->${prox}->${ant}, atual->${prox}`,
    snapshot:[...estado.slice(0,pos), valor, ...estado.slice(pos)]
  });
  return { steps, newState:[...estado.slice(0,pos), valor, ...estado.slice(pos)] };
}

// Pilha
export function stepsPilhaPush(estado, valor, meta){
  return stepsListaInserirInicio(estado, valor, meta);
}
export function stepsPilhaPop(estado, meta){
  return stepsListaRemoverInicio(estado, meta);
}

// Fila
export function stepsFilaEnqueue(estado, valor, meta){
  return stepsListaInserirFim(estado, valor, meta);
}
export function stepsFilaDequeue(estado, meta){
  return stepsListaRemoverInicio(estado, meta);
}

// Árvore helpers
export function createTreeNode(valor){
  return { valor, esq:null, dir:null };
}
export function insertBST(raiz, valor){
  if(!raiz) return createTreeNode(valor);
  if(valor < raiz.valor) raiz.esq = insertBST(raiz.esq, valor);
  else if(valor > raiz.valor) raiz.dir = insertBST(raiz.dir, valor);
  // if equal, ignore (or go right) - keep simple: ignore duplicates
  return raiz;
}
export function insertBinary(raiz, valor){
  if(!raiz) return createTreeNode(valor);
  // level-order insertion for generic binary tree
  const q=[raiz];
  while(q.length){
    const n=q.shift();
    if(!n.esq){ n.esq=createTreeNode(valor); break; }
    else if(!n.dir){ n.dir=createTreeNode(valor); break; }
    else { q.push(n.esq); q.push(n.dir); }
  }
  return raiz;
}
export function cloneTree(n){
  if(!n) return null;
  return { valor:n.valor, esq: cloneTree(n.esq), dir: cloneTree(n.dir) };
}
export function toArrayInOrder(n, arr=[]){
  if(!n) return arr;
  toArrayInOrder(n.esq, arr);
  arr.push(n.valor);
  toArrayInOrder(n.dir, arr);
  return arr;
}
export function findTree(n, valor){
  if(!n) return null;
  if(n.valor===valor) return n;
  return findTree(n.esq, valor) || findTree(n.dir, valor);
}
export function removeBST(raiz, valor){
  if(!raiz) return null;
  if(valor < raiz.valor) raiz.esq = removeBST(raiz.esq, valor);
  else if(valor > raiz.valor) raiz.dir = removeBST(raiz.dir, valor);
  else {
    if(!raiz.esq) return raiz.dir;
    if(!raiz.dir) return raiz.esq;
    // two children: successor
    let succ = raiz.dir;
    while(succ.esq) succ = succ.esq;
    raiz.valor = succ.valor;
    raiz.dir = removeBST(raiz.dir, succ.valor);
  }
  return raiz;
}

export function stepsTreeInsert(raiz, valor, isBST, meta){
  const steps=[];
  if(!raiz){
    const newRoot = createTreeNode(valor);
    steps.push({
      titulo:'Passo 1 — Criar raiz',
      codigo:`No *novo = malloc(sizeof(No));\nnovo->${meta.no.valor||'valor'}=${valor};`,
      explicacao:`Árvore vazia, ${valor} torna-se raiz.`,
      ponteirosAlterados:'raiz',
      snapshot: cloneTree(newRoot),
      activeValue: valor
    });
    return { steps, newState: newRoot };
  }
  // For BST, show comparisons
  if(isBST){
    let current = raiz;
    let path = [];
    steps.push({
      titulo:'Passo 1 — Iniciar na raiz',
      codigo:`No *atual = raiz; // ${current.valor}`,
      explicacao:`Começando comparação a partir da raiz ${current.valor}.`,
      ponteirosAlterados:'atual',
      snapshot: cloneTree(raiz),
      activeValue: current.valor,
      highlightPath: [current.valor]
    });
    while(true){
      if(valor < current.valor){
        steps.push({
          titulo:`Comparar ${valor} < ${current.valor} → esquerda`,
          codigo:`if(${valor} < atual->${meta.no.valor||'valor'}) atual = atual->${meta.no.esquerda||'esquerda'};`,
          explicacao:`${valor} é menor que ${current.valor}, indo para esquerda.`,
          ponteirosAlterados:`atual->${meta.no.esquerda||'esquerda'}`,
          snapshot: cloneTree(raiz),
          activeValue: current.valor
        });
        if(!current.esq){
          current.esq = createTreeNode(valor);
          steps.push({
            titulo:'Posição encontrada — inserir',
            codigo:`atual->${meta.no.esquerda||'esquerda'} = novo;`,
            explicacao:`Posição vazia à esquerda de ${current.valor}, inserindo ${valor}.`,
            ponteirosAlterados:`atual->${meta.no.esquerda||'esquerda'}`,
            snapshot: cloneTree(raiz),
            activeValue: valor
          });
          break;
        } else {
          current = current.esq;
          steps.push({
            titulo:`Avançar para ${current.valor}`,
            codigo:`atual = atual->${meta.no.esquerda||'esquerda'};`,
            explicacao:`Agora em ${current.valor}, continuar comparação.`,
            ponteirosAlterados:'atual',
            snapshot: cloneTree(raiz),
            activeValue: current.valor
          });
        }
      } else if(valor > current.valor){
        steps.push({
          titulo:`Comparar ${valor} > ${current.valor} → direita`,
          codigo:`if(${valor} > atual->${meta.no.valor||'valor'}) atual = atual->${meta.no.direita||'direita'};`,
          explicacao:`${valor} é maior que ${current.valor}, indo para direita.`,
          ponteirosAlterados:`atual->${meta.no.direita||'direita'}`,
          snapshot: cloneTree(raiz),
          activeValue: current.valor
        });
        if(!current.dir){
          current.dir = createTreeNode(valor);
          steps.push({
            titulo:'Posição encontrada — inserir',
            codigo:`atual->${meta.no.direita||'direita'} = novo;`,
            explicacao:`Posição vazia à direita de ${current.valor}, inserindo ${valor}.`,
            ponteirosAlterados:`atual->${meta.no.direita||'direita'}`,
            snapshot: cloneTree(raiz),
            activeValue: valor
          });
          break;
        } else {
          current = current.dir;
          steps.push({
            titulo:`Avançar para ${current.valor}`,
            codigo:`atual = atual->${meta.no.direita||'direita'};`,
            explicacao:`Agora em ${current.valor}, continuar.`,
            ponteirosAlterados:'atual',
            snapshot: cloneTree(raiz),
            activeValue: current.valor
          });
        }
      } else {
        steps.push({
          titulo:'Valor já existe',
          codigo:`// valor ${valor} já presente`,
          explicacao:`BST não permite duplicatas, operação ignorada.`,
          ponteirosAlterados:'—',
          snapshot: cloneTree(raiz),
          activeValue: current.valor
        });
        break;
      }
    }
    return { steps, newState: raiz };
  } else {
    // generic binary level-order
    steps.push({
      titulo:'Passo 1 — Inserção em árvore binária (nível)',
      codigo:`// inserir ${valor} na primeira posição livre (BFS)`,
      explicacao:`Procurando primeiro espaço vazio em largura.`,
      ponteirosAlterados:'—',
      snapshot: cloneTree(raiz),
      activeValue: null
    });
    insertBinary(raiz, valor);
    steps.push({
      titulo:'Passo 2 — Inserido',
      codigo:`// nó ${valor} inserido`,
      explicacao:`Nó ${valor} alocado e encadeado.`,
      ponteirosAlterados:'pai->esq/dir',
      snapshot: cloneTree(raiz),
      activeValue: valor
    });
    return { steps, newState: raiz };
  }
}

export function stepsTraversal(raiz, ordem){
  // ordem: 'pre','in','pos'
  const result=[];
  const steps=[];
  let counter=0;
  function visit(n){
    if(!n) return;
    if(ordem==='pre'){
      result.push(n.valor);
      counter++;
      steps.push({
        titulo:`Passo ${counter} — Visitar ${n.valor}`,
        codigo: ordem==='pre' ? `visitar(nó); // pré-ordem: nó → esq → dir` : '',
        explicacao: `Visitando ${n.valor} (${ordem}). Resultado parcial: [${result.join(', ')}]`,
        ponteirosAlterados:'—',
        snapshot: cloneTree(raiz),
        activeValue: n.valor,
        resultadoParcial: [...result]
      });
      visit(n.esq); visit(n.dir);
    } else if(ordem==='in'){
      visit(n.esq);
      result.push(n.valor);
      counter++;
      steps.push({
        titulo:`Passo ${counter} — Visitar ${n.valor}`,
        codigo:`in-ordem: esq → nó → dir`,
        explicacao:`Visitando ${n.valor}. Resultado parcial: [${result.join(', ')}]`,
        ponteirosAlterados:'—',
        snapshot: cloneTree(raiz),
        activeValue: n.valor,
        resultadoParcial: [...result]
      });
      visit(n.dir);
    } else if(ordem==='pos'){
      visit(n.esq); visit(n.dir);
      result.push(n.valor);
      counter++;
      steps.push({
        titulo:`Passo ${counter} — Visitar ${n.valor}`,
        codigo:`pós-ordem: esq → dir → nó`,
        explicacao:`Visitando ${n.valor}. Resultado parcial: [${result.join(', ')}]`,
        ponteirosAlterados:'—',
        snapshot: cloneTree(raiz),
        activeValue: n.valor,
        resultadoParcial: [...result]
      });
    }
  }
  visit(raiz);
  if(steps.length===0){
    steps.push({ titulo:'Árvore vazia', codigo:'// nada a percorrer', explicacao:'Nenhum nó.', ponteirosAlterados:'—', snapshot:null, resultadoParcial:[] });
  }
  return { steps, result };
}

export function stepsTreeSearch(raiz, valor, isBST, meta){
  const steps=[];
  if(!raiz){
    steps.push({ titulo:'Árvore vazia', codigo:'if(raiz==NULL) return;', explicacao:'Nada a buscar.', ponteirosAlterados:'—', snapshot:null });
    return { steps, found:false };
  }
  if(isBST){
    let cur=raiz;
    let passo=1;
    while(cur){
      const cmp = valor===cur.valor ? 'igual' : valor < cur.valor ? 'menor' : 'maior';
      steps.push({
        titulo:`Passo ${passo} — Comparar ${valor} com ${cur.valor}`,
        codigo: `if(${valor} ${valor<cur.valor?' < ':' > '} atual->${meta.no.valor||'valor'})`,
        explicacao: cmp==='igual' ? `Encontrado ${valor}!` : `${valor} é ${cmp} que ${cur.valor}, indo para ${valor<cur.valor?'esquerda':'direita'}.`,
        ponteirosAlterados:'atual',
        snapshot: cloneTree(raiz),
        activeValue: cur.valor,
        found: cmp==='igual'
      });
      if(cmp==='igual') return { steps, found:true };
      cur = valor < cur.valor ? cur.esq : cur.dir;
      passo++;
      if(!cur && valor!==steps[steps.length-1].activeValue){
        steps.push({ titulo:'Não encontrado', codigo:'// chegou em NULL', explicacao:`Valor ${valor} não existe na BST.`, ponteirosAlterados:'NULL', snapshot: cloneTree(raiz) });
      }
    }
    return { steps, found:false };
  } else {
    // BFS search for generic
    const q=[raiz];
    let passo=1;
    while(q.length){
      const n=q.shift();
      const found = n.valor===valor;
      steps.push({
        titulo:`Passo ${passo} — Visitar ${n.valor}`,
        codigo:`if(atual->${meta.no.valor||'valor'} == ${valor}) encontrou;`,
        explicacao: found ? `Encontrado ${valor}!` : `Visitando ${n.valor}, não é o alvo.`,
        ponteirosAlterados:'atual',
        snapshot: cloneTree(raiz),
        activeValue: n.valor,
        found
      });
      if(found) return { steps, found:true };
      if(n.esq) q.push(n.esq);
      if(n.dir) q.push(n.dir);
      passo++;
    }
    steps.push({ titulo:'Não encontrado', codigo:'// BFS terminou', explicacao:`Valor ${valor} não encontrado.`, ponteirosAlterados:'—', snapshot: cloneTree(raiz) });
    return { steps, found:false };
  }
}

export function stepsTreeRemove(raiz, valor, meta){
  const steps=[];
  if(!raiz){
    steps.push({ titulo:'Árvore vazia', codigo:'return NULL;', explicacao:'Nada a remover.', ponteirosAlterados:'—', snapshot:null });
    return { steps, newState: null };
  }
  const before = cloneTree(raiz);
  const exists = !!findTree(raiz, valor);
  if(!exists){
    steps.push({ titulo:`Valor ${valor} não encontrado`, codigo:`// não existe`, explicacao:`Não há nó ${valor} para remover.`, ponteirosAlterados:'—', snapshot: before, activeValue: null });
    return { steps, newState: raiz };
  }
  steps.push({
    titulo:`Passo 1 — Localizar ${valor}`,
    codigo:`// buscar nó ${valor}`,
    explicacao:`Localizando nó ${valor} para remoção.`,
    ponteirosAlterados:'atual',
    snapshot: before,
    activeValue: valor
  });
  // clone then remove
  const newRoot = removeBST(cloneTree(raiz), valor);
  steps.push({
    titulo:'Passo 2 — Remover e reorganizar',
    codigo:`// casos: 0/1 filho → bypass, 2 filhos → sucessor`,
    explicacao:`Nó ${valor} removido, árvore reorganizada conforme regras BST.`,
    ponteirosAlterados:'pai->filho',
    snapshot: newRoot,
    activeValue: null
  });
  return { steps, newState: newRoot };
}
