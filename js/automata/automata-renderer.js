const NS='http://www.w3.org/2000/svg';

export function renderAutomata(container, automata, opts={}){
  const { selectedId=null, selectedTransId=null, highlightSet=new Set(), highlightTransIds=new Set(), dragId=null } = opts;
  container.innerHTML='';
  const wrap=document.createElement('div');
  wrap.className='automata-canvas-wrap';
  const svg=document.createElementNS(NS,'svg');
  svg.setAttribute('width','100%');
  svg.setAttribute('height','520');
  svg.setAttribute('viewBox','0 0 800 520');
  svg.style.background='#0B0D0E';
  svg.style.borderRadius='12px';
  // defs arrow
  const defs=document.createElementNS(NS,'defs');
  defs.innerHTML=`
    <marker id="arrAutomata" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#E0C36E"/></marker>
    <marker id="arrAutomataActive" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#D4A017"/></marker>
  `;
  svg.appendChild(defs);

  // group transitions first (under)
  const gEdges=document.createElementNS(NS,'g');
  svg.appendChild(gEdges);
  const gNodes=document.createElementNS(NS,'g');
  svg.appendChild(gNodes);

  // helper to get state pos
  const posMap=new Map(automata.states.map(s=>[s.id,s]));

  // count parallel edges for curve offset — sem bidirecional única (uma indo, uma voltando)
  const pairCount=new Map();
  const undirCount=new Map();
  for(const t of automata.transitions){
    const key=t.from+'|'+t.to;
    const c=pairCount.get(key)||0;
    pairCount.set(key,c+1);
    const uKey=[t.from,t.to].sort().join('|');
    const uc=undirCount.get(uKey)||0;
    undirCount.set(uKey, uc+1);
  }
  const pairIndex=new Map();
  function curveFor(t){
    const key=t.from+'|'+t.to;
    const uKey=[t.from,t.to].sort().join('|');
    const total=pairCount.get(key);
    const uTotal=undirCount.get(uKey);
    // paralelas mesma direção: distribui com mais espaço (não sobrepor) — pedido: mais espaçadas
    if(total>1){
      const idx=pairIndex.get(key)||0;
      pairIndex.set(key, idx+1);
      if(total===2) return idx===0? -28 : 28;
      return (idx - (total-1)/2)*28;
    }
    // bidirecional oposta (ex: q0-0->q1 e q1-0->q0): uma indo, uma voltando com curvas opostas mais abertas
    if(t.from!==t.to && uTotal===2 && pairCount.get(t.from+'|'+t.to)===1 && pairCount.get(t.to+'|'+t.from)===1){
      // usa ordem lexicográfica para definir qual vai pra cima
      return t.from < t.to ? -22 : 22;
    }
    if(t.from!==t.to && uTotal>2){
      // caso raro com múltiplas nos dois sentidos, curva mais aberta
      return t.from < t.to ? -26 : 26;
    }
    return 0;
  }

  // draw transitions
  for(const t of automata.transitions){
    const from=posMap.get(t.from), to=posMap.get(t.to);
    if(!from||!to) continue;
    const isLoop = t.from===t.to;
    const isActive = highlightTransIds.has(t.id);
    const isSelected = t.id===selectedTransId;
    let path, labX, labY;
    if(isLoop){
      const cx=from.x, cy=from.y;
      const loopCurve=curveFor(t);
      // loop arc above — se múltiplos loops no mesmo estado, espalha com offset
      const off=loopCurve!==0 ? loopCurve*0.6 : 0;
      path=`M ${cx-18+off*0.3} ${cy-28} C ${cx-40+off} ${cy-60}, ${cx+40+off} ${cy-60}, ${cx+18+off*0.3} ${cy-28}`;
      labX=cx+off; labY=cy-52;
    } else {
      const dx=to.x-from.x, dy=to.y-from.y;
      const len=Math.hypot(dx,dy)||1;
      const ux=dx/len, uy=dy/len;
      const nx=-uy, ny=ux;
      const curve=curveFor(t);
      const mx=(from.x+to.x)/2 + nx*curve;
      const my=(from.y+to.y)/2 + ny*curve;
      // shorten endpoints by radius
      const rs=28, re=28;
      const sx=from.x + ux*rs + nx*curve*0.2;
      const sy=from.y + uy*rs + ny*curve*0.2;
      const ex=to.x - ux*re - nx*curve*0.2;
      const ey=to.y - uy*re - ny*curve*0.2;
      path=`M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`;
      labX=mx; labY=my-6;
      // se curva, afasta label para não colar (mais espaço solicitado)
      if(curve!==0){ labX+=nx*9; labY+=ny*9; }
    }
    const p=document.createElementNS(NS,'path');
    p.setAttribute('d', path);
    p.setAttribute('fill','none');
    p.setAttribute('stroke', isActive? '#D4A017' : isSelected? '#E0C36E' : '#6B7280');
    p.setAttribute('stroke-width', isActive? '2.8' : '1.8');
    p.setAttribute('marker-end', isActive? 'url(#arrAutomataActive)' : 'url(#arrAutomata)');
    p.setAttribute('class', isActive? 'automata-edge active current' : 'automata-edge');
    p.style.cursor='pointer';
    p.dataset.transId=t.id;
    gEdges.appendChild(p);
    // label
    const txt=document.createElementNS(NS,'text');
    txt.setAttribute('x', labX);
    txt.setAttribute('y', labY);
    txt.setAttribute('text-anchor','middle');
    txt.setAttribute('fill', isActive? '#D4A017' : '#E0C36E');
    txt.setAttribute('font-size','13');
    txt.setAttribute('font-weight','700');
    txt.setAttribute('font-family','ui-monospace, monospace');
    txt.setAttribute('paint-order','stroke');
    txt.setAttribute('stroke','#0B0D0E');
    txt.setAttribute('stroke-width','3');
    txt.style.cursor='pointer';
    txt.dataset.transId=t.id;
    txt.textContent=t.symbol;
    gEdges.appendChild(txt);
    // invisible wider hit area
    const hit=document.createElementNS(NS,'path');
    hit.setAttribute('d', path);
    hit.setAttribute('fill','none');
    hit.setAttribute('stroke','transparent');
    hit.setAttribute('stroke-width','18');
    hit.style.cursor='pointer';
    hit.dataset.transId=t.id;
    gEdges.appendChild(hit);
  }

  // draw states
  for(const s of automata.states){
    const isSelected = s.id===selectedId;
    const isCurrent = highlightSet.has(s.id);
    const g=document.createElementNS(NS,'g');
    g.dataset.stateId=s.id;
    g.style.cursor='grab';
    // hit-area invisível cobre TODO o círculo visual (r=28 normal, 34 final) — garante clique em qualquer ponto interno
    const hitR = s.isFinal ? 34 : 28;
    const hitArea=document.createElementNS(NS,'circle');
    hitArea.setAttribute('cx', s.x);
    hitArea.setAttribute('cy', s.y);
    hitArea.setAttribute('r', hitR);
    hitArea.setAttribute('fill','transparent');
    hitArea.setAttribute('stroke','transparent');
    hitArea.setAttribute('stroke-width','0');
    hitArea.style.cursor='pointer';
    hitArea.setAttribute('pointer-events','all');
    hitArea.dataset.stateId=s.id;
    g.appendChild(hitArea);
    const isInitial = s.id===automata.initialId;
    // initial arrow
    if(isInitial){
      const ax=s.x-46, ay=s.y;
      const line=document.createElementNS(NS,'path');
      line.setAttribute('d', `M ${ax-18} ${ay} L ${ax} ${ay}`);
      line.setAttribute('stroke','#E0C36E');
      line.setAttribute('stroke-width','2');
      line.setAttribute('marker-end','url(#arrAutomata)');
      line.setAttribute('fill','none');
      gNodes.appendChild(line);
    }
    const outer=document.createElementNS(NS,'circle');
    outer.setAttribute('cx', s.x);
    outer.setAttribute('cy', s.y);
    outer.setAttribute('r', s.isFinal? '34' : '28');
    outer.setAttribute('fill', isCurrent? 'rgba(212,160,23,.18)' : isSelected? 'rgba(224,195,110,.12)' : '#181B1D');
    outer.setAttribute('stroke', s.isFinal? '#B8860B' : isSelected? '#E0C36E' : isCurrent? '#D4A017' : '#3F474C');
    outer.setAttribute('stroke-width', isSelected||isCurrent? '2.6' : s.isFinal? '2' : '1.6');
    if(s.isFinal){
      outer.setAttribute('stroke-dasharray','');
    }
    outer.setAttribute('class', isCurrent? 'automata-state current' : isSelected? 'automata-state active' : 'automata-state');
    g.appendChild(outer);
    if(s.isFinal){
      const inner=document.createElementNS(NS,'circle');
      inner.setAttribute('cx', s.x);
      inner.setAttribute('cy', s.y);
      inner.setAttribute('r','26');
      inner.setAttribute('fill','none');
      inner.setAttribute('stroke', isCurrent? '#D4A017' : '#B8860B');
      inner.setAttribute('stroke-width','1.4');
      g.appendChild(inner);
    }
    const txt=document.createElementNS(NS,'text');
    txt.setAttribute('x', s.x);
    txt.setAttribute('y', s.y+5);
    txt.setAttribute('text-anchor','middle');
    txt.setAttribute('fill', isCurrent? '#E0C36E' : '#E8E8E8');
    txt.setAttribute('font-size','13');
    txt.setAttribute('font-weight','700');
    txt.setAttribute('font-family','ui-monospace, monospace');
    txt.textContent=s.id;
    g.appendChild(txt);
    gNodes.appendChild(g);
  }

  container.appendChild(svg);
  return svg;
}
