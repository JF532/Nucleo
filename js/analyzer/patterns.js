export const PATTERNS = {
  nextNames: /(prox|next|seguinte)\b/i,
  prevNames: /(ant|prev|anterior)\b/i,
  leftNames: /(esquerda|left|esq)\b/i,
  rightNames: /(direita|right|dir)\b/i,
  stackPtr: /\b(topo|top|pilha_topo|stack_top)\b/i,
  queueInicio: /\b(inicio|front|head|inicio_fila)\b/i,
  queueFim: /\b(fim|rear|tail|fim_fila)\b/i,
  stackOps: /\b(push|pop|empilhar|desempilhar)\b/i,
  queueOps: /\b(enqueue|dequeue|enfileirar|desenfileirar)\b/i,
  bstCompare: /(valor\s*[<>]=?\s*\w+->valor|\w+->valor\s*[<>]=?\s*valor|if\s*\(\s*\w+\s*[<>])/i,
  novoProxTopo: /novo\s*->\s*(prox|next)\s*=\s*topo/i,
  fimProxNovo: /fim\s*->\s*(prox|next)\s*=\s*novo/i,
};

export function extractNodeMeta(tokenized){
  // find struct with self pointers
  let best = null;
  let maxSelf = -1;
  for(const s of tokenized.structs){
    let selfCount = 0;
    let fields = {};
    for(const f of s.fields){
      const rawLow = f.raw.toLowerCase();
      if(PATTERNS.nextNames.test(rawLow) && f.isPointer) { fields.proximo = f.raw.match(/(\w+)\s*;?\s*$/)?.[1] || 'prox'; selfCount++; }
      if(PATTERNS.prevNames.test(rawLow) && f.isPointer) { fields.anterior = f.raw.match(/(\w+)\s*;?\s*$/)?.[1] || 'ant'; selfCount++; }
      if(PATTERNS.leftNames.test(rawLow) && f.isPointer) { fields.esquerda = f.raw.match(/(\w+)\s*;?\s*$/)?.[1] || 'esquerda'; selfCount++; }
      if(PATTERNS.rightNames.test(rawLow) && f.isPointer) { fields.direita = f.raw.match(/(\w+)\s*;?\s*$/)?.[1] || 'direita'; selfCount++; }
      // generic self ptr detection without naming: if field is pointer to struct and not valor
      if(f.isSelfPtr) selfCount = Math.max(selfCount, 1);
    }
    // also infer field names by raw
    for(const f of s.fields){
      if(f.isPointer){
        const nameMatch = f.raw.match(/\*\s*(\w+)/);
        const fname = nameMatch ? nameMatch[1].toLowerCase() : '';
        if(['prox','next','seguinte','ptr_prox'].includes(fname) && !fields.proximo) fields.proximo = nameMatch[1];
        if(['ant','prev','anterior'].includes(fname) && !fields.anterior) fields.anterior = nameMatch[1];
        if(['esquerda','left','esq'].includes(fname) && !fields.esquerda) fields.esquerda = nameMatch[1];
        if(['direita','right','dir'].includes(fname) && !fields.direita) fields.direita = nameMatch[1];
      }
    }
    // valor field name
    let valorName = 'valor';
    for(const f of s.fields){
      if(/valor|value|dado|info|key|chave/i.test(f.raw) && !f.isPointer){
        const mm = f.raw.match(/(\w+)\s*;?\s*$/);
        if(mm) valorName = mm[1];
      }
    }
    fields.valor = valorName;
    if(selfCount > maxSelf){
      maxSelf = selfCount;
      best = { struct: s, fields, selfCount };
    }
  }
  return best;
}
