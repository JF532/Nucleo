export function renderFila(container, snapshot, meta, step){
  container.innerHTML='';
  const isBifurcated = step && step.arrowFromTemp && step.tempNode!==undefined && snapshot.length>0;
  if(snapshot.length===0){
    if(isBifurcated){
      const wrap=document.createElement('div');
      wrap.className='nodes-row';
      const tempBox=document.createElement('div');
      tempBox.className='node-box temp active';
      tempBox.innerHTML=`<div class="node-value">${step.tempNode}</div><div class="node-field"><span>${meta.no.proximo||'prox'}</span><b>→ NULL</b></div>`;
      const n=document.createElement('div'); n.className='node'; n.appendChild(tempBox); wrap.appendChild(n);
      container.appendChild(wrap);
      return;
    }
    container.innerHTML = `<div style="color:var(--text-muted);font-size:13px">
      <span style="color:var(--accent);font-weight:600">${meta.ponteiros.inicio||'inicio'}</span> → <span class="null-box">NULL</span> &nbsp;
      <span style="color:#a78bfa;font-weight:600">${meta.ponteiros.fim||'fim'}</span> → NULL (fila vazia)</div>`;
    return;
  }

  if(isBifurcated){
    const oldHead=snapshot[0];
    const inner=document.createElement('div');
    inner.className='visualization-inner';
    inner.style.position='relative';
    inner.style.paddingTop='28px';
    const row=document.createElement('div');
    row.className='nodes-row';
    row.style.position='relative';
    const inicioCol=document.createElement('div');
    inicioCol.style.cssText='display:flex;flex-direction:column;align-items:center;gap:2px;margin-right:6px;min-width:56px';
    inicioCol.id='fork-inicio-col-queue';
    inicioCol.innerHTML=`<span class="pointer-label" id="fork-inicio-label-queue" style="color:var(--accent)">${meta.ponteiros.inicio||'inicio'}</span>`;
    row.appendChild(inicioCol);
    snapshot.forEach((valor, idx)=>{
      const node=document.createElement('div');
      node.className='node';
      if(idx===0) node.id='fork-head-queue';
      const box=document.createElement('div');
      box.className='node-box'+(idx===0?' active':'');
      if(idx===0) box.id='fork-head-box-queue';
      box.style.minWidth='128px';
      if(idx===snapshot.length-1) box.style.borderColor='#a78bfa';
      const nextVal= idx<snapshot.length-1 ? snapshot[idx+1] : 'NULL';
      box.innerHTML=`<div class="node-value">${valor}</div><div class="node-field"><span>${meta.no.proximo||'prox'}</span><b>→ ${nextVal}</b></div>`;
      if(idx===snapshot.length-1){
        const fimLab=document.createElement('div');
        fimLab.style.cssText='font-size:11px;color:#a78bfa;font-weight:600;margin-top:4px';
        fimLab.innerHTML=`↑<br>${meta.ponteiros.fim||'fim'}`;
        fimLab.style.textAlign='center';
        node.appendChild(box);
        node.appendChild(fimLab);
      } else node.appendChild(box);
      row.appendChild(node);
      if(idx < snapshot.length-1){
        const arr=document.createElement('div');
        arr.className='arrow';
        row.appendChild(arr);
      } else {
        const nullBox=document.createElement('div');
        nullBox.className='null-box';
        nullBox.textContent='NULL';
        nullBox.style.marginLeft='10px';
        row.appendChild(nullBox);
      }
    });
    inner.appendChild(row);
    const below=document.createElement('div');
    below.style.cssText='display:flex;align-items:center;gap:18px;margin-top:28px;position:relative;left:0';
    below.id='fork-below-queue';
    const novoNode=document.createElement('div');
    novoNode.className='node';
    novoNode.id='fork-novo-queue';
    const novoBox=document.createElement('div');
    novoBox.className='node-box temp active';
    novoBox.id='fork-novo-box-queue';
    novoBox.style.minWidth='128px';
    novoBox.innerHTML=`<div class="node-label">novo</div><div class="node-value">${step.tempNode}</div><div class="node-field"><span>${meta.no.proximo||'prox'}</span><b>→ ${oldHead}</b></div>`;
    novoNode.appendChild(novoBox);
    below.appendChild(novoNode);
    const novoArrow=document.createElement('div');
    novoArrow.style.cssText='font-size:11px;color:var(--warning)';
    novoArrow.innerHTML=`<span style="color:var(--warning)">↗</span> <span style="color:var(--warning)">prox → ${oldHead}</span>`;
    below.appendChild(novoArrow);
    inner.appendChild(below);
    const svgNS='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(svgNS,'svg');
    svg.classList.add('fork-svg');
    svg.style.height='90px';
    svg.style.top='0';
    svg.setAttribute('width','100%');
    svg.setAttribute('height','90');
    const defs=document.createElementNS(svgNS,'defs');
    defs.innerHTML=`<marker id="arrow-accent-queue2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8"/></marker><marker id="arrow-warning-queue2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b"/></marker>`;
    svg.appendChild(defs);
    const pInicioNovo=document.createElementNS(svgNS,'path');
    pInicioNovo.setAttribute('class','fork-path inicio');
    pInicioNovo.setAttribute('marker-end','url(#arrow-accent-queue2)');
    const pInicioHead=document.createElementNS(svgNS,'path');
    pInicioHead.setAttribute('class','fork-path inicio');
    pInicioHead.setAttribute('marker-end','url(#arrow-accent-queue2)');
    pInicioHead.style.strokeDasharray='5 5';
    pInicioHead.style.opacity='0.7';
    const pNovoHead=document.createElementNS(svgNS,'path');
    pNovoHead.setAttribute('class','fork-path novo');
    pNovoHead.setAttribute('marker-end','url(#arrow-warning-queue2)');
    svg.appendChild(pInicioNovo); svg.appendChild(pInicioHead); svg.appendChild(pNovoHead);
    inner.appendChild(svg);
    const label=document.createElement('div');
    label.style.cssText='font-size:10px;color:var(--text-muted);margin-top:6px;margin-left:4px;border-left:2px dashed var(--border);padding-left:8px';
    label.innerHTML=`<span style="color:var(--accent)">${meta.ponteiros.inicio||'inicio'} → novo (L)</span> &nbsp;|&nbsp; <span style="color:var(--accent);opacity:0.7">${meta.ponteiros.inicio||'inicio'} → ${oldHead}</span> &nbsp;|&nbsp; <span style="color:#f59e0b">novo → ${oldHead}</span>`;
    inner.appendChild(label);
    container.appendChild(inner);
    requestAnimationFrame(()=>{
      try{
        const rInner=inner.getBoundingClientRect();
        const rInicio=document.getElementById('fork-inicio-col-queue')?.getBoundingClientRect();
        const rNovo=document.getElementById('fork-novo-box-queue')?.getBoundingClientRect();
        const rHead=document.getElementById('fork-head-box-queue')?.getBoundingClientRect();
        if(!rInicio||!rNovo||!rHead) return;
        const belowElQ=document.getElementById('fork-below-queue');
        if(belowElQ){
          const desiredLeft = (rHead.left + rHead.width/2 - rNovo.width/2) - rInner.left;
          const actualLeft = (rNovo.left) - rInner.left;
          const delta = desiredLeft - actualLeft;
          belowElQ.style.left = delta + 'px';
        }
        const xInicio=(rInicio.left + rInicio.width/2)-rInner.left;
        const yInicio=rInicio.bottom - rInner.top + 2;
        const xNovo=(rHead.left + rHead.width/2)-rInner.left;
        const yNovoTop=rNovo.top - rInner.top - 6;
        const xHead=(rHead.left + rHead.width/2)-rInner.left;
        const yHeadTop=rHead.top - rInner.top - 6;
        const yHeadBottom=rHead.bottom - rInner.top + 4;
        const midY = yNovoTop - 20;
        const xHeadInicio = xHead - 14;
        const xHeadNovo = xHead + 14;
        pInicioNovo.setAttribute('d', `M ${xInicio} ${yInicio} L ${xInicio} ${midY} L ${xNovo} ${midY} L ${xNovo} ${yNovoTop}`);
        pInicioHead.setAttribute('d', `M ${xInicio} ${yInicio} C ${xInicio} ${midY}, ${xHeadInicio} ${midY}, ${xHeadInicio} ${yHeadTop}`);
        const yNovoMid = yNovoTop + 22;
        const xNovoRight = xHead + 64;
        pNovoHead.setAttribute('d', `M ${xNovoRight} ${yNovoMid} C ${xNovoRight+28} ${yNovoMid}, ${xHeadNovo+28} ${yHeadBottom - 10}, ${xHeadNovo} ${yHeadBottom}`);
        const maxY=Math.max(yInicio,yNovoTop,yHeadTop)+50;
        svg.setAttribute('height', maxY+20); svg.style.height=(maxY+20)+'px';
        inner.style.minHeight=(maxY+60)+'px';
      }catch(e){}
    });
    return;
  }

  // normal
  const wrap = document.createElement('div');
  wrap.className='nodes-row';
  const inicioCol = document.createElement('div');
  inicioCol.style.cssText='display:flex;flex-direction:column;align-items:center;gap:4px;margin-right:6px';
  inicioCol.innerHTML = `<span class="pointer-label" style="color:var(--accent)">${meta.ponteiros.inicio||'inicio'}<span class="pointer-arrow">↓</span></span>`;
  wrap.appendChild(inicioCol);
  snapshot.forEach((valor, idx)=>{
    const node = document.createElement('div');
    node.className='node';
    const isActive = step && step.highlightIndex===idx;
    const nextVal= idx<snapshot.length-1 ? snapshot[idx+1] : 'NULL';
    const box = document.createElement('div');
    box.className='node-box'+(isActive?' active':'');
    box.style.minWidth='128px';
    if(idx===snapshot.length-1) box.style.borderColor='#a78bfa';
    box.innerHTML = `
      <div class="node-value">${valor}</div>
      <div class="node-field"><span>${meta.no.proximo||'prox'}</span><b>→ ${nextVal}</b></div>
    `;
    if(idx===snapshot.length-1){
      const fimLab = document.createElement('div');
      fimLab.style.cssText='font-size:11px;color:#a78bfa;font-weight:600;margin-top:4px';
      fimLab.innerHTML = `↑<br>${meta.ponteiros.fim||'fim'}`;
      fimLab.style.textAlign='center';
      node.appendChild(box);
      node.appendChild(fimLab);
    } else node.appendChild(box);
    wrap.appendChild(node);
    if(idx < snapshot.length-1){
      const arrow=document.createElement('div');
      arrow.className='arrow'+(isActive?' active':'');
      wrap.appendChild(arrow);
    } else {
      const nullBox=document.createElement('div');
      nullBox.className='null-box';
      nullBox.textContent='NULL';
      nullBox.style.marginLeft='10px';
      wrap.appendChild(nullBox);
    }
  });
  if(step && step.tempNode!==undefined){
    const plus=document.createElement('div');
    plus.style.cssText='margin-left:12px;color:var(--warning);font-size:12px;border:1px dashed var(--warning);padding:6px 10px;border-radius:10px;background:rgba(245,158,11,.08)';
    plus.innerHTML=`[ ${step.tempNode} ] novo<br><span style="font-size:10px">${meta.no.proximo||'prox'} → NULL</span>`;
    wrap.appendChild(plus);
  }
  container.appendChild(wrap);
}
