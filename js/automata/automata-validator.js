export function validate(automata){
  const msgs=[];
  if(!automata.initialId){
    msgs.push({level:'error', msg:'⚠ Nenhum estado inicial foi definido. Use ★ Inicial.'});
  }
  const finals = automata.states.filter(s=>s.isFinal);
  if(finals.length===0){
    msgs.push({level:'warn', msg:'⚠ O autômato não possui estado final. Marque com ◎ Final.'});
  }
  if(automata.states.length===0){
    msgs.push({level:'error', msg:'⚠ Nenhum estado criado. Use ○ Estado e clique no canvas.'});
  }
  // símbolo fora do alfabeto
  for(const t of automata.transitions){
    const sym = t.symbol;
    const isEps = sym==='ε' || sym==='epsilon';
    if(isEps && automata.type!=='AFN-ε'){
      msgs.push({level:'warn', msg:`⚠ Transição ${t.from} → ${t.to} usa ε mas tipo é ${automata.type}. Mude para AFN-ε.`});
    }
    if(!isEps && !automata.alphabet.includes(sym)){
      msgs.push({level:'warn', msg:`⚠ Transição ${t.from} → ${t.to} usa símbolo "${sym}" fora do alfabeto {${automata.alphabet.join(', ')}}.`});
    }
  }
  // AFD duplicata
  if(automata.type==='AFD'){
    const map=new Map();
    for(const t of automata.transitions){
      const key=t.from+'|'+t.symbol;
      if(map.has(key)){
        msgs.push({level:'error', msg:`⚠ AFD inválido: estado ${t.from} possui duas transições com símbolo "${t.symbol}" → ${map.get(key)} e ${t.to}.`});
      } else map.set(key,t.to);
    }
  }
  // estados isolados
  for(const s of automata.states){
    const hasTrans = automata.transitions.some(t=> t.from===s.id || t.to===s.id);
    if(!hasTrans && automata.states.length>1){
      msgs.push({level:'info', msg:`ℹ Estado ${s.id} está isolado (sem transições).`});
    }
  }
  if(msgs.length===0) msgs.push({level:'info', msg:'✓ Autômato válido.'});
  return msgs;
}

export function automataInfo(automata){
  return {
    type: automata.type,
    states: `{${automata.states.map(s=>s.id).join(', ')}}`,
    alphabet: `{${automata.alphabet.join(', ')}}`,
    initial: automata.initialId||'—',
    finals: `{${automata.states.filter(s=>s.isFinal).map(s=>s.id).join(', ')}}`,
    transitionsCount: automata.transitions.length
  };
}
