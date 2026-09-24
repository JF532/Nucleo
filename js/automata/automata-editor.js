import { addState, removeState, renameState, addTransition, removeTransition, setInitial, toggleFinal } from './automata-state.js';
import { renderAutomata } from './automata-renderer.js';

export function createAutomataEditor({ automata, canvasContainer, onChange }){
  let tool='select'; // select | state | trans | initial | final | delete
  let selectedId=null;
  let selectedTransId=null;
  let transFrom=null;
  let highlightSet=new Set();
  let highlightTransIds=new Set();
  let drag=null;
  let mousePos=null;

  function setTool(t){
    tool=t;
    transFrom=null;
    mousePos=null;
    // atualiza cursor do canvas
    if(canvasContainer){
      canvasContainer.querySelector('svg')?.classList.remove('state-mode','trans-mode','select-mode');
      if(t==='state') canvasContainer.querySelector('svg')?.classList.add('state-mode');
      else if(t==='trans') canvasContainer.querySelector('svg')?.classList.add('trans-mode');
      else canvasContainer.querySelector('svg')?.classList.add('select-mode');
    }
    if(onChange) onChange({tool});
    render();
    syncToolbar();
  }
  function syncToolbar(){
    document.querySelectorAll('.tool-btn').forEach(b=>{
      b.classList.toggle('active', b.dataset.tool===tool);
    });
  }
  function setHighlight(set, transSet){
    highlightSet = new Set(set||[]);
    highlightTransIds = new Set(transSet||[]);
    render();
  }
  function clearHighlight(){ setHighlight([],[]); }

  function render(){
    renderAutomata(canvasContainer, automata, { selectedId, selectedTransId, highlightSet, highlightTransIds, dragId: drag?.id||null, pendingFrom: transFrom, mousePos });
    bindSvg();
    if(onChange) onChange({ selectedId, selectedTransId, tool });
  }

  function bindSvg(){
    const svg=canvasContainer.querySelector('svg');
    if(!svg) return;
    // classes cursor
    svg.classList.remove('state-mode','trans-mode','select-mode');
    if(tool==='state') svg.classList.add('state-mode');
    else if(tool==='trans') svg.classList.add('trans-mode');
    else svg.classList.add('select-mode');

    // hit geométrico: cobre TODO o círculo (r=28 normal, 34 final) — independe de overlay/padding
    function stateAtPoint(p){
      let best=null, bestD=Infinity;
      for(const s of automata.states){
        const r = s.isFinal ? 34 : 28;
        const d = Math.hypot(s.x - p.x, s.y - p.y);
        if(d <= r && d < bestD){ best=s; bestD=d; }
      }
      return best ? best.id : null;
    }
    svg.addEventListener('click', (e)=>{
      const pt=svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY;
      const ctmRaw=svg.getScreenCTM();
      if(!ctmRaw) return;
      const ctm=ctmRaw.inverse();
      const p=pt.matrixTransform(ctm);
      const target = e.target;
      const stateG = target.closest('g[data-state-id]');
      const transEl = target.closest('[data-trans-id]');
      // fallback geométrico: se pendingLine ou hit de transição roubou o alvo, ainda encontra estado por distância
      const geomSid = stateAtPoint(p);
      const domSid = stateG ? stateG.dataset.stateId : null;
      const hitSid = geomSid || domSid; // prioriza geométrico (exato círculo)

      // Clique em transição quando em modo delete -> remover transição e voltar para select
      // se houver estado geométrico sob o ponto, prioridade é o estado (círculo cobre todo)
      if(transEl && tool==='delete' && !geomSid){
        const tid=transEl.dataset.transId;
        removeTransition(automata, tid);
        selectedTransId=null; selectedId=null;
        if(onChange) onChange({});
        setTool('select');
        return;
      }

      if(hitSid){
        const sid=hitSid;
        if(tool==='select'){
          selectedId=sid; selectedTransId=null; render(); return;
        }
        if(tool==='delete'){
          // sem confirm, reindex automático
          removeState(automata, sid);
          selectedId=null; selectedTransId=null;
          if(onChange) onChange({});
          setTool('select');
          return;
        }
        if(tool==='initial'){
          setInitial(automata, sid);
          if(onChange) onChange({});
          setTool('select');
          return;
        }
        if(tool==='final'){
          toggleFinal(automata, sid);
          if(onChange) onChange({});
          setTool('select');
          return;
        }
        if(tool==='trans'){
          if(!transFrom){
            transFrom=sid; selectedId=sid; selectedTransId=null;
            render();
          } else {
            const to=sid;
            const from=transFrom;
            const sym=prompt(`Símbolo para ${from} → ${to} (alfabeto: ${automata.alphabet.join(', ')}${automata.type==='AFN-ε'?', ε':''}):`, automata.alphabet[0]||'a');
            if(sym!==null){
              const s=sym.trim();
              if(s){ addTransition(automata, from, to, s); if(onChange) onChange({}); }
            }
            transFrom=null; selectedId=null; selectedTransId=null;
            setTool('select');
          }
          return;
        }
        if(tool==='state'){
          return;
        }
      } else {
        // sem estado sob o ponto — verifica transição apenas se não houver hit geométrico
        if(transEl && tool==='select'){
          const tid=transEl.dataset.transId;
          selectedTransId=tid; selectedId=null;
          render();
          return;
        }
        if(transEl && tool==='delete'){
          const tid=transEl.dataset.transId;
          removeTransition(automata, tid);
          selectedTransId=null; selectedId=null;
          if(onChange) onChange({});
          setTool('select');
          return;
        }
        // fundo
        if(tool==='state'){
          if(p.x<30||p.x>770||p.y<30||p.y>490) return;
          const st=addState(automata, Math.round(p.x), Math.round(p.y));
          selectedId=st.id; if(onChange) onChange({});
          setTool('select');
          return;
        } else if(tool==='trans' && transFrom){
          transFrom=null; selectedId=null;
          setTool('select');
          return;
        } else if(tool==='select' && !transEl){
          selectedId=null; selectedTransId=null; render();
        } else if(tool==='delete'){
          // clicar no vazio em modo delete não faz nada, volta para select
          setTool('select');
        }
      }
    });

    // mousemove para linha pendente em modo trans
    svg.addEventListener('mousemove', (e)=>{
      if(tool==='trans' && transFrom){
        const pt=svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY;
        const ctmRaw=svg.getScreenCTM();
        if(!ctmRaw) return;
        const ctm=ctmRaw.inverse();
        mousePos=pt.matrixTransform(ctm);
        // re-render pendente sem rebind pesado
        const state=automata.states.find(s=>s.id===transFrom);
        if(state){
          // desenha linha pendente via overlay rápido — não intercepta cliques
          let pending=document.getElementById('pendingLine');
          if(!pending){
            pending=document.createElementNS('http://www.w3.org/2000/svg','path');
            pending.id='pendingLine';
            pending.setAttribute('fill','none');
            pending.setAttribute('stroke','#E0C36E');
            pending.setAttribute('stroke-width','1.6');
            pending.setAttribute('stroke-dasharray','6 4');
            pending.setAttribute('opacity','0.9');
            pending.setAttribute('pointer-events','none');
            pending.style.pointerEvents='none';
            svg.appendChild(pending);
          }
          pending.setAttribute('pointer-events','none');
          pending.setAttribute('d',`M ${state.x} ${state.y} L ${mousePos.x} ${mousePos.y}`);
        }
      } else {
        // limpar pending se existir
        const pending=document.getElementById('pendingLine');
        if(pending) pending.remove();
        mousePos=null;
      }
    });

    // double click rename/edit (apenas em select)
    svg.addEventListener('dblclick', (e)=>{
      if(tool!=='select') return;
      const stateG=e.target.closest('g[data-state-id]');
      if(stateG){
        const sid=stateG.dataset.stateId;
        const novo=prompt(`Renomear ${sid} para:`, sid);
        if(novo && novo!==sid){ if(renameState(automata, sid, novo.trim())){ if(selectedId===sid) selectedId=novo.trim(); render(); if(onChange) onChange({}); } else alert('Nome já existe ou inválido'); }
        return;
      }
      const transEl=e.target.closest('[data-trans-id]');
      if(transEl){
        const tid=transEl.dataset.transId;
        const tr=automata.transitions.find(t=>t.id===tid);
        if(tr){
          const novo=prompt(`Editar símbolo ${tr.from} → ${tr.to}:`, tr.symbol);
          if(novo!==null){
            const v=novo.trim()||tr.symbol;
            tr.symbol=v;
            if(v && v!=='ε' && v!=='epsilon' && !automata.alphabet.includes(v)){
              automata.alphabet.push(v);
            }
            render(); if(onChange) onChange({});
          }
        }
      }
    });
    // drag apenas em select
    svg.addEventListener('mousedown', (e)=>{
      if(tool!=='select') return;
      const g=e.target.closest('g[data-state-id]');
      if(!g) return;
      const sid=g.dataset.stateId;
      const st=automata.states.find(s=>s.id===sid);
      if(!st) return;
      drag=st;
      const startPt=svg.createSVGPoint(); startPt.x=e.clientX; startPt.y=e.clientY;
      const ctm=svg.getScreenCTM().inverse();
      let last= startPt.matrixTransform(ctm);
      function onMove(ev){
        const pt=svg.createSVGPoint(); pt.x=ev.clientX; pt.y=ev.clientY;
        const p=pt.matrixTransform(ctm);
        const dx=p.x-last.x, dy=p.y-last.y;
        st.x+=dx; st.y+=dy;
        st.x=Math.max(34, Math.min(766, st.x));
        st.y=Math.max(34, Math.min(486, st.y));
        last=p;
        renderAutomata(canvasContainer, automata, { selectedId, selectedTransId, highlightSet, highlightTransIds, dragId: st.id, pendingFrom: transFrom, mousePos });
        // rebind após drag leve será feito no mouseup
      }
      function onUp(){
        drag=null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        render(); if(onChange) onChange({});
      }
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });
    // right click em transição apenas em delete ou select (mas agora delete é clique, não precisa)
    svg.addEventListener('contextmenu', (e)=>{
      const transEl=e.target.closest('[data-trans-id]');
      if(transEl && tool==='delete'){
        e.preventDefault();
        const tid=transEl.dataset.transId;
        removeTransition(automata, tid); selectedTransId=null; render(); if(onChange) onChange({}); setTool('select');
      } else if(transEl){
        // bloqueia menu para não poluir
        e.preventDefault();
      }
    });
  }

  // keyboard delete apenas em select
  window.addEventListener('keydown', (e)=>{
    if(tool!=='select') return;
    if(e.key==='Delete' || e.key==='Backspace'){
      if(document.activeElement.tagName==='INPUT' || document.activeElement.tagName==='TEXTAREA') return;
      if(selectedTransId){ removeTransition(automata, selectedTransId); selectedTransId=null; render(); if(onChange) onChange({}); }
      else if(selectedId){ removeState(automata, selectedId); selectedId=null; render(); if(onChange) onChange({}); }
    }
  });

  render();
  return { setTool, setHighlight, clearHighlight, getSelected:()=>({selectedId, selectedTransId}), render, setSelected:(id, tid)=>{ selectedId=id; selectedTransId=tid; render(); } };
}
