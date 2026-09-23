import { PATTERNS } from './patterns.js';

export function score(tokenized, nodeMeta){
  const lower = tokenized.lower;
  const globalsLow = tokenized.globals.map(g=>g.toLowerCase());
  const funcNames = tokenized.funcNames; // already lower
  const evidencias = {
    lista_simples: [],
    lista_dupla: [],
    pilha: [],
    fila: [],
    arvore_binaria: [],
    bst: [],
    rubro_negra: []
  };
  const scores = {
    lista_simples: 0,
    lista_dupla: 0,
    pilha: 0,
    fila: 0,
    arvore_binaria: 0,
    bst: 0,
    rubro_negra: 0
  };
  function add(tipo, peso, sinal){
    scores[tipo]+=peso;
    evidencias[tipo].push({ sinal, peso });
  }

  // Node field signals
  if(nodeMeta){
    const f = nodeMeta.fields;
    if(f.proximo) {
      add('lista_simples',30,'campo prox/next');
      // dupla só ganha forte se tiver prox+ant
      if(f.anterior) add('lista_dupla',30,'campo prox/next (com ant)');
      else add('lista_dupla',8,'campo prox/next isolado (dupla improvável)');
      add('pilha',10,'campo prox (pilha usa lista)');
      add('fila',10,'campo prox (fila usa lista)');
    }
    if(f.anterior) {
      add('lista_dupla',30,'campo ant/prev');
    }
    if(f.esquerda && f.direita){
      add('arvore_binaria',40,'dois ponteiros esquerda/direita');
      add('bst',22,'dois ponteiros esquerda/direita (base BST)');
      add('rubro_negra',40,'dois ponteiros esq/dir (RBT)');
    } else if(f.esquerda || f.direita){
      add('arvore_binaria',20,'um ponteiro lateral');
      add('bst',12,'um ponteiro lateral (base BST)');
      add('rubro_negra',20,'um ponteiro lateral (RBT)');
    }
    if(f.cor){
      add('rubro_negra',35,'campo cor/color');
      add('bst',5,'campo cor (herda)');
    }
    if(f.pai){
      add('rubro_negra',30,'campo pai/parent');
      add('arvore_binaria',5,'campo pai');
      add('bst',5,'campo pai');
    }
    if(f.esquerda && f.direita && f.cor && f.pai){
      add('rubro_negra',15,'estrutura completa RBT (esq+dir+cor+pai)');
    }
    if(nodeMeta.selfCount>=1){
      add('lista_simples',20,'ponteiro para próprio tipo');
      add('lista_dupla',20,'ponteiro para próprio tipo');
    }
    if(nodeMeta.selfCount>=2){
      add('arvore_binaria',15,'múltiplos ponteiros para próprio tipo');
      add('bst',15,'múltiplos ponteiros para próprio tipo');
    }
  }

  // Global pointers
  const hasTopo = globalsLow.some(g=> PATTERNS.stackPtr.test(g)) || PATTERNS.stackPtr.test(lower);
  // need to check exact global names for stackPtr vs queue
  const hasInicio = globalsLow.some(g=> PATTERNS.queueInicio.test(g));
  const hasFim = globalsLow.some(g=> PATTERNS.queueFim.test(g));

  if(hasTopo){
    // check if global name is topo/top specifically
    const topoGlobals = globalsLow.filter(g=> /(^topo$|^top$)/i.test(g));
    if(topoGlobals.length>0 || /\btopo\b/i.test(lower)) add('pilha',30,'ponteiro topo/top');
  }
  if(hasInicio) {
    add('lista_simples',20,'variável inicio/head');
    add('lista_dupla',10,'variável inicio');
    // fila com apenas inicio ganha menos para não competir com lista simples
    add('fila', hasFim?30:15,'variável inicio/front');
  }
  if(hasFim){
    add('lista_dupla',10,'variável fim/tail');
    add('fila', hasInicio?30:15,'variável fim/rear');
  }
  if(hasInicio && hasFim){
    add('fila',10,'possui inicio e fim simultaneamente');
  }

  // Functions
  const hasPush = funcNames.some(n=> /push|empilhar/.test(n)) || PATTERNS.stackOps.test(lower);
  const stackOpsCount = (lower.match(/\b(push|empilhar)\b/gi)||[]).length + (lower.match(/\b(pop|desempilhar)\b/gi)||[]).length;
  if(stackOpsCount>0){
    // differentiate push/pop individually
    if(/\bpush\b|\bempilhar\b/i.test(lower)) add('pilha',20,'função push/empilhar');
    if(/\bpop\b|\bdesempilhar\b/i.test(lower)) add('pilha',20,'função pop/desempilhar');
  }
  if(/\benqueue\b|\benfileirar\b/i.test(lower)) add('fila',20,'função enqueue/enfileirar');
  if(/\bdequeue\b|\bdesenfileirar\b/i.test(lower)) add('fila',20,'função dequeue/desenfileirar');

  // Pointer assignments patterns
  if(PATTERNS.novoProxTopo.test(tokenized.normalized)) add('pilha',20,'novo->prox = topo');
  if(PATTERNS.fimProxNovo.test(tokenized.normalized)) add('fila',20,'fim->prox = novo');

  // BST compare
  if(PATTERNS.bstCompare.test(tokenized.normalized)){
    add('bst',40,'comparação valor < raiz->valor');
    add('rubro_negra',15,'comparação BST (RBT herda ordenação)');
  }

  // Tree keywords
  if(/\b(raiz|root|arvore|árvore)\b/i.test(lower)){
    add('arvore_binaria',10,'termo raiz/árvore');
    add('bst',10,'termo raiz/árvore');
    add('rubro_negra',10,'termo raiz/árvore');
  }

  // Rubro-Negra específicos
  if(PATTERNS.corNames.test(lower) || /\bint\s+cor\b/i.test(tokenized.normalized) || /cor\s*:/i.test(tokenized.normalized)){
    add('rubro_negra',20,'termo cor');
  }
  if(tokenized.hasRedBlack || /\bRED\b/.test(tokenized.normalized) || /\bBLACK\b/.test(tokenized.normalized)){
    add('rubro_negra',30,'constantes RED/BLACK');
  }
  if(/\b(VERMELHO|PRETO)\b/i.test(lower)){
    add('rubro_negra',25,'VERMELHO/PRETO');
  }
  if(PATTERNS.paiNames.test(lower) || /->\s*pai\s*=/i.test(tokenized.normalized) || /->\s*parent\s*=/i.test(tokenized.normalized)){
    add('rubro_negra',25,'atribuição pai/parent');
  }
  if(PATTERNS.rotacao.test(lower)){
    if(/esquerda|left/i.test(lower)) add('rubro_negra',25,'rotação esquerda');
    if(/direita|right/i.test(lower)) add('rubro_negra',25,'rotação direita');
  }
  if(PATTERNS.corrigir.test(lower) || /corrigir.*insercao|fix.*insert/i.test(tokenized.lower)){
    add('rubro_negra',30,'função corrigir/fixup');
  }
  if(PATTERNS.rbTermo.test(lower)){
    add('rubro_negra',20,'termo rubro-negra');
  }
  if(/raiz.*PRETO|root.*BLACK/i.test(tokenized.normalized)){
    add('rubro_negra',15,'propriedade raiz preta');
  }

  // Compute confiança normalized 0..1 heuristic: score / maxPossible
  const maxPossible = {
    lista_simples: 80,
    lista_dupla: 100,
    pilha: 110,
    fila: 120,
    arvore_binaria: 85,
    bst: 125,
    rubro_negra: 140
  };
  const confiancas = {};
  for(const k of Object.keys(scores)){
    confiancas[k] = Math.min(1, scores[k] / maxPossible[k]);
  }

  return { scores, confiancas, evidencias };
}
