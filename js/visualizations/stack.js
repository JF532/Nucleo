export function renderPilha(container, snapshot, meta, step){
  container.innerHTML='';
  if(snapshot.length===0){
    container.innerHTML = `<div style="color:var(--text-muted);font-size:13px"><span style="color:var(--accent);font-weight:600">${meta.ponteiroPrincipal||meta.ponteiros.topo||'topo'}</span> → <span class="null-box">NULL</span> (pilha vazia)</div>`;
    return;
  }
  const wrap = document.createElement('div');
  wrap.className='stack-col';
  // topo pointer
  const topoLab = document.createElement('div');
  topoLab.className='pointer-label';
  topoLab.innerHTML = `${meta.ponteiroPrincipal||meta.ponteiros.topo||'topo'}<span class="pointer-arrow">↓</span>`;
  wrap.appendChild(topoLab);

  // stack top is first element of snapshot (we treat snapshot[0] as topo)
  snapshot.forEach((valor, idx)=>{
    const node = document.createElement('div');
    node.className='node stack-node';
    const isActive = step && step.highlightIndex===idx;
    const nextVal = idx < snapshot.length-1 ? snapshot[idx+1] : 'NULL';
    const box = document.createElement('div');
    box.className='node-box stack'+(isActive?' active':'');
    box.style.minWidth='110px';
    box.innerHTML = `<div class="node-value">${valor}</div><div class="node-label">${idx===0?'topo':''}</div><div class="node-field" style="font-size:11px;justify-content:center"><span>${meta.no.proximo||'prox'}</span><b style="margin-left:6px">→ ${nextVal}</b></div>`;
    node.appendChild(box);
    wrap.appendChild(node);
    if(idx < snapshot.length-1){
      const arrow = document.createElement('div');
      arrow.className='arrow';
      wrap.appendChild(arrow);
    } else {
      const arr2 = document.createElement('div');
      arr2.className='arrow';
      wrap.appendChild(arr2);
      const nullBox = document.createElement('div');
      nullBox.className='null-box';
      nullBox.textContent='NULL';
      wrap.appendChild(nullBox);
    }
  });

  if(step && step.tempNode!==undefined){
    if(step.arrowFromTemp && snapshot.length>0){
      const oldHead = snapshot[0];
      const bifur = document.createElement('div');
      bifur.style.cssText='margin-top:10px;border:1px dashed var(--warning);padding:8px 12px;border-radius:10px;background:rgba(245,158,11,.08);color:var(--warning);font-size:12px;text-align:center';
      bifur.innerHTML = `<b>[ ${step.tempNode} ] novo</b> — ${meta.no.proximo||'prox'} → ${oldHead}<br><span style="font-size:10px;color:var(--text-muted)"><span style="color:var(--accent)">${meta.ponteiroPrincipal||'topo'} → ${oldHead}</span> | <span style="color:var(--warning)">novo → ${oldHead}</span> — próximo: topo → novo</span>`;
      wrap.appendChild(bifur);
      // destaca topo atual
      const firstBox = wrap.querySelector('.node-box');
      if(firstBox) firstBox.classList.add('active');
    } else {
      const temp = document.createElement('div');
      temp.style.cssText='margin-top:8px;color:var(--warning);font-size:12px;border:1px dashed var(--warning);padding:6px 10px;border-radius:10px;background:rgba(245,158,11,.08)';
      temp.textContent = `[ ${step.tempNode} ] novo`;
      wrap.appendChild(temp);
    }
  }

  container.appendChild(wrap);
}
