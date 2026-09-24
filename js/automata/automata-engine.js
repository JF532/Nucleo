function epsilonClosure(automata, set){
  if(automata.type!=='AFN-ε') return new Set(set);
  const closure=new Set(set);
  const stack=[...set];
  while(stack.length){
    const cur=stack.pop();
    for(const t of automata.transitions){
      if(t.from===cur && (t.symbol==='ε' || t.symbol==='epsilon')){
        if(!closure.has(t.to)){ closure.add(t.to); stack.push(t.to); }
      }
    }
  }
  return closure;
}

function stepFromSet(automata, currentSet, symbol){
  const next=new Set();
  for(const st of currentSet){
    for(const t of automata.transitions){
      if(t.from===st && t.symbol===symbol) next.add(t.to);
    }
  }
  return epsilonClosure(automata, next);
}

export function runWord(automata, word){
  const history=[];
  if(!automata.initialId){
    return { history, accepted:false, reason:'Sem estado inicial.', currentSet: new Set() };
  }
  let current = epsilonClosure(automata, new Set([automata.initialId]));
  history.push({ step:0, symbol:'—', currentSet: new Set(current), nextSet: new Set(current), used:[] });
  const symbols = [...word];
  for(let i=0;i<symbols.length;i++){
    const sym = symbols[i];
    // simbolo fora do alfabeto ainda tenta transitar (vai para conjunto vazio)
    const next = stepFromSet(automata, current, sym);
    const used=[];
    for(const s of current){
      for(const t of automata.transitions){
        if(t.from===s && t.symbol===sym && next.has(t.to)) used.push(t.id);
      }
    }
    // também captura transições ε usadas no fechamento (para visual)
    history.push({ step:i+1, symbol:sym, currentSet: new Set(current), nextSet: new Set(next), used });
    current = next;
    if(current.size===0){
      // permanece vazio até fim
      for(let j=i+1;j<symbols.length;j++){
        history.push({ step:j+1, symbol:symbols[j], currentSet:new Set(), nextSet:new Set(), used:[] });
      }
      break;
    }
  }
  const finals = new Set(automata.states.filter(s=>s.isFinal).map(s=>s.id));
  let accepted=false;
  for(const s of current) if(finals.has(s)) accepted=true;
  let reason='';
  if(accepted){
    reason=`A palavra foi aceita porque${automata.type.startsWith('AFN')?' pelo menos um caminho':''} terminou em estado final {${[...current].filter(s=>finals.has(s)).join(', ')}} após consumir todos os símbolos.`;
  } else {
    if(current.size===0) reason=`Rejeitada: nenhum caminho sobreviveu (transição ausente para símbolo).`;
    else reason=`Rejeitada: após consumir a palavra, estados {${[...current].join(', ')||'∅'}} não contém final {${[...finals].join(', ')||'∅'}}.`;
  }
  return { history, accepted, reason, finalSet: current };
}

export function isWordAccepted(automata, word){
  return runWord(automata, word).accepted;
}
