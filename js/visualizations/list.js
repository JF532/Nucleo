export function renderLista(container, snapshot, meta, step){
  container.innerHTML='';
  const isBifurcated = step && step.arrowFromTemp && step.tempNode!==undefined && snapshot.length>0;

  if(snapshot.length===0){
    const empty = document.createElement('div');
    empty.style.cssText='color:var(--text-muted);font-size:13px';
    empty.innerHTML = `<span style="color:var(--accent);font-weight:600">${meta.ponteiros.inicio||'inicio'}</span> → <span class="null-box">NULL</span> (lista vazia)`;
    if(isBifurcated){
      const wrap=document.createElement('div');
      wrap.className='nodes-row';
      const inicioCol=document.createElement('div');
      inicioCol.style.cssText='display:flex;flex-direction:column;align-items:center;gap:4px;margin-right:4px';
      inicioCol.innerHTML=`<span class="pointer-label">${meta.ponteiros.inicio||'inicio'}<span class="pointer-arrow">↓</span></span>`;
      wrap.appendChild(inicioCol);
      const tempBox=document.createElement('div');
      tempBox.className='node-box temp active';
      tempBox.innerHTML=`<div class="node-value">${step.tempNode}</div><div class="node-field"><span>${meta.no.proximo||'prox'}</span><b>→ NULL</b></div><div class="node-label">novo</div>`;
      const node=document.createElement('div'); node.className='node'; node.appendChild(tempBox);
      wrap.appendChild(node);
      container.appendChild(wrap);
      return;
    }
    container.appendChild(empty);
    return;
  }

  if(isBifurcated){
    const oldHead = snapshot[0];
    const inner=document.createElement('div');
    inner.className='visualization-inner';
    inner.style.position='relative';
    inner.style.paddingTop='8px';

    // Linha superior: inicio + [10] -> [20] -> ...
    const row=document.createElement('div');
    row.className='nodes-row';
    row.style.position='relative';
    row.style.flexWrap='nowrap';
    row.style.minWidth='max-content';

    const inicioCol=document.createElement('div');
    inicioCol.style.cssText='display:flex;flex-direction:column;align-items:center;gap:2px;margin-right:10px;min-width:56px';
    inicioCol.id='fork-inicio-col';
    inicioCol.innerHTML=`<span class="pointer-label" id="fork-inicio-label">${meta.ponteiros.inicio||'inicio'}</span>`;
    row.appendChild(inicioCol);

    snapshot.forEach((valor, idx)=>{
      const node=document.createElement('div');
      node.className='node';
      if(idx===0) node.id='fork-head-node';
      const box=document.createElement('div');
      box.className='node-box'+(idx===0?' active':'');
      if(idx===0) box.id='fork-head-box';
      box.style.minWidth='110px';
      const nextVal = idx < snapshot.length-1 ? snapshot[idx+1] : 'NULL';
      box.innerHTML=`<div class="node-label">${meta.no.valor||'valor'}</div><div class="node-value">${valor}</div><div class="node-field"><span>${meta.no.proximo||'prox'}</span><b>→ ${nextVal}</b></div>`;
      node.appendChild(box);
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

    // Linha inferior: novo embaixo, alinhado sob o antigo inicio (head)
    const below=document.createElement('div');
    below.style.cssText='display:flex;align-items:center;gap:12px;margin-top:14px;margin-left:68px';
    below.id='fork-below-row';
    const novoNode=document.createElement('div');
    novoNode.className='node';
    novoNode.id='fork-novo-node';
    const novoBox=document.createElement('div');
    novoBox.className='node-box temp active';
    novoBox.id='fork-novo-box';
    novoBox.style.minWidth='110px';
    novoBox.innerHTML=`<div class="node-label">novo</div><div class="node-value">${step.tempNode}</div><div class="node-field"><span>${meta.no.proximo||'prox'}</span><b>→ ${oldHead}</b></div>`;
    novoNode.appendChild(novoBox);
    below.appendChild(novoNode);
    const novoArrow=document.createElement('div');
    novoArrow.style.cssText='font-size:11px;color:var(--warning)';
    novoArrow.innerHTML=`<span style="color:var(--warning)">↗</span> <span style="color:var(--warning)">prox → ${oldHead}</span>`;
    below.appendChild(novoArrow);
    inner.appendChild(below);

    // SVG com 3 setas em L
    const svgNS='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(svgNS,'svg');
    svg.classList.add('fork-svg');
    svg.style.height='90px';
    svg.style.top='0';
    svg.setAttribute('width','100%');
    svg.setAttribute('height','90');
    const defs=document.createElementNS(svgNS,'defs');
    defs.innerHTML=`<marker id="arrow-accent-list2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8"/></marker><marker id="arrow-warning-list2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b"/></marker><marker id="arrow-accent-dashed" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" opacity="0.7"/></marker>`;
    svg.appendChild(defs);
    const pInicioNovo=document.createElementNS(svgNS,'path');
    pInicioNovo.setAttribute('class','fork-path inicio');
    pInicioNovo.setAttribute('marker-end','url(#arrow-accent-list2)');
    const pInicioHead=document.createElementNS(svgNS,'path');
    pInicioHead.setAttribute('class','fork-path inicio');
    pInicioHead.setAttribute('marker-end','url(#arrow-accent-dashed)');
    pInicioHead.style.strokeDasharray='5 5';
    pInicioHead.style.opacity='0.7';
    const pNovoHead=document.createElementNS(svgNS,'path');
    pNovoHead.setAttribute('class','fork-path novo');
    pNovoHead.setAttribute('marker-end','url(#arrow-warning-list2)');
    svg.appendChild(pInicioNovo); svg.appendChild(pInicioHead); svg.appendChild(pNovoHead);
    inner.appendChild(svg);

    const label=document.createElement('div');
    label.style.cssText='font-size:10px;color:var(--text-muted);margin-top:6px;margin-left:4px;border-left:2px dashed var(--border);padding-left:8px';
    label.innerHTML=`<span style="color:var(--accent)">${meta.ponteiros.inicio||'inicio'} → novo (L)</span> &nbsp;|&nbsp; <span style="color:var(--accent);opacity:0.7">${meta.ponteiros.inicio||'inicio'} → ${oldHead}</span> &nbsp;|&nbsp; <span style="color:#f59e0b">novo → ${oldHead}</span> — próximo passo: <b style="color:var(--accent)">${meta.ponteiros.inicio||'inicio'} → novo → ${oldHead}</b>`;
    inner.appendChild(label);
    container.appendChild(inner);

    requestAnimationFrame(()=>{
      try{
        const rInner=inner.getBoundingClientRect();
        const rInicio=document.getElementById('fork-inicio-col')?.getBoundingClientRect();
        const rNovo=document.getElementById('fork-novo-box')?.getBoundingClientRect();
        const rHead=document.getElementById('fork-head-box')?.getBoundingClientRect();
        if(!rInicio||!rNovo||!rHead) return;
        const xInicio=(rInicio.left + rInicio.width/2)-rInner.left;
        const yInicio=rInicio.bottom - rInner.top + 2;
        const xNovo=(rNovo.left + rNovo.width/2)-rInner.left;
        const yNovoTop=rNovo.top - rInner.top - 6;
        const yNovoBottom=rNovo.top - rInner.top - 6; // top of novo
        const xHead=(rHead.left + rHead.width/2)-rInner.left;
        const yHeadTop=rHead.top - rInner.top - 6;
        const yHeadBottom=rHead.bottom - rInner.top + 4;
        // L: inicio -> novo (desce vertical e depois horizontal)
        const midY = yNovoTop - 12;
        // inicio -> novo : vertical down then horizontal to novo
        pInicioNovo.setAttribute('d', `M ${xInicio} ${yInicio} L ${xInicio} ${midY} L ${xNovo} ${midY} L ${xNovo} ${yNovoTop}`);
        // inicio -> head (tracejado) : vertical down to head top
        pInicioHead.setAttribute('d', `M ${xInicio} ${yInicio} C ${xInicio} ${midY}, ${xHead} ${midY}, ${xHead} ${yHeadTop}`);
        // novo -> head : diagonal up to head
        const xNovoRight = (rNovo.right) - rInner.left;
        const yNovoMid = (rNovo.top + rNovo.height/2) - rInner.top;
        pNovoHead.setAttribute('d', `M ${xNovoRight} ${yNovoMid} C ${xHead-30} ${yNovoMid}, ${xHead} ${yHeadBottom - 10}, ${xHead} ${yHeadBottom}`);
        const maxY = Math.max(yInicio, yNovoTop, yHeadTop) + 50;
        svg.setAttribute('height', maxY+20);
        svg.style.height = (maxY+20)+'px';
        // ajustar altura do inner para conter svg
        inner.style.minHeight = (maxY+60)+'px';
      }catch(e){}
    });
    return;
  }

  // caso normal (não bifurcado)
  const wrap = document.createElement('div');
  wrap.className='nodes-row';
  const inicioCol = document.createElement('div');
  inicioCol.style.cssText='display:flex;flex-direction:column;align-items:center;gap:4px;margin-right:4px';
  inicioCol.innerHTML = `<span class="pointer-label">${meta.ponteiros.inicio||'inicio'}<span class="pointer-arrow">↓</span></span>`;
  wrap.appendChild(inicioCol);
  snapshot.forEach((valor, idx)=>{
    const node = document.createElement('div');
    node.className='node';
    const isActive = step && step.highlightIndex===idx;
    const nextVal = idx < snapshot.length-1 ? snapshot[idx+1] : 'NULL';
    const box = document.createElement('div');
    box.className='node-box'+(isActive?' active':'');
    box.style.minWidth='110px';
    box.innerHTML = `
      <div class="node-label">${meta.no.valor||'valor'}</div>
      <div class="node-value">${valor}</div>
      <div class="node-field"><span>${meta.no.proximo||'prox'}</span><b>→ ${nextVal}</b></div>
    `;
    node.appendChild(box);
    wrap.appendChild(node);
    if(idx < snapshot.length-1){
      const arrow = document.createElement('div');
      arrow.className='arrow'+(step && step.highlightIndex===idx ? ' active':'');
      wrap.appendChild(arrow);
    } else {
      const nullBox = document.createElement('div');
      nullBox.className='null-box';
      nullBox.textContent='NULL';
      nullBox.style.marginLeft='6px';
      wrap.appendChild(nullBox);
    }
  });
  if(step && step.tempNode!==undefined){
    const plus = document.createElement('div');
    plus.style.cssText='margin-left:12px;display:flex;align-items:center;gap:8px;color:var(--warning);font-size:12px';
    plus.innerHTML = `<span style="border:1px dashed var(--warning);padding:6px 10px;border-radius:10px;background:rgba(245,158,11,.08)">[ ${step.tempNode} ] novo</span>`;
    wrap.appendChild(plus);
  }
  container.appendChild(wrap);
}
