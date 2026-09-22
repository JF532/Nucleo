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
    const box = document.createElement('div');
    box.className='node-box'+(isActive?' active':'');
    // highlight fim on last
    if(idx===snapshot.length-1) box.style.borderColor='#a78bfa';
    box.innerHTML = `
      <div class="node-value">${valor}</div>
      <div class="node-field"><span>${meta.no.proximo||'prox'}</span><b>${idx<snapshot.length-1?'→':'NULL'}</b></div>
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
    const plus=document.createElement('div');
    plus.style.cssText='margin-left:12px;color:var(--warning);font-size:12px;border:1px dashed var(--warning);padding:6px 10px;border-radius:10px;background:rgba(245,158,11,.08)';
    plus.textContent=`[ ${step.tempNode} ] novo`;
    wrap.appendChild(plus);
  }

  container.appendChild(wrap);
}
