export function createAutomata(){
  return {
    type: 'AFD',
    alphabet: [],
    states: [],
    initialId: null,
    transitions: [],
    nextId: 0,
    languageDesc: ''
  };
}

export function addState(automata, x=100, y=100, name=null){
  const id = name || `q${automata.nextId++}`;
  const st = { id, x, y, isFinal:false };
  automata.states.push(st);
  if(automata.states.length===1) automata.initialId = id;
  return st;
}

export function reindexStates(automata){
  const qPattern = /^q\d+$/;
  if(automata.states.length===0){ automata.nextId=0; return; }
  if(!automata.states.every(s=> qPattern.test(s.id))) {
    // nomes custom: apenas recalcular nextId para max qN +1
    let max=-1;
    for(const s of automata.states){
      const m=s.id.match(/^q(\d+)$/);
      if(m) max=Math.max(max, parseInt(m[1],10));
    }
    automata.nextId = max+1 >= automata.states.length ? max+1 : automata.states.length;
    // garantir nextId não colide
    while(automata.states.some(s=> s.id===`q${automata.nextId}`)) automata.nextId++;
    return;
  }
  const sorted=[...automata.states].sort((a,b)=> parseInt(a.id.slice(1),10)-parseInt(b.id.slice(1),10));
  const map=new Map(sorted.map((s,i)=>[s.id,`q${i}`]));
  for(const s of sorted) s.id=map.get(s.id);
  for(const t of automata.transitions){
    if(map.has(t.from)) t.from=map.get(t.from);
    if(map.has(t.to)) t.to=map.get(t.to);
  }
  if(map.has(automata.initialId)) automata.initialId=map.get(automata.initialId);
  automata.nextId=automata.states.length;
}

export function removeState(automata, id){
  automata.states = automata.states.filter(s=>s.id!==id);
  if(automata.initialId===id) automata.initialId = automata.states[0]?.id || null;
  automata.transitions = automata.transitions.filter(t=> t.from!==id && t.to!==id);
  reindexStates(automata);
}

export function renameState(automata, oldId, newId){
  if(!newId || automata.states.some(s=>s.id===newId)) return false;
  automata.states.forEach(s=>{ if(s.id===oldId) s.id=newId; });
  if(automata.initialId===oldId) automata.initialId=newId;
  automata.transitions.forEach(t=>{ if(t.from===oldId) t.from=newId; if(t.to===oldId) t.to=newId; });
  return true;
}

export function getEffectiveAlphabet(automata){
  const set=new Set([...automata.alphabet]);
  for(const t of automata.transitions){
    if(t.symbol!=='ε' && t.symbol!=='epsilon') set.add(t.symbol);
  }
  if(automata.type==='AFN-ε' && !set.has('ε')) set.add('ε');
  return [...set];
}

export function addTransition(automata, from, to, symbol){
  const id = `t${Date.now()}${Math.random().toString(36).slice(2,5)}`;
  const tr = { id, from, to, symbol };
  automata.transitions.push(tr);
  // auto-sincroniza alfabeto: se símbolo novo, adiciona aos chips
  if(symbol && symbol!=='ε' && symbol!=='epsilon' && !automata.alphabet.includes(symbol)){
    automata.alphabet.push(symbol);
  }
  return tr;
}

export function removeTransition(automata, id){
  automata.transitions = automata.transitions.filter(t=>t.id!==id);
}

export function setInitial(automata, id){
  if(automata.states.some(s=>s.id===id)) automata.initialId=id;
}

export function toggleFinal(automata, id){
  const s = automata.states.find(s=>s.id===id);
  if(s) s.isFinal = !s.isFinal;
}

export function toFormal(automata){
  const effective=getEffectiveAlphabet(automata);
  const Q = `{${automata.states.map(s=>s.id).join(', ')}}`;
  const Sigma = effective.length ? `{${effective.join(', ')}}` : '∅';
  const q0 = automata.initialId || '—';
  const F = `{${automata.states.filter(s=>s.isFinal).map(s=>s.id).join(', ')}}`;
  let delta='';
  for(const s of automata.states){
    for(const sym of effective){
      const tos = automata.transitions.filter(t=> t.from===s.id && t.symbol===sym).map(t=>t.to);
      if(tos.length) delta += `δ(${s.id}, ${sym}) = ${tos.length===1? tos[0] : `{${tos.join(', ')}}`}\n`;
    }
  }
  return `A = (Q, Σ, δ, q0, F)\nQ = ${Q}\nΣ = ${Sigma}\nq0 = ${q0}\nF = ${F}\n\n${delta.trim()||'δ: (sem transições)'}`;
}

export function toTableData(automata){
  const syms = getEffectiveAlphabet(automata);
  const rows = automata.states.map(s=>{
    const cols={};
    for(const sym of syms){
      const tos = automata.transitions.filter(t=> t.from===s.id && t.symbol===sym).map(t=>t.to);
      cols[sym]= tos.length? (tos.length===1? tos[0]: `{${tos.join(',')}}`) : '—';
    }
    return { id:s.id, isInitial: s.id===automata.initialId, isFinal:s.isFinal, cols };
  });
  return { syms, rows };
}

export function inferLanguage(automata){
  const states=automata.states;
  const effective=getEffectiveAlphabet(automata).filter(s=>s!=='ε'&&s!=='epsilon');
  if(states.length===0) return 'L = ∅';
  const sigmaStr = effective.length ? `{${effective.join(', ')}}` : 'Σ';
  if(automata.initialId && states.some(s=>s.isFinal)){
    const finals=states.filter(s=>s.isFinal);
    // 1ª opção do usuário: palavra exata L={"word"} quando cadeia linear sem laços/loops
    if(finals.length===1 && automata.transitions.length===states.length-1){
      const visited=new Set();
      let cur=automata.initialId;
      let seq=[];
      let ok=true;
      for(let i=0;i<states.length-1;i++){
        if(visited.has(cur)){ ok=false; break; }
        visited.add(cur);
        const outs=automata.transitions.filter(t=>t.from===cur);
        if(outs.length!==1){ ok=false; break; }
        // sem laço no cur além da transição da cadeia
        if(automata.transitions.some(t=> t.from===cur && t.to===cur)){ ok=false; break; }
        seq.push(outs[0].symbol);
        cur=outs[0].to;
        if(!states.some(s=>s.id===cur)){ ok=false; break; }
      }
      // final também sem laço
      if(ok && cur===finals[0].id && visited.size===states.length-1 && !automata.transitions.some(t=> t.from===cur && t.to===cur)){
        const word=seq.join('');
        if(word.length>0){
          // verifica se não há transições extras escondidas (já garantido por |T|==|Q|-1)
          return `L = {"${word}"}`;
        }
      }
    }
    // padrão "possui ao menos um a" tem prioridade sobre termina (evita falso termina em a para AFN)
    const possuiUm = (() => {
      if(effective.length!==2 || !effective.includes('a') || !effective.includes('b')) return null;
      const q0=automata.initialId;
      if(!automata.transitions.some(t=> t.from===q0 && t.to===q0 && t.symbol==='b')) return null;
      const finals=states.filter(s=>s.isFinal);
      if(finals.length===0) return null;
      // existe a-transição de q0 para finais
      if(!automata.transitions.some(t=> t.from===q0 && finals.some(f=>f.id===t.to) && t.symbol==='a')) return null;
      // finais têm loops a/b (sink final)
      for(const f of finals){
        if(!automata.transitions.some(t=> t.from===f.id && t.to===f.id && t.symbol==='a')) return null;
        if(!automata.transitions.some(t=> t.from===f.id && t.to===f.id && t.symbol==='b')) return null;
      }
      return 'L = { w ∈ {a,b}* | w possui ao menos um a }';
    })();
    if(possuiUm) return possuiUm;
    // se houver transições de prefixo em q0 cobrindo Σ, então termina em (mas evita classificar "começa com" como termina)
    const hasPrefixLoops = (() => {
      if(!automata.initialId || effective.length===0) return false;
      const q0=automata.initialId;
      for(const sym of effective){
        if(!automata.transitions.some(t=> t.from===q0 && t.symbol===sym)) return false;
      }
      return true;
    })();
    const isComeçaPattern = (() => {
      // começa com: q0 tem 1 transição para final sink (loops) e outra para sink não final
      if(finals.length!==1) return false;
      const q0=automata.initialId;
      const finalsSink = finals.every(f=> effective.every(sym=> automata.transitions.some(t=> t.from===f.id && t.to===f.id && t.symbol===sym)));
      if(!finalsSink) return false;
      const nonFinals=states.filter(s=> !s.isFinal);
      // existe sink não final com loops
      const hasSinkReject = nonFinals.some(s=> effective.every(sym=> automata.transitions.some(t=> t.from===s.id && t.to===s.id && t.symbol===sym)));
      return hasSinkReject;
    })();
    const finalsAreSink = finals.every(f=> effective.every(sym=> automata.transitions.some(t=> t.from===f.id && t.to===f.id && t.symbol===sym)));
    if(hasPrefixLoops && !isComeçaPattern && !finalsAreSink){
      const queue=[[automata.initialId, []]];
      const seen=new Set([automata.initialId]);
      let best=null;
      while(queue.length){
        const [node, path]=queue.shift();
        if(finals.some(f=>f.id===node)){ best=path; break; }
        for(const t of automata.transitions.filter(t=>t.from===node)){
          if(!seen.has(t.to)){
            seen.add(t.to);
            queue.push([t.to, [...path, t.symbol]]);
          }
        }
      }
      if(best && best.length>0 && best.length<=4){
        return `Aceitar palavras que terminam em ${best.join('')}`;
      }
    }
  }
  // fallback genérico baseado no tipo e alfabeto
  return `L ⊆ ${sigmaStr}*`;
}
