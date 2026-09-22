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

  // temp node if exists - Passo 3 bifurcação: novo->prox → antigo inicio, inicio ainda → antigo
  if(step && step.tempNode!==undefined){
    if(step.arrowFromTemp && snapshot.length>0){
      // bifurcação visual: mostra novo acima do antigo inicio com seta, e inicio ainda apontando
      const bifur = document.createElement('div');
      bifur.style.cssText='display:flex;flex-direction:column;gap:6px;margin-left:8px;align-items:flex-start';
      const oldHead = snapshot[0];
      const tempBox = document.createElement('div');
      tempBox.style.cssText='border:1px dashed var(--warning);padding:6px 10px;border-radius:10px;background:rgba(245,158,11,.08);color:var(--warning);font-size:12px;text-align:center;min-width:92px';
      tempBox.innerHTML = `<b>[ ${step.tempNode} ] novo</b><br><span style="font-size:11px">${meta.no.proximo||'prox'} → ${oldHead}</span>`;
      const arrowRow = document.createElement('div');
      arrowRow.style.cssText='display:flex;align-items:center;gap:6px;margin-left:12px';
      arrowRow.innerHTML = `<span class="arrow active" style="width:36px;background:var(--warning)"></span><span style="font-size:10px;color:var(--warning)">aponta para [${oldHead}]</span>`;
      const forkLabel = document.createElement('div');
      forkLabel.style.cssText='font-size:10px;color:var(--text-muted);margin-left:12px;border-left:2px dashed var(--border);padding-left:8px';
      forkLabel.innerHTML = `<span style="color:var(--accent)">${meta.ponteiros.inicio||'inicio'} → ${oldHead}</span> &nbsp;|&nbsp; <span style="color:var(--warning)">novo → ${oldHead}</span> <br><em>bifurcação temporária — próximo passo: ${meta.ponteiros.inicio||'inicio'} → novo</em>`;
      bifur.appendChild(tempBox);
      bifur.appendChild(arrowRow);
      bifur.appendChild(forkLabel);
      wrap.appendChild(bifur);
      // destaca o primeiro nó como alvo de dois ponteiros
      const firstNodeBox = wrap.querySelectorAll('.node-box')[0];
      if(firstNodeBox) firstNodeBox.classList.add('active');
    } else {
      const plus = document.createElement('div');
      plus.style.cssText='margin-left:12px;display:flex;align-items:center;gap:8px;color:var(--warning);font-size:12px';
      plus.innerHTML = `<span style="border:1px dashed var(--warning);padding:6px 10px;border-radius:10px;background:rgba(245,158,11,.08)">[ ${step.tempNode} ] novo</span>`;
      wrap.appendChild(plus);
    }
  }

  container.appendChild(wrap);

  // result partial for traversal? not for list
}
