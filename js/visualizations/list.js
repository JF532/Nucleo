export function renderLista(container, snapshot, meta, step){
  container.innerHTML='';
  const isBifurcated = step && step.arrowFromTemp && step.tempNode!==undefined && snapshot.length>0;

  if(snapshot.length===0){
    const empty = document.createElement('div');
    empty.style.cssText='color:var(--text-muted);font-size:13px';
    empty.innerHTML = `<span style="color:var(--accent);font-weight:600">${meta.ponteiros.inicio||'inicio'}</span> → <span class="null-box">NULL</span> (lista vazia)`;
    if(isBifurcated){
      // vazia com novo: mostra novo -> NULL
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
    // Render todos para frente com SVG Y
    const oldHead = snapshot[0];
    const inner=document.createElement('div');
    inner.className='visualization-inner';
    inner.style.position='relative';
    inner.style.paddingTop='22px';

    const row=document.createElement('div');
    row.className='nodes-row';
    row.style.position='relative';
    row.style.flexWrap='wrap';

    // inicio ponteiro
    const inicioCol=document.createElement('div');
    inicioCol.style.cssText='display:flex;flex-direction:column;align-items:center;gap:2px;margin-right:6px;min-width:56px';
    inicioCol.id='fork-inicio-col';
    inicioCol.innerHTML=`<span class="pointer-label" id="fork-inicio-label">${meta.ponteiros.inicio||'inicio'}</span>`;
    row.appendChild(inicioCol);

    // novo nó (dashed) - primeiro da linha
    const tempNode=document.createElement('div');
    tempNode.className='node';
    tempNode.id='fork-novo-node';
    const tempBox=document.createElement('div');
    tempBox.className='node-box temp active';
    tempBox.id='fork-novo-box';
    tempBox.style.minWidth='110px';
    tempBox.innerHTML=`<div class="node-label">novo</div><div class="node-value">${step.tempNode}</div><div class="node-field"><span>${meta.no.proximo||'prox'}</span><b>→ ${oldHead}</b></div>`;
    tempNode.appendChild(tempBox);
    row.appendChild(tempNode);

    // arrow novo -> head (será coberto por SVG, manter tracejado visual)
    const arrowNovo=document.createElement('div');
    arrowNovo.className='arrow';
    arrowNovo.style.background='var(--warning)';
    arrowNovo.style.opacity='.6';
    row.appendChild(arrowNovo);

    // head e resto
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

    // SVG fork overlay - Y shape
    const svgNS='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(svgNS,'svg');
    svg.classList.add('fork-svg');
    svg.style.height='48px';
    svg.style.top='0';
    svg.style.left='0';
    svg.setAttribute('width','100%');
    svg.setAttribute('height','48');
    // defs for arrowheads
    const defs=document.createElementNS(svgNS,'defs');
    defs.innerHTML=`<marker id="arrow-accent-list" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8"/></marker><marker id="arrow-warning-list" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b"/></marker>`;
    svg.appendChild(defs);

    const pathInicio=document.createElementNS(svgNS,'path');
    pathInicio.setAttribute('class','fork-path inicio');
    pathInicio.setAttribute('marker-end','url(#arrow-accent-list)');
    const pathNovo=document.createElementNS(svgNS,'path');
    pathNovo.setAttribute('class','fork-path novo');
    pathNovo.setAttribute('marker-end','url(#arrow-warning-list)');

    // placeholder paths - will be updated after layout
    pathInicio.setAttribute('d','M 0 0 L 0 0');
    pathNovo.setAttribute('d','M 0 0 L 0 0');
    svg.appendChild(pathInicio);
    svg.appendChild(pathNovo);

    // Fork label
    const label=document.createElement('div');
    label.style.cssText='font-size:10px;color:var(--text-muted);margin-top:4px;margin-left:4px;border-left:2px dashed var(--border);padding-left:8px';
    label.innerHTML=`<span style="color:var(--accent)">${meta.ponteiros.inicio||'inicio'} → ${oldHead}</span> &nbsp;|&nbsp; <span style="color:#f59e0b">novo → ${oldHead}</span> — próximo passo: <b style="color:var(--accent)">${meta.ponteiros.inicio||'inicio'} → novo</b>`;

    inner.appendChild(svg);
    container.appendChild(inner);
    container.appendChild(label);

    // desenhar Y após layout
    requestAnimationFrame(()=>{
      try{
        const rInner=inner.getBoundingClientRect();
        const rInicio=document.getElementById('fork-inicio-col')?.getBoundingClientRect();
        const rNovoBox=document.getElementById('fork-novo-box')?.getBoundingClientRect();
        const rHeadBox=document.getElementById('fork-head-box')?.getBoundingClientRect();
        if(!rInicio || !rNovoBox || !rHeadBox) return;
        // pontos relativos ao inner
        const svgTop = svg.getBoundingClientRect().top - rInner.top;
        // inicio: centro inferior do label
        const xInicio = (rInicio.left + rInicio.width/2) - rInner.left;
        const yInicio = (rInicio.bottom) - rInner.top + 2;
        // novo: centro inferior da box
        const xNovo = (rNovoBox.left + rNovoBox.width/2) - rInner.left;
        const yNovo = (rNovoBox.bottom) - rInner.top + 2;
        // head: centro superior da box
        const xHead = (rHeadBox.left + rHeadBox.width/2) - rInner.left;
        const yHead = (rHeadBox.top) - rInner.top - 4;
        // ponto de junção
        const jy = yHead - 10;
        const jx = xHead;
        // Paths com curva suave
        pathInicio.setAttribute('d', `M ${xInicio} ${yInicio} C ${xInicio} ${jy}, ${xHead} ${jy}, ${xHead} ${yHead}`);
        pathNovo.setAttribute('d', `M ${xNovo} ${yNovo} C ${xNovo} ${jy}, ${xHead} ${jy}, ${xHead} ${yHead}`);
        // ajustar altura do svg
        const maxY = Math.max(yInicio, yNovo, yHead) + 10;
        svg.setAttribute('height', maxY);
        svg.style.height = maxY+'px';
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
