export function renderPilha(container, snapshot, meta, step){
  container.innerHTML='';
  const isBifurcated = step && step.arrowFromTemp && step.tempNode!==undefined && snapshot.length>0;
  if(snapshot.length===0){
    if(isBifurcated){
      const wrap=document.createElement('div');
      wrap.className='stack-col';
      const topoLab=document.createElement('div');
      topoLab.className='pointer-label';
      topoLab.innerHTML=`${meta.ponteiroPrincipal||meta.ponteiros.topo||'topo'}<span class="pointer-arrow">↓</span>`;
      wrap.appendChild(topoLab);
      const box=document.createElement('div');
      box.className='node-box stack temp active';
      box.innerHTML=`<div class="node-value">${step.tempNode}</div><div class="node-field"><span>${meta.no.proximo||'prox'}</span><b>→ NULL</b></div><div class="node-label">novo</div>`;
      const n=document.createElement('div'); n.className='node stack-node'; n.appendChild(box); wrap.appendChild(n);
      container.appendChild(wrap);
      return;
    }
    container.innerHTML = `<div style="color:var(--text-muted);font-size:13px"><span style="color:var(--accent);font-weight:600">${meta.ponteiroPrincipal||meta.ponteiros.topo||'topo'}</span> → <span class="null-box">NULL</span> (pilha vazia)</div>`;
    return;
  }

  if(isBifurcated){
    const oldHead=snapshot[0];
    const inner=document.createElement('div');
    inner.className='visualization-inner';
    inner.style.position='relative';
    inner.style.display='flex';
    inner.style.flexDirection='column';
    inner.style.alignItems='center';
    const wrap=document.createElement('div');
    wrap.className='stack-col';
    wrap.style.position='relative';
    const topoLab=document.createElement('div');
    topoLab.className='pointer-label';
    topoLab.id='fork-topo-label';
    topoLab.innerHTML=`${meta.ponteiroPrincipal||meta.ponteiros.topo||'topo'}<span class="pointer-arrow">↓</span>`;
    wrap.appendChild(topoLab);
    const tempNode=document.createElement('div');
    tempNode.className='node stack-node';
    tempNode.id='fork-novo-stack';
    const tempBox=document.createElement('div');
    tempBox.className='node-box stack temp active';
    tempBox.id='fork-novo-box-stack';
    tempBox.style.minWidth='128px';
    tempBox.innerHTML=`<div class="node-label">novo</div><div class="node-value">${step.tempNode}</div><div class="node-field" style="font-size:11px;justify-content:center"><span>${meta.no.proximo||'prox'}</span><b style="margin-left:10px">→ ${oldHead}</b></div>`;
    tempNode.appendChild(tempBox);
    wrap.appendChild(tempNode);
    const arrowTemp=document.createElement('div');
    arrowTemp.className='arrow';
    arrowTemp.style.background='var(--warning)';
    arrowTemp.style.opacity='.0';
    wrap.appendChild(arrowTemp);
    snapshot.forEach((valor, idx)=>{
      const node=document.createElement('div');
      node.className='node stack-node';
      if(idx===0) node.id='fork-head-stack';
      const box=document.createElement('div');
      box.className='node-box stack'+(idx===0?' active':'');
      if(idx===0) box.id='fork-head-box-stack';
      box.style.minWidth='128px';
      const nextVal = idx < snapshot.length-1 ? snapshot[idx+1] : 'NULL';
      box.innerHTML=`<div class="node-value">${valor}</div><div class="node-label">${idx===0?'antigo topo':''}</div><div class="node-field" style="font-size:11px;justify-content:center"><span>${meta.no.proximo||'prox'}</span><b style="margin-left:10px">→ ${nextVal}</b></div>`;
      node.appendChild(box);
      wrap.appendChild(node);
      if(idx < snapshot.length-1){
        const arrow=document.createElement('div');
        arrow.className='arrow';
        wrap.appendChild(arrow);
      } else {
        const arr2=document.createElement('div');
        arr2.className='arrow';
        wrap.appendChild(arr2);
        const nullBox=document.createElement('div');
        nullBox.className='null-box';
        nullBox.textContent='NULL';
        wrap.appendChild(nullBox);
      }
    });
    inner.appendChild(wrap);
    const svgNS='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(svgNS,'svg');
    svg.classList.add('fork-svg');
    svg.style.width='100%';
    svg.style.height='80px';
    svg.style.position='absolute';
    svg.style.left='0';
    svg.style.top='0';
    const defs=document.createElementNS(svgNS,'defs');
    defs.innerHTML=`<marker id="arrow-accent-stack" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8"/></marker><marker id="arrow-warning-stack" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b"/></marker>`;
    svg.appendChild(defs);
    const pTopo=document.createElementNS(svgNS,'path');
    pTopo.setAttribute('class','fork-path inicio');
    pTopo.setAttribute('marker-end','url(#arrow-accent-stack)');
    const pNovo=document.createElementNS(svgNS,'path');
    pNovo.setAttribute('class','fork-path novo');
    pNovo.setAttribute('marker-end','url(#arrow-warning-stack)');
    svg.appendChild(pTopo);
    svg.appendChild(pNovo);
    inner.appendChild(svg);
    const label=document.createElement('div');
    label.style.cssText='font-size:10px;color:var(--text-muted);margin-top:8px;text-align:center;border-top:1px dashed var(--border);padding-top:6px';
    label.innerHTML=`<span style="color:var(--accent)">${meta.ponteiroPrincipal||'topo'} → ${oldHead} (esq)</span> &nbsp;|&nbsp; <span style="color:#f59e0b">novo → ${oldHead} (dir)</span> — próximo: <b style="color:var(--accent)">topo → novo</b>`;
    inner.appendChild(label);
    container.appendChild(inner);
    requestAnimationFrame(()=>{
      try{
        const rInner=inner.getBoundingClientRect();
        const rTopo=document.getElementById('fork-topo-label')?.getBoundingClientRect();
        const rNovo=document.getElementById('fork-novo-box-stack')?.getBoundingClientRect();
        const rHead=document.getElementById('fork-head-box-stack')?.getBoundingClientRect();
        if(!rTopo||!rNovo||!rHead) return;
        const xTopo = (rTopo.left + rTopo.width/2) - rInner.left;
        const yTopo = (rTopo.bottom) - rInner.top;
        const xNovo = (rNovo.left + rNovo.width/2) - rInner.left;
        const yNovo = (rNovo.top) - rInner.top - 6;
        const xHead = (rHead.left + rHead.width/2) - rInner.left;
        const yHead = (rHead.top) - rInner.top - 6;
        const xHeadLeft = (rHead.left) - rInner.left - 12;
        const xHeadRight = (rHead.right) - rInner.left + 12;
        // topo -> antigo pela esquerda (L rasante)
        const leftX = xHeadLeft;
        const jy = Math.min(yTopo, yHead) - 10;
        pTopo.setAttribute('d', `M ${xTopo} ${yTopo} L ${xTopo} ${jy} L ${leftX} ${jy} L ${leftX} ${yHead} L ${xHead} ${yHead}`);
        // novo -> antigo pela direita
        const jy2 = yHead - 14;
        const xNovoRight = (rNovo.right) - rInner.left;
        pNovo.setAttribute('d', `M ${xNovoRight} ${yNovo} C ${xHeadRight} ${yNovo}, ${xHeadRight} ${yHead}, ${xHead} ${yHead}`);
        const maxY = Math.max(yTopo, yNovo, yHead) + 20;
        svg.setAttribute('height', maxY+20);
        svg.style.height = (maxY+20)+'px';
      }catch(e){}
    });
    return;
  }

  // normal (não bifurcado) - topo via esquerda
  const inner=document.createElement('div');
  inner.className='visualization-inner';
  inner.style.position='relative';
  inner.style.display='flex';
  inner.style.flexDirection='column';
  inner.style.alignItems='center';
  const wrap = document.createElement('div');
  wrap.className='stack-col';
  wrap.style.position='relative';
  const topoLab = document.createElement('div');
  topoLab.className='pointer-label';
  topoLab.id='stack-topo-label-normal';
  topoLab.innerHTML = `${meta.ponteiroPrincipal||meta.ponteiros.topo||'topo'}<span class="pointer-arrow">↓</span>`;
  wrap.appendChild(topoLab);
  // placeholder for SVG arrow
  const nodesWrap = document.createElement('div');
  nodesWrap.style.display='flex';
  nodesWrap.style.flexDirection='column';
  nodesWrap.style.alignItems='center';
  nodesWrap.style.gap='0';
  snapshot.forEach((valor, idx)=>{
    const node = document.createElement('div');
    node.className='node stack-node';
    if(idx===0) node.id='stack-head-normal';
    const isActive = step && step.highlightIndex===idx;
    const nextVal = idx < snapshot.length-1 ? snapshot[idx+1] : 'NULL';
    const box = document.createElement('div');
    box.className='node-box stack'+(isActive?' active':'');
    if(idx===0) box.id='stack-head-box-normal';
    box.style.minWidth='128px';
    box.innerHTML = `<div class="node-value">${valor}</div><div class="node-label">${idx===0?'topo':''}</div><div class="node-field" style="font-size:11px;justify-content:center"><span>${meta.no.proximo||'prox'}</span><b style="margin-left:10px">→ ${nextVal}</b></div>`;
    node.appendChild(box);
    nodesWrap.appendChild(node);
    if(idx < snapshot.length-1){
      const arrow = document.createElement('div');
      arrow.className='arrow';
      nodesWrap.appendChild(arrow);
    } else {
      const arr2 = document.createElement('div');
      arr2.className='arrow';
      nodesWrap.appendChild(arr2);
      const nullBox = document.createElement('div');
      nullBox.className='null-box';
      nullBox.textContent='NULL';
      nodesWrap.appendChild(nullBox);
    }
  });
  wrap.appendChild(nodesWrap);
  inner.appendChild(wrap);
  const svgNS='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(svgNS,'svg');
  svg.classList.add('fork-svg');
  svg.style.position='absolute';
  svg.style.left='0';
  svg.style.top='0';
  svg.setAttribute('width','100%');
  svg.setAttribute('height','60');
  const defs=document.createElementNS(svgNS,'defs');
  defs.innerHTML=`<marker id="arrow-accent-stack-normal" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8"/></marker>`;
  svg.appendChild(defs);
  const pTopo=document.createElementNS(svgNS,'path');
  pTopo.setAttribute('class','fork-path inicio');
  pTopo.setAttribute('marker-end','url(#arrow-accent-stack-normal)');
  svg.appendChild(pTopo);
  inner.appendChild(svg);
  container.appendChild(inner);
  if(step && step.tempNode!==undefined && !isBifurcated){
    const temp = document.createElement('div');
    temp.style.cssText='margin-top:8px;color:var(--warning);font-size:12px;border:1px dashed var(--warning);padding:6px 10px;border-radius:10px;background:rgba(245,158,11,.08)';
    temp.textContent = `[ ${step.tempNode} ] novo`;
    container.appendChild(temp);
  }
  requestAnimationFrame(()=>{
    try{
      const rInner=inner.getBoundingClientRect();
      const rTopo=document.getElementById('stack-topo-label-normal')?.getBoundingClientRect();
      const rHead=document.getElementById('stack-head-box-normal')?.getBoundingClientRect();
      if(!rTopo||!rHead) return;
      const xTopo=(rTopo.left + rTopo.width/2)-rInner.left;
      const yTopo=rTopo.bottom - rInner.top;
      const xHeadLeft=(rHead.left)-rInner.left - 14;
      const yHead=(rHead.top + rHead.height/2)-rInner.top;
      const jy = Math.min(yTopo, yHead) - 12;
      pTopo.setAttribute('d', `M ${xTopo} ${yTopo} L ${xTopo} ${jy} L ${xHeadLeft} ${jy} L ${xHeadLeft} ${yHead} L ${xHeadLeft+6} ${yHead}`);
      const maxY = Math.max(yTopo, yHead)+20;
      svg.setAttribute('height', maxY+10);
      svg.style.height=(maxY+10)+'px';
    }catch(e){}
  });
}
