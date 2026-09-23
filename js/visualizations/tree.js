function collectNodes(root, showNIL=false){
  const nodes=[];
  const edges=[];
  if(!root) return {nodes, edges};
  // detectar RBT (tem cor)
  const isRBT = root && (root.cor !== undefined);
  const doShowNIL = showNIL || isRBT;
  let inorderIdx=0;
  const posMap=new Map();
  function inorder(n, depth){
    if(!n) return;
    // para RBT, NIL não entra no inorder (são folhas virtuais)
    if(n.isNIL) return;
    inorder(n.esq, depth+1);
    posMap.set(n, { x: inorderIdx++, y: depth });
    inorder(n.dir, depth+1);
  }
  inorder(root,0);
  function traverse(n, parent){
    if(!n) return;
    const p = posMap.get(n);
    // se não tem pos (NIL isolado), criar pos provisória
    const pos = p || {x: inorderIdx++, y: (parent ? posMap.get(parent).y+1 : 0)};
    if(!p) posMap.set(n, pos);
    nodes.push({ n, x:pos.x, y:pos.y, parent });
    const left = n.esq;
    const right = n.dir;
    if(left){
      edges.push({ from:n, to:left });
      traverse(left, n);
    } else if(doShowNIL){
      const nilNode = {valor:'NIL', isNIL:true, cor:'BLACK'};
      const nilPos = {x: pos.x - 0.5, y: pos.y+1};
      // ajustar inorder para NIL: usar pos.x -0.5
      nodes.push({ n:nilNode, x:nilPos.x, y:nilPos.y, parent:n, isNIL:true });
      edges.push({ from:n, to:nilNode });
    }
    if(right){
      edges.push({ from:n, to:right });
      traverse(right, n);
    } else if(doShowNIL){
      const nilNode2 = {valor:'NIL', isNIL:true, cor:'BLACK'};
      const nilPos2 = {x: pos.x + 0.5, y: pos.y+1};
      nodes.push({ n:nilNode2, x:nilPos2.x, y:nilPos2.y, parent:n, isNIL:true });
      edges.push({ from:n, to:nilNode2 });
    }
  }
  traverse(root,null);
  // recalcular width para incluir NILs
  const maxX = Math.max(...nodes.map(d=>d.x), inorderIdx);
  return { nodes, edges, width: Math.ceil(maxX+1) };
}

export function renderTree(container, root, meta, step){
  container.innerHTML='';
  if(!root){
    container.innerHTML = `<div style="color:var(--text-muted);font-size:13px"><span style="color:var(--accent);font-weight:600">${meta.ponteiros.raiz||'raiz'}</span> → <span class="null-box">NULL</span> (árvore vazia)</div>`;
    return;
  }

  const { nodes, edges, width } = collectNodes(root);
  const maxY = Math.max(...nodes.map(d=>d.y));
  const nodeSpacingX = 78;
  const nodeSpacingY = 72;
  const margin = 30;
  const svgW = Math.max(320, width * nodeSpacingX + margin*2);
  const svgH = (maxY+1)*nodeSpacingY + margin*2 + 20;

  const wrap = document.createElement('div');
  wrap.className='tree-svg-wrap';
  const svgNS='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(svgNS,'svg');
  svg.setAttribute('width', svgW);
  svg.setAttribute('height', svgH);
  svg.setAttribute('class','tree-svg');
  svg.style.minWidth = svgW+'px';

  // edges - com trilha highlightPath
  edges.forEach(e=>{
    const fromPos = nodes.find(d=>d.n===e.from);
    const toPos = nodes.find(d=>d.n===e.to);
    const x1 = margin + fromPos.x*nodeSpacingX + 28;
    const y1 = margin + fromPos.y*nodeSpacingY + 28;
    const x2 = margin + toPos.x*nodeSpacingX + 28;
    const y2 = margin + toPos.y*nodeSpacingY + 28;
    const line=document.createElementNS(svgNS,'line');
    line.setAttribute('x1',x1); line.setAttribute('y1',y1);
    line.setAttribute('x2',x2); line.setAttribute('y2',y2);
    const isActiveEdge = step && step.activeValue!==undefined && (e.from.valor===step.activeValue || e.to.valor===step.activeValue);
    const isInPath = step && step.highlightPath && step.highlightPath.includes(e.from.valor) && step.highlightPath.includes(e.to.valor);
    let cls='tree-edge';
    if(isActiveEdge) cls+=' active';
    else if(isInPath) cls+=' in-path';
    line.setAttribute('class',cls);
    svg.appendChild(line);
  });

  // nodes - com trilha e RBT cores
  const isRBT = root && root.cor !== undefined;
  nodes.forEach(d=>{
    const cx = margin + d.x*nodeSpacingX + 28;
    const cy = margin + d.y*nodeSpacingY + 28;
    const isActive = step && step.activeValue===d.n.valor;
    const isInPath = step && step.highlightPath && step.highlightPath.includes(d.n.valor);
    const isNIL = d.n.isNIL || d.isNIL;
    const g=document.createElementNS(svgNS,'g');
    const circle=document.createElementNS(svgNS,'circle');
    circle.setAttribute('cx',cx); circle.setAttribute('cy',cy);
    if(isNIL){
      circle.setAttribute('r',18);
      circle.setAttribute('fill', '#0f172a');
      circle.setAttribute('stroke', '#475569');
      circle.setAttribute('stroke-width', '1.2');
      circle.setAttribute('stroke-dasharray', '4 3');
      circle.setAttribute('opacity', '0.7');
    } else if(isRBT){
      const cor = d.n.cor;
      const isRed = cor === 'RED' || cor === 1 || cor === 'VERMELHO' || cor === 'R' || cor === '1';
      const isActiveRed = isActive;
      if(isActive){
        circle.setAttribute('r',26);
        circle.setAttribute('fill', isRed ? '#dc2626' : '#111827');
        circle.setAttribute('stroke', isRed ? '#ef4444' : '#374151');
        circle.setAttribute('stroke-width', '3');
        circle.setAttribute('filter','drop-shadow(0 0 8px rgba(239,68,68,.5))');
      } else if(isInPath){
        circle.setAttribute('r',26);
        circle.setAttribute('fill', isRed ? 'rgba(220,38,38,0.18)' : 'rgba(17,24,39,0.9)');
        circle.setAttribute('stroke', isRed ? '#ef4444' : '#475569');
        circle.setAttribute('stroke-width', '2.2');
      } else {
        circle.setAttribute('r',26);
        circle.setAttribute('fill', isRed ? '#dc2626' : '#111827');
        circle.setAttribute('stroke', isRed ? '#991b1b' : '#1f2937');
        circle.setAttribute('stroke-width', '1.5');
      }
    } else if(isActive){
      circle.setAttribute('r',26);
      circle.setAttribute('fill', '#fbbf24');
      circle.setAttribute('stroke', '#f59e0b');
      circle.setAttribute('stroke-width', '3');
      circle.setAttribute('filter','drop-shadow(0 0 8px rgba(251,191,36,.6))');
    } else if(isInPath){
      circle.setAttribute('r',26);
      circle.setAttribute('fill', 'rgba(56,189,248,0.18)');
      circle.setAttribute('stroke', '#38bdf8');
      circle.setAttribute('stroke-width', '2.2');
    } else {
      circle.setAttribute('r',26);
      circle.setAttribute('fill', '#1e293b');
      circle.setAttribute('stroke', '#475569');
      circle.setAttribute('stroke-width', '1.5');
    }
    svg.appendChild(circle);
    const text=document.createElementNS(svgNS,'text');
    text.setAttribute('x',cx); text.setAttribute('y', isNIL ? cy+4 : (isRBT ? cy+2 : cy+5));
    text.setAttribute('text-anchor','middle');
    if(isNIL){
      text.setAttribute('fill', '#64748b');
      text.setAttribute('font-size','9');
      text.setAttribute('font-weight','600');
      text.textContent = 'NIL';
    } else {
      text.setAttribute('fill', isActive ? '#0f172a' : '#e2e8f0');
      text.setAttribute('font-size','13');
      text.setAttribute('font-weight','700');
      text.textContent = d.n.valor;
    }
    text.setAttribute('font-family','ui-monospace, monospace');
    svg.appendChild(text);
    // R/B label para RBT
    if(isRBT && !isNIL){
      const cor = d.n.cor;
      const isRed = cor === 'RED' || cor === 1 || cor === 'VERMELHO' || cor === 'R';
      const corLabel=document.createElementNS(svgNS,'text');
      corLabel.setAttribute('x',cx); corLabel.setAttribute('y',cy+16);
      corLabel.setAttribute('text-anchor','middle');
      corLabel.setAttribute('fill', isRed ? '#fecaca' : '#94a3b8');
      corLabel.setAttribute('font-size','8');
      corLabel.setAttribute('font-weight','700');
      corLabel.textContent = isRed ? 'R' : 'B';
      svg.appendChild(corLabel);
    }
    // raiz label
    if(!d.parent){
      const raizLab=document.createElementNS(svgNS,'text');
      raizLab.setAttribute('x',cx); raizLab.setAttribute('y',cy-38);
      raizLab.setAttribute('text-anchor','middle');
      raizLab.setAttribute('fill','#38bdf8');
      raizLab.setAttribute('font-size','11');
      raizLab.setAttribute('font-weight','600');
      raizLab.textContent = meta.ponteiros.raiz||'raiz';
      svg.appendChild(raizLab);
      const arrow=document.createElementNS(svgNS,'text');
      arrow.setAttribute('x',cx); arrow.setAttribute('y',cy-26);
      arrow.setAttribute('text-anchor','middle');
      arrow.setAttribute('fill','#38bdf8');
      arrow.setAttribute('font-size','12');
      arrow.textContent='↓';
      svg.appendChild(arrow);
    }
  });

  wrap.appendChild(svg);
  container.appendChild(wrap);

  // trilha da descida (highlightPath)
  if(step && step.highlightPath && step.highlightPath.length>1){
    const div=document.createElement('div');
    div.className='traversal-result';
    div.style.cssText='margin-top:8px;font-size:12px;color:var(--text-muted)';
    div.innerHTML = `Descida: <b style="color:var(--accent)">${step.highlightPath.join(' → ')}</b>`;
    container.appendChild(div);
  }

  // traversal partial result
  if(step && step.resultadoParcial){
    const div=document.createElement('div');
    div.className='traversal-result';
    div.innerHTML = `Resultado parcial: <b>[${step.resultadoParcial.join(', ')}]</b>`;
    container.appendChild(div);
  }
}
