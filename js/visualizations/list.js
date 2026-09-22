export function renderLista(container, snapshot, meta, step){
  container.innerHTML='';
  const wrap = document.createElement('div');
  wrap.className='nodes-row';
  // pointer label inicio
  if(snapshot.length===0){
    const empty = document.createElement('div');
    empty.style.cssText='color:var(--text-muted);font-size:13px';
    empty.innerHTML = `<span style="color:var(--accent);font-weight:600">${meta.ponteiros.inicio||'inicio'}</span> → <span class="null-box">NULL</span> (lista vazia)`;
    container.appendChild(empty);
    return;
  }

  // inicio pointer above first node
  const inicioCol = document.createElement('div');
  inicioCol.style.cssText='display:flex;flex-direction:column;align-items:center;gap:4px;margin-right:4px';
  inicioCol.innerHTML = `<span class="pointer-label">${meta.ponteiros.inicio||'inicio'}<span class="pointer-arrow">↓</span></span>`;
  wrap.appendChild(inicioCol);

  snapshot.forEach((valor, idx)=>{
    const node = document.createElement('div');
    node.className='node';
    const isActive = step && step.highlightIndex===idx;
    const isTemp = false;
    const box = document.createElement('div');
    box.className='node-box'+(isActive?' active':'');
    box.innerHTML = `
      <div class="node-label">${meta.no.valor||'valor'}</div>
      <div class="node-value">${valor}</div>
      <div class="node-field"><span>${meta.no.proximo||'prox'}</span><b>${idx < snapshot.length-1 ? '→' : 'NULL'}</b></div>
    `;
    node.appendChild(box);

    // arrow after node except last
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

  // temp node if exists
  if(step && step.tempNode!==undefined){
    const plus = document.createElement('div');
    plus.style.cssText='margin-left:12px;display:flex;align-items:center;gap:8px;color:var(--warning);font-size:12px';
    plus.innerHTML = `<span style="border:1px dashed var(--warning);padding:6px 10px;border-radius:10px;background:rgba(245,158,11,.08)">[ ${step.tempNode} ] novo</span> ${step.arrowFromTemp ? '<span class="arrow active" style="width:28px"></span>' : ''}`;
    wrap.appendChild(plus);
  }

  container.appendChild(wrap);

  // result partial for traversal? not for list
}
