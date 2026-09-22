export function renderFila(container, snapshot, meta, step){
  container.innerHTML='';
  if(snapshot.length===0){
    container.innerHTML = `<div style="color:var(--text-muted);font-size:13px">
      <span style="color:var(--accent);font-weight:600">${meta.ponteiros.inicio||'inicio'}</span> → <span class="null-box">NULL</span> &nbsp;
      <span style="color:#a78bfa;font-weight:600">${meta.ponteiros.fim||'fim'}</span> → NULL (fila vazia)</div>`;
    return;
  }
  const wrap = document.createElement('div');
  wrap.className='nodes-row';

  // inicio pointer
  const inicioCol = document.createElement('div');
  inicioCol.style.cssText='display:flex;flex-direction:column;align-items:center;gap:4px;margin-right:6px';
  inicioCol.innerHTML = `<span class="pointer-label" style="color:var(--accent)">${meta.ponteiros.inicio||'inicio'}<span class="pointer-arrow">↓</span></span>`;
  wrap.appendChild(inicioCol);

  snapshot.forEach((valor, idx)=>{
    const node = document.createElement('div');
    node.className='node';
    const isActive = step && step.highlightIndex===idx;
    const nextVal = idx<snapshot.length-1 ? snapshot[idx+1] : 'NULL';
    const box = document.createElement('div');
    box.className='node-box'+(isActive?' active':'');
    box.style.minWidth='110px';
    // highlight fim on last
    if(idx===snapshot.length-1) box.style.borderColor='#a78bfa';
    box.innerHTML = `
      <div class="node-value">${valor}</div>
      <div class="node-field"><span>${meta.no.proximo||'prox'}</span><b>→ ${nextVal}</b></div>
    `;
    node.appendChild(box);
    // fim label below last
    if(idx===snapshot.length-1){
      const fimLab = document.createElement('div');
      fimLab.style.cssText='font-size:11px;color:#a78bfa;font-weight:600;margin-top:4px';
      fimLab.innerHTML = `↑<br>${meta.ponteiros.fim||'fim'}`;
      fimLab.style.textAlign='center';
      node.appendChild(fimLab);
    }
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
    if(step.arrowFromTemp && snapshot.length>0){
      const oldHead = snapshot[0];
      const bifur=document.createElement('div');
      bifur.style.cssText='margin-left:12px;display:flex;flex-direction:column;gap:4px;align-items:flex-start;color:var(--warning);font-size:12px';
      bifur.innerHTML=`<span style="border:1px dashed var(--warning);padding:6px 10px;border-radius:10px;background:rgba(245,158,11,.08)"><b>[ ${step.tempNode} ] novo</b> — ${meta.no.proximo||'prox'} → ${oldHead}</span><span style="font-size:10px;color:var(--text-muted);border-left:2px dashed var(--border);padding-left:8px"><span style="color:var(--accent)">${meta.ponteiros.inicio||'inicio'} → ${oldHead}</span> | <span style="color:var(--warning)">novo → ${oldHead}</span></span>`;
      wrap.appendChild(bifur);
      const firstBox=wrap.querySelectorAll('.node-box')[0];
      if(firstBox) firstBox.classList.add('active');
    } else {
      const plus=document.createElement('div');
      plus.style.cssText='margin-left:12px;color:var(--warning);font-size:12px;border:1px dashed var(--warning);padding:6px 10px;border-radius:10px;background:rgba(245,158,11,.08)';
      plus.innerHTML=`[ ${step.tempNode} ] novo<br><span style="font-size:10px">${meta.no.proximo||'prox'} → NULL</span>`;
      wrap.appendChild(plus);
    }
  }

  container.appendChild(wrap);
}
