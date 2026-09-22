export function renderMemory(container, snapshot, meta){
  container.innerHTML='';
  if(!snapshot || snapshot.length===0){
    container.innerHTML='<p style="color:var(--text-muted);font-size:13px">Estrutura vazia — nenhum nó alocado.</p>';
    return;
  }
  // For list-like, snapshot is array. For tree, snapshot is raiz object.
  if(Array.isArray(snapshot)){
    snapshot.forEach((valor, idx)=>{
      const addr = '0x' + String(idx+1).padStart(3,'0');
      const nextAddr = idx < snapshot.length-1 ? '0x'+String(idx+2).padStart(3,'0') : 'NULL';
      const prevAddr = idx>0 ? '0x'+String(idx).padStart(3,'0') : 'NULL';
      const card = document.createElement('div');
      card.className='memory-card';
      const isDouble = meta.tipo==='lista_dupla';
      card.innerHTML = `
        <div class="addr">${addr}</div>
        <div class="field">${meta.no.valor||'valor'}: <b>${valor}</b></div>
        ${isDouble ? `<div class="field">${meta.no.anterior||'ant'}: <b>${prevAddr}</b></div>` : ''}
        <div class="field">${meta.no.proximo||meta.no.esquerda||'prox'}: <b>${nextAddr}</b></div>
      `;
      container.appendChild(card);
    });
  } else if(snapshot && typeof snapshot === 'object' && 'valor' in snapshot){
    // tree: traverse to collect nodes
    const nodes = [];
    function traverse(n){
      if(!n) return;
      nodes.push(n);
      traverse(n.esq);
      traverse(n.dir);
    }
    traverse(snapshot);
    nodes.forEach((n, idx)=>{
      const addr = '0x'+String(idx+1).padStart(3,'0');
      const card = document.createElement('div');
      card.className='memory-card';
      card.innerHTML = `
        <div class="addr">${addr}</div>
        <div class="field">${meta.no.valor||'valor'}: <b>${n.valor}</b></div>
        <div class="field">${meta.no.esquerda||'esquerda'}: <b>${n.esq ? '0x...': 'NULL'}</b></div>
        <div class="field">${meta.no.direita||'direita'}: <b>${n.dir ? '0x...': 'NULL'}</b></div>
      `;
      container.appendChild(card);
    });
  }
}
