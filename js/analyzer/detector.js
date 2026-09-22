import { tokenize } from './tokenizer.js';
import { extractNodeMeta } from './patterns.js';
import { score } from './scorer.js';

const LABELS = {
  lista_simples: 'Lista simplesmente encadeada',
  lista_dupla: 'Lista duplamente encadeada',
  pilha: 'Pilha',
  fila: 'Fila',
  arvore_binaria: 'Árvore binária',
  bst: 'Árvore binária de busca (BST)'
};

const DESCS = {
  lista_simples: 'Detectamos uma lista simplesmente encadeada porque o nó possui um ponteiro para o próximo e há um ponteiro de início.',
  lista_dupla: 'Detectamos uma lista duplamente encadeada porque o nó possui ponteiros para o próximo e para o elemento anterior.',
  pilha: 'Detectamos uma pilha porque há um ponteiro topo/top e operações push/pop (ou empilhar/desempilhar).',
  fila: 'Detectamos uma fila porque há ponteiros inicio/front e fim/rear com operações enqueue/dequeue.',
  arvore_binaria: 'Detectamos uma árvore binária porque o nó possui dois ponteiros (esquerda/direita).',
  bst: 'Detectamos uma árvore binária de busca (BST) porque há dois ponteiros laterais e regra de ordenação (valor < nó->valor).'
};

export function analyze(code){
  if(!code || !code.trim()){
    return { tipo:null, label:null, descricao:'Código vazio. Cole um código C válido.', confianca:0, scores:{}, evidencias:{}, meta:null, ambiguo:null, _debug:null };
  }
  const tokenized = tokenize(code);
  const nodeMeta = extractNodeMeta(tokenized);
  const { scores, confiancas, evidencias } = score(tokenized, nodeMeta);

  // If no struct found, try to still give ambiguous message
  if(!nodeMeta || tokenized.structs.length===0){
    return {
      tipo: null,
      label: null,
      descricao: 'Não foi possível identificar um struct com ponteiros. Verifique se o código contém `struct No { ... }`.',
      confianca: 0,
      scores, evidencias,
      meta: null,
      ambiguo: null,
      _debug: { scores, evidencias, confiancas, tokenized, nodeMeta }
    };
  }

  // sort by score desc
  const sorted = Object.entries(scores).sort((a,b)=> b[1]-a[1]);
  const top = sorted[0];
  const second = sorted[1];
  const hasSignificant = top[1] > 0;

  let tipo = hasSignificant ? top[0] : null;

  // Special rule: BST only if bst score > arvore and has bstCompare
  // scorer already does; but ensure if bst top but without compare, fallback to arvore
  // Already handled by weights, keep as is.

  // Ambiguity: if diff < 15 and both > 20 (heuristic from spec §12)
  let ambiguo = null;
  if(top && second && hasSignificant && (top[1] - second[1] < 15) && second[1] > 20){
    const top2 = [top[0], second[0]];
    const hasBothPointers = tokenized.globals.some(g=>/inicio|front/i.test(g)) && tokenized.globals.some(g=>/fim|rear/i.test(g));
    if(top2.includes('lista_simples') && top2.includes('fila')){
      // only ambiguous fila vs lista when both inicio and fim exist but no queue ops
      if(hasBothPointers) ambiguo = ['lista_simples','fila'];
    } else if(top2.includes('arvore_binaria') && top2.includes('bst')){
      // only ambiguous if BST compare absent and diff small; otherwise BST is clear
      const hasBSTCompare = /valor\s*[<>]/.test(tokenized.normalized);
      if(!hasBSTCompare){
        // arvore should win clearly when no compare, so don't mark ambiguous if arvore is top
        if(top[0] !== 'arvore_binaria' || (top[1]-second[1] < 8)){
          ambiguo = ['arvore_binaria','bst'];
        }
      } else {
        // with compare, BST should be clear winner; ambiguous only if scores very close (<8)
        if(Math.abs(scores['bst'] - scores['arvore_binaria']) < 8) ambiguo = ['arvore_binaria','bst'];
      }
    } else if(top2.includes('lista_simples') && top2.includes('lista_dupla')){
      const hasAnt = nodeMeta && nodeMeta.fields.anterior;
      if(!hasAnt) {
        // sem ant, lista simples é clara, não ambiguo
        ambiguo = null;
      } else {
        ambiguo = [top[0], second[0]];
      }
    } else if(top2.includes('lista_dupla') && top2.includes('fila')){
      const hasAnt = nodeMeta && nodeMeta.fields.anterior;
      if(hasAnt) ambiguo = null; // dupla com ant é clara
      else ambiguo = [top[0], second[0]];
    } else {
      ambiguo = [top[0], second[0]];
    }
  }

  // If ambiguous but we still choose top, still present message differently? We'll let UI show ambiguous banner if ambiguo even when tipo exists
  // But if ambiguous and diff very small, we still provide tipo as top.

  // If scores all very low (<15), treat as undetermined
  if(!hasSignificant || top[1] < 15){
    return {
      tipo: null,
      label: null,
      descricao: 'Detectamos uma estrutura encadeada, mas não foi possível determinar com segurança qual é.',
      confianca: 0,
      scores, evidencias,
      meta: buildMeta(tipo||'lista_simples', nodeMeta, tokenized),
      ambiguo: sorted.filter(([k,v])=>v>0).slice(0,2).map(([k])=>k),
      _debug: { scores, evidencias, confiancas, tokenized, nodeMeta }
    };
  }

  const meta = buildMeta(tipo, nodeMeta, tokenized);
  return {
    tipo,
    label: LABELS[tipo],
    descricao: DESCS[tipo],
    confianca: confiancas[tipo],
    scores, evidencias,
    meta,
    ambiguo,
    _debug: { scores, evidencias, confiancas, tokenized, nodeMeta }
  };
}

function buildMeta(tipo, nodeMeta, tokenized){
  const f = nodeMeta ? nodeMeta.fields : { valor:'valor', proximo:'prox' };
  const globals = tokenized.globals;
  // helpers to find pointer names
  const findGlobal = (regex, fallback) => {
    const found = globals.find(g=> regex.test(g));
    return found || fallback;
  };
  if(tipo==='pilha'){
    return {
      tipo,
      no: { valor: f.valor||'valor', proximo: f.proximo||'prox' },
      ponteiroPrincipal: findGlobal(/topo|top/i,'topo'),
      ponteiros: { topo: findGlobal(/topo|top/i,'topo') }
    };
  }
  if(tipo==='fila'){
    return {
      tipo,
      no: { valor: f.valor||'valor', proximo: f.proximo||'prox' },
      ponteiros: { inicio: findGlobal(/inicio|front|head/i,'inicio'), fim: findGlobal(/fim|rear|tail/i,'fim') }
    };
  }
  if(tipo==='lista_dupla'){
    return {
      tipo,
      no: { valor: f.valor||'valor', proximo: f.proximo||'prox', anterior: f.anterior||'ant' },
      ponteiros: { inicio: findGlobal(/inicio/i,'inicio'), fim: findGlobal(/fim/i,'fim') }
    };
  }
  if(tipo==='lista_simples'){
    return {
      tipo,
      no: { valor: f.valor||'valor', proximo: f.proximo||'prox' },
      ponteiros: { inicio: findGlobal(/inicio/i,'inicio') }
    };
  }
  if(tipo==='arvore_binaria' || tipo==='bst'){
    return {
      tipo,
      no: { valor: f.valor||'valor', esquerda: f.esquerda||'esquerda', direita: f.direita||'direita' },
      ponteiros: { raiz: findGlobal(/raiz|root/i,'raiz') }
    };
  }
  return { tipo, no: f, ponteiros:{} };
}
