export function renderDupla(container, snapshot, meta, step){
  container.innerHTML='';
  const isBifurcated = step && step.arrowFromTemp && step.tempNode!==undefined && snapshot.length>0;
  if(snapshot.length===0){
    if(isBifurcated){
      const wrap=document.createElement('div');
      wrap.className='nodes-row';
      const tempBox=document.createElement('div');
      tempBox.className='node-box double temp active';
      tempBox.innerHTML=`<div class="node-value">${step.tempNode}</div><div class="node-field" style="font-size:10px"><span>${meta.no.anterior||'ant'} → NULL</span><span>${meta.no.proximo||'prox'} → NULL</span></div><div class="node-label">novo</div>`;
      const n=document.createElement('div'); n.className='node'; n.appendChild(tempBox); wrap.appendChild(n);
      container.appendChild(wrap);
      return;
    }
    container.innerHTML = `<div style="color:var(--text-muted);font-size:13px"><span style="color:var(--accent);font-weight:600">${meta.ponteiros.inicio||'inicio'}</span> ⇄ <span class="null-box">NULL</span> (vazia)</div>`;
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
    inicioCol.id='fork-inicio-col-double';
    inicioCol.innerHTML=`<span class="pointer-label" id="fork-inicio-label-double">${meta.ponteiros.inicio||'inicio'}</span>`;
    row.appendChild(inicioCol);
    const nullLeft=document.createElement('div');
    nullLeft.className='null-box';
    nullLeft.textContent='NULL';
    nullLeft.style.marginRight='6px';
    row.appendChild(nullLeft);
    const arrowLeft=document.createElement('div');
    arrowLeft.className='arrow double';
    arrowLeft.style.width='42px';
    row.appendChild(arrowLeft);
    snapshot.forEach((valor, idx)=>{
      const node=document.createElement('div');
      node.className='node';
      if(idx===0) node.id='fork-head-double';
      const prevVal = idx>0 ? snapshot[idx-1] : 'NULL';
      const nextVal = idx < snapshot.length-1 ? snapshot[idx+1] : 'NULL';
      const box=document.createElement('div');
      box.className='node-box double'+(idx===0?' active':'');
      if(idx===0) box.id='fork-head-box-double';
      box.style.minWidth='120px';
      box.innerHTML=`
        <div style="display:flex;gap:6px;align-items:center;justify-content:space-between;width:100%">
          <span class="node-field" style="width:auto"><b>${idx===0?'NULL':'←'}</b></span>
          <span class="node-value" style="font-size:14px">${valor}</span>
          <span class="node-field" style="width:auto"><b>${idx===snapshot.length-1?'NULL':'→'}</b></span>
        </div>
        <div class="node-field" style="font-size:10px;gap:8px;justify-content:space-between"><span>${meta.no.anterior||'ant'} → ${prevVal}</span><span>${meta.no.proximo||'prox'} → ${nextVal}</span></div>
      `;
      node.appendChild(box);
      row.appendChild(node);
      if(idx < snapshot.length-1){
        const arr=document.createElement('div');
        arr.className='arrow double';
        row.appendChild(arr);
      }
    });
    const arrowRight=document.createElement('div');
    arrowRight.className='arrow';
    arrowRight.style.width='42px';
    row.appendChild(arrowRight);
    const nullRight=document.createElement('div');
    nullRight.className='null-box';
    nullRight.textContent='NULL';
    row.appendChild(nullRight);
    inner.appendChild(row);

    // novo embaixo, centralizado sob head (image_certa)
    const below=document.createElement('div');
    below.style.cssText='display:flex;align-items:center;gap:18px;margin-top:28px;position:relative;left:0';
    below.id='fork-below-double';
    const novoNode=document.createElement('div');
    novoNode.className='node';
    novoNode.id='fork-novo-double';
    const novoBox=document.createElement('div');
    novoBox.className='node-box double temp active';
    novoBox.id='fork-novo-box-double';
    novoBox.style.minWidth='120px';
    novoBox.innerHTML=`<div class="node-value" style="font-size:14px">${step.tempNode}</div><div class="node-field" style="font-size:10px;gap:6px"><span>${meta.no.anterior||'ant'} → NULL</span><span>${meta.no.proximo||'prox'} → ${oldHead}</span></div><div class="node-label">novo</div>`;
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
    defs.innerHTML=`<marker id="arrow-accent-double2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8"/></marker><marker id="arrow-warning-double2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b"/></marker>`;
    svg.appendChild(defs);
    const pInicioNovo=document.createElementNS(svgNS,'path');
    pInicioNovo.setAttribute('class','fork-path inicio');
    pInicioNovo.setAttribute('marker-end','url(#arrow-accent-double2)');
    const pInicioHead=document.createElementNS(svgNS,'path');
    pInicioHead.setAttribute('class','fork-path inicio');
    pInicioHead.setAttribute('marker-end','url(#arrow-accent-double2)');
    pInicioHead.style.strokeDasharray='5 5';
    pInicioHead.style.opacity='0.7';
    const pNovoHead=document.createElementNS(svgNS,'path');
    pNovoHead.setAttribute('class','fork-path novo');
    pNovoHead.setAttribute('marker-end','url(#arrow-warning-double2)');
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
        const rInicio=document.getElementById('fork-inicio-col-double')?.getBoundingClientRect();
        const rNovo=document.getElementById('fork-novo-box-double')?.getBoundingClientRect();
        const rHead=document.getElementById('fork-head-box-double')?.getBoundingClientRect();
        if(!rInicio||!rNovo||!rHead) return;
        // centralizar novo embaixo sob o head (image_certa)
        const belowEl2=document.getElementById('fork-below-double');
        if(belowEl2){
          const desiredLeft = (rHead.left + rHead.width/2 - rNovo.width/2) - rInner.left;
          const actualLeft = (rNovo.left) - rInner.left;
          const delta = desiredLeft - actualLeft;
          belowEl2.style.left = delta + 'px';
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
  inicioCol.style.cssText='display:flex;flex-direction:column;align-items:center;gap:4px;margin-right:4px';
  inicioCol.innerHTML = `<span class="pointer-label">${meta.ponteiros.inicio||'inicio'}<span class="pointer-arrow">↓</span></span>`;
  wrap.appendChild(inicioCol);
  const nullLeft = document.createElement('div');
  nullLeft.className='null-box';
  nullLeft.textContent='NULL';
  nullLeft.style.marginRight='6px';
  wrap.appendChild(nullLeft);
  const arrowLeft = document.createElement('div');
  arrowLeft.className='arrow double';
  arrowLeft.style.width='42px';
  wrap.appendChild(arrowLeft);
  snapshot.forEach((valor, idx)=>{
    const node = document.createElement('div');
    node.className='node';
    const isActive = step && step.highlightIndex===idx;
    const prevVal = idx>0 ? snapshot[idx-1] : 'NULL';
    const nextVal = idx < snapshot.length-1 ? snapshot[idx+1] : 'NULL';
    const box = document.createElement('div');
    box.className='node-box double'+(isActive?' active':'');
    box.style.minWidth='120px';
    box.innerHTML = `
      <div style="display:flex;gap:6px;align-items:center;justify-content:space-between;width:100%">
        <span class="node-field" style="width:auto"><b>${idx===0?'NULL':'←'}</b></span>
        <span class="node-value" style="font-size:14px">${valor}</span>
        <span class="node-field" style="width:auto"><b>${idx===snapshot.length-1?'NULL':'→'}</b></span>
      </div>
      <div class="node-field" style="font-size:10px;gap:8px;justify-content:space-between"><span>${meta.no.anterior||'ant'} → ${prevVal}</span><span>${meta.no.proximo||'prox'} → ${nextVal}</span></div>
    `;
    node.appendChild(box);
    wrap.appendChild(node);
    if(idx < snapshot.length-1){
      const arrow = document.createElement('div');
      arrow.className='arrow double';
      wrap.appendChild(arrow);
    }
  });
  const arrowRight = document.createElement('div');
  arrowRight.className='arrow';
  arrowRight.style.width='42px';
  wrap.appendChild(arrowRight);
  const nullRight = document.createElement('div');
  nullRight.className='null-box';
  nullRight.textContent='NULL';
  nullRight.style.marginLeft='10px';
  wrap.appendChild(nullRight);
  if(step && step.tempNode!==undefined){
    const plus = document.createElement('div');
    plus.style.cssText='margin-left:12px;display:flex;align-items:center;gap:8px;color:var(--warning);font-size:12px';
    plus.innerHTML = `<span style="border:1px dashed var(--warning);padding:6px 10px;border-radius:10px;background:rgba(245,158,11,.08)">[ ${step.tempNode} ] novo</span>`;
    wrap.appendChild(plus);
  }
  container.appendChild(wrap);
}
