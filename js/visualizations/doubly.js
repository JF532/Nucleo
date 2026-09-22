export function renderDupla(container, snapshot, meta, step){
  container.innerHTML='';
  if(snapshot.length===0){
    container.innerHTML = `<div style="color:var(--text-muted);font-size:13px"><span style="color:var(--accent);font-weight:600">${meta.ponteiros.inicio||'inicio'}</span> ⇄ <span class="null-box">NULL</span> (vazia)</div>`;
    return;
  }
  const wrap = document.createElement('div');
  wrap.className='nodes-row';

  const inicioCol = document.createElement('div');
  inicioCol.style.cssText='display:flex;flex-direction:column;align-items:center;gap:4px;margin-right:4px';
  inicioCol.innerHTML = `<span class="pointer-label">${meta.ponteiros.inicio||'inicio'}<span class="pointer-arrow">↓</span></span>`;
  wrap.appendChild(inicioCol);

  // NULL left
  const nullLeft = document.createElement('div');
  nullLeft.className='null-box';
  nullLeft.textContent='NULL';
  nullLeft.style.marginRight='6px';
  wrap.appendChild(nullLeft);
  const arrowLeft = document.createElement('div');
  arrowLeft.className='arrow double';
  arrowLeft.style.width='28px';
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
  arrowRight.style.width='28px';
  wrap.appendChild(arrowRight);
  const nullRight = document.createElement('div');
  nullRight.className='null-box';
  nullRight.textContent='NULL';
  nullRight.style.marginLeft='6px';
  wrap.appendChild(nullRight);

  if(step && step.tempNode!==undefined){
    const plus = document.createElement('div');
    plus.style.cssText='margin-left:12px;display:flex;align-items:center;gap:8px;color:var(--warning);font-size:12px';
    plus.innerHTML = `<span style="border:1px dashed var(--warning);padding:6px 10px;border-radius:10px;background:rgba(245,158,11,.08)">[ ${step.tempNode} ] novo</span>`;
    wrap.appendChild(plus);
  }

  container.appendChild(wrap);
}
