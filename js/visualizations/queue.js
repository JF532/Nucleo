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
    inner.style.paddingTop='22px';
    const row=document.createElement('div');
    row.className='nodes-row';
    row.style.position='relative';
    const inicioCol=document.createElement('div');
    inicioCol.style.cssText='display:flex;flex-direction:column;align-items:center;gap:2px;margin-right:6px;min-width:56px';
    inicioCol.id='fork-inicio-col-queue';
    inicioCol.innerHTML=`<span class="pointer-label" id="fork-inicio-label-queue" style="color:var(--accent)">${meta.ponteiros.inicio||'inicio'}</span>`;
    row.appendChild(inicioCol);
    const tempNode=document.createElement('div');
    tempNode.className='node';
    tempNode.id='fork-novo-queue';
    const tempBox=document.createElement('div');
    tempBox.className='node-box temp active';
    tempBox.id='fork-novo-box-queue';
    tempBox.style.minWidth='110px';
    tempBox.innerHTML=`<div class="node-label">novo</div><div class="node-value">${step.tempNode}</div><div class="node-field"><span>${meta.no.proximo||'prox'}</span><b>→ ${oldHead}</b></div>`;
    tempNode.appendChild(tempBox);
    row.appendChild(tempNode);
    const arrowTmp=document.createElement('div');
    arrowTmp.className='arrow';
    arrowTmp.style.opacity='.6';
    row.appendChild(arrowTmp);
    snapshot.forEach((valor, idx)=>{
      const node=document.createElement('div');
      node.className='node';
      if(idx===0) node.id='fork-head-queue';
      const box=document.createElement('div');
      box.className='node-box'+(idx===0?' active':'');
      if(idx===0) box.id='fork-head-box-queue';
      box.style.minWidth='110px';
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
        nullBox.style.marginLeft='6px';
        row.appendChild(nullBox);
      }
    });
    inner.appendChild(row);
    const svgNS='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(svgNS,'svg');
    svg.classList.add('fork-svg');
    svg.style.height='48px';
    svg.style.top='0';
    svg.setAttribute('width','100%');
    svg.setAttribute('height','48');
    const defs=document.createElementNS(svgNS,'defs');
    defs.innerHTML=`<marker id="arrow-accent-queue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8"/></marker><marker id="arrow-warning-queue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b"/></marker>`;
    svg.appendChild(defs);
    const pInicio=document.createElementNS(svgNS,'path');
    pInicio.setAttribute('class','fork-path inicio');
    pInicio.setAttribute('marker-end','url(#arrow-accent-queue)');
    const pNovo=document.createElementNS(svgNS,'path');
    pNovo.setAttribute('class','fork-path novo');
    pNovo.setAttribute('marker-end','url(#arrow-warning-queue)');
    svg.appendChild(pInicio); svg.appendChild(pNovo);
    inner.appendChild(svg);
    const label=document.createElement('div');
    label.style.cssText='font-size:10px;color:var(--text-muted);margin-top:4px;margin-left:4px;border-left:2px dashed var(--border);padding-left:8px';
    label.innerHTML=`<span style="color:var(--accent)">${meta.ponteiros.inicio||'inicio'} → ${oldHead}</span> &nbsp;|&nbsp; <span style="color:#f59e0b">novo → ${oldHead}</span> — próximo: <b style="color:var(--accent)">${meta.ponteiros.inicio||'inicio'} → novo</b>`;
    inner.appendChild(label);
    container.appendChild(inner);
    requestAnimationFrame(()=>{
      try{
        const rInner=inner.getBoundingClientRect();
        const rInicio=document.getElementById('fork-inicio-col-queue')?.getBoundingClientRect();
        const rNovo=document.getElementById('fork-novo-box-queue')?.getBoundingClientRect();
        const rHead=document.getElementById('fork-head-box-queue')?.getBoundingClientRect();
        if(!rInicio||!rNovo||!rHead) return;
        const xInicio=(rInicio.left + rInicio.width/2)-rInner.left;
        const yInicio=rInicio.bottom - rInner.top + 2;
        const xNovo=(rNovo.left + rNovo.width/2)-rInner.left;
        const yNovo=rNovo.bottom - rInner.top + 2;
        const xHead=(rHead.left + rHead.width/2)-rInner.left;
        const yHead=rHead.top - rInner.top - 4;
        const jy=yHead-10;
        pInicio.setAttribute('d', `M ${xInicio} ${yInicio} C ${xInicio} ${jy}, ${xHead} ${jy}, ${xHead} ${yHead}`);
        pNovo.setAttribute('d', `M ${xNovo} ${yNovo} C ${xNovo} ${jy}, ${xHead} ${jy}, ${xHead} ${yHead}`);
        const maxY=Math.max(yInicio,yNovo,yHead)+10;
        svg.setAttribute('height', maxY); svg.style.height=maxY+'px';
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
    box.style.minWidth='110px';
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
      nullBox.style.marginLeft='6px';
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
