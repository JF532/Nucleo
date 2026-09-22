import { initEditor, examples } from './editor.js';
import { analyze } from './analyzer/detector.js';
import { History } from './engine/history.js';
import { renderMemory } from './engine/memory.js';
import {
  stepsListaInserirInicio, stepsListaInserirFim, stepsListaInserirMeio,
  stepsListaRemoverInicio, stepsListaRemoverFim, stepsListaRemoverMeio,
  stepsBusca, stepsDuplaInserirMeio,
  stepsPilhaPush, stepsPilhaPop,
  stepsFilaEnqueue, stepsFilaDequeue,
  stepsTreeInsert, stepsTraversal, stepsTreeSearch, stepsTreeRemove,
  cloneTree
} from './engine/steps.js';
import { renderLista } from './visualizations/list.js';
import { renderDupla } from './visualizations/doubly.js';
import { renderPilha } from './visualizations/stack.js';
import { renderFila } from './visualizations/queue.js';
import { renderTree } from './visualizations/tree.js';

const textarea = document.getElementById('codeInput');
const gutter = document.getElementById('gutter');
const highlightEl = document.getElementById('highlightCode');
const btnAnalyze = document.getElementById('btnAnalyze');
const btnClear = document.getElementById('btnClear');
const exampleSelect = document.getElementById('exampleSelect');
const detectionBanner = document.getElementById('detectionBanner');
const detectionTitle = document.getElementById('detectionTitle');
const detectionDesc = document.getElementById('detectionDesc');
const detectionAmbiguous = document.getElementById('detectionAmbiguous');
const workspace = document.getElementById('workspace');
const visualization = document.getElementById('visualization');
const operationsDiv = document.getElementById('operations');
const analyzedCode = document.getElementById('analyzedCode');
const memoryView = document.getElementById('memoryView');
const memoryToggle = document.getElementById('memoryToggle');
const stepInfo = document.getElementById('stepInfo');
const stepTitle = document.getElementById('stepTitle');
const stepCode = document.getElementById('stepCode');
const stepExplanation = document.getElementById('stepExplanation');
const stepPointers = document.getElementById('stepPointers');
const stepCounter = document.getElementById('stepCounter');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const btnPlay = document.getElementById('btnPlay');
const btnReset = document.getElementById('btnReset');

const { updateHighlight } = initEditor({ textarea, gutter, highlightEl });

let currentMeta=null;
let currentTipo=null;
let history=new History();
let appState = { lista:[], arvore:null }; // unified
let isBST=false;

// memory toggle
memoryToggle.addEventListener('click', ()=>{
  const isHidden = memoryView.classList.toggle('hidden');
  memoryToggle.classList.toggle('collapsed', isHidden);
});

// examples
exampleSelect.addEventListener('change', ()=>{
  const key=exampleSelect.value;
  if(!key) return;
  textarea.value = examples[key];
  textarea.dispatchEvent(new Event('input'));
  updateHighlight();
});

// clear
btnClear.addEventListener('click', ()=>{
  textarea.value='';
  textarea.dispatchEvent(new Event('input'));
  updateHighlight();
  detectionBanner.classList.add('hidden');
  workspace.classList.add('hidden');
  exampleSelect.value='';
});

// Analyze
btnAnalyze.addEventListener('click', ()=>{
  const code = textarea.value;
  const result = analyze(code);
  console.log('[analyzer]', result);
  // show banner
  detectionBanner.classList.remove('hidden','ambiguous');
  if(result.tipo){
    detectionBanner.classList.remove('ambiguous');
    detectionTitle.textContent = '✓ Estrutura detectada';
    detectionDesc.innerHTML = `<b style="color:var(--accent);font-size:16px">${result.label}</b><br>${result.descricao}`;
  } else {
    detectionBanner.classList.add('ambiguous');
    detectionTitle.textContent = '⚠ Não identificado com segurança';
    detectionDesc.textContent = result.descricao;
  }
  if(result.ambiguo && result.ambiguo.length){
    detectionAmbiguous.classList.remove('hidden');
    const labels = result.ambiguo.map(k=>{
      const map={lista_simples:'Lista simplesmente encadeada',lista_dupla:'Lista duplamente encadeada',pilha:'Pilha',fila:'Fila',arvore_binaria:'Árvore binária',bst:'BST'};
      return map[k]||k;
    });
    detectionAmbiguous.textContent = `Possibilidades: ${labels.join(' • ')}`;
    detectionBanner.classList.add('ambiguous');
  } else {
    detectionAmbiguous.classList.add('hidden');
  }

  // analyzed code
  analyzedCode.querySelector('code').textContent = code || '// (vazio)';
  if(typeof window.hljs !== 'undefined') {
    try{ window.hljs.highlightElement(analyzedCode.querySelector('code')); } catch(e){}
  }

  if(!result.tipo){
    workspace.classList.add('hidden');
    return;
  }

  currentMeta = result.meta;
  currentTipo = result.tipo;
  isBST = result.tipo==='bst';
  // reset state with demo data
  if(['lista_simples','lista_dupla','pilha','fila'].includes(currentTipo)){
    appState.lista = [10,20,30];
    appState.arvore = null;
  } else {
    appState.lista = [];
    // build demo tree: 50,30,70,20,40,60,80
    let root=null;
    const vals=[50,30,70,20,40,60,80];
    // use BST insert for both to get balanced demo, but for arvore_binaria still show same shape
    // We'll construct via isBST logic using steps logic? simple manual
    function insert(root,v){
      if(!root) return {valor:v,esq:null,dir:null};
      if(v < root.valor) root.esq = insert(root.esq,v);
      else root.dir = insert(root.dir,v);
      return root;
    }
    vals.forEach(v=> root=insert(root,v));
    appState.arvore = root;
  }

  workspace.classList.remove('hidden');
  buildOperations();
  // initial render without steps
  renderCurrent(null);
});

function buildOperations(){
  operationsDiv.innerHTML='';
  const tipo=currentTipo;
  const meta=currentMeta;

  function addGroup(title, html){
    const g=document.createElement('div');
    g.className='op-group';
    g.innerHTML=`<h4>${title}</h4>${html}`;
    operationsDiv.appendChild(g);
    return g;
  }

  if(tipo==='lista_simples'){
    const g1=addGroup('Inserir', `
      <div class="op-row"><input id="inValor" type="number" placeholder="valor"><select id="inPos"><option value="inicio">Início</option><option value="fim">Fim</option><option value="meio">Meio</option></select><input id="inMeioPos" type="number" placeholder="pos" style="display:none;width:70px"><button class="btn btn-primary" id="btnInserir">Inserir</button></div>
      <div class="op-row" style="margin-top:8px"><input id="remPos" type="number" placeholder="pos (0..n)"><button class="btn btn-ghost" id="btnRemover">Remover</button><button class="btn btn-ghost" id="btnRemIni">Remover início</button><button class="btn btn-ghost" id="btnRemFim">Remover fim</button></div>
      <div class="op-row" style="margin-top:8px"><input id="buscaValor" type="number" placeholder="buscar valor"><button class="btn btn-ghost" id="btnBuscar">Buscar</button></div>
    `);
    g1.querySelector('#inPos').addEventListener('change', (e)=>{
      const show = e.target.value==='meio';
      g1.querySelector('#inMeioPos').style.display = show?'block':'none';
    });
    g1.querySelector('#btnInserir').addEventListener('click', ()=>{
      const v=parseInt(g1.querySelector('#inValor').value,10);
      if(isNaN(v)) return alert('Informe valor numérico');
      const posSel=g1.querySelector('#inPos').value;
      let res;
      if(posSel==='inicio') res=stepsListaInserirInicio(appState.lista, v, meta);
      else if(posSel==='fim') res=stepsListaInserirFim(appState.lista, v, meta);
      else {
        const p=parseInt(g1.querySelector('#inMeioPos').value,10);
        if(isNaN(p)) return alert('Informe posição para inserção no meio');
        res=stepsListaInserirMeio(appState.lista, v, p, meta);
      }
      appState.lista = res.newState;
      startSteps(res.steps, appState.lista);
    });
    g1.querySelector('#btnRemIni').addEventListener('click', ()=>{
      const res=stepsListaRemoverInicio(appState.lista, meta);
      appState.lista=res.newState;
      startSteps(res.steps, appState.lista);
    });
    g1.querySelector('#btnRemFim').addEventListener('click', ()=>{
      const res=stepsListaRemoverFim(appState.lista, meta);
      appState.lista=res.newState;
      startSteps(res.steps, appState.lista);
    });
    g1.querySelector('#btnRemover').addEventListener('click', ()=>{
      const p=parseInt(g1.querySelector('#remPos').value,10);
      if(isNaN(p)) return alert('Informe posição');
      const res=stepsListaRemoverMeio(appState.lista, p, meta);
      appState.lista=res.newState;
      startSteps(res.steps, appState.lista);
    });
    g1.querySelector('#btnBuscar').addEventListener('click', ()=>{
      const v=parseInt(g1.querySelector('#buscaValor').value,10);
      if(isNaN(v)) return alert('Informe valor');
      const res=stepsBusca(appState.lista, v);
      // busca não altera estado
      startSteps(res.steps, appState.lista, true);
    });

  } else if(tipo==='lista_dupla'){
    const g1=addGroup('Lista duplamente encadeada — Inserir/Remover', `
      <div class="op-row"><input id="inValor" type="number" placeholder="valor"><select id="inPos"><option value="inicio">Início</option><option value="fim">Fim</option><option value="meio">Meio</option></select><input id="inMeioPos" type="number" placeholder="pos" style="display:none;width:70px"><button class="btn btn-primary" id="btnInserir">Inserir</button></div>
      <div class="op-row" style="margin-top:8px"><input id="remPos" type="number" placeholder="pos"><button class="btn btn-ghost" id="btnRemover">Remover</button><button class="btn btn-ghost" id="btnRemIni">Remover início</button><button class="btn btn-ghost" id="btnRemFim">Remover fim</button></div>
      <div class="op-row" style="margin-top:8px"><input id="buscaValor" type="number" placeholder="buscar"><button class="btn btn-ghost" id="btnBuscar">Buscar</button></div>
    `);
    g1.querySelector('#inPos').addEventListener('change', e=>{
      g1.querySelector('#inMeioPos').style.display = e.target.value==='meio'?'block':'none';
    });
    g1.querySelector('#btnInserir').addEventListener('click', ()=>{
      const v=parseInt(g1.querySelector('#inValor').value,10);
      if(isNaN(v)) return alert('Valor?');
      const sel=g1.querySelector('#inPos').value;
      let res;
      if(sel==='inicio') res=stepsListaInserirInicio(appState.lista, v, meta);
      else if(sel==='fim') res=stepsListaInserirFim(appState.lista, v, meta);
      else {
        const p=parseInt(g1.querySelector('#inMeioPos').value,10);
        if(isNaN(p)) return alert('Posição?');
        res=stepsDuplaInserirMeio(appState.lista, v, p, meta);
      }
      appState.lista=res.newState;
      startSteps(res.steps, appState.lista);
    });
    g1.querySelector('#btnRemIni').addEventListener('click', ()=>{
      const res=stepsListaRemoverInicio(appState.lista, meta);
      appState.lista=res.newState; startSteps(res.steps, appState.lista);
    });
    g1.querySelector('#btnRemFim').addEventListener('click', ()=>{
      const res=stepsListaRemoverFim(appState.lista, meta);
      appState.lista=res.newState; startSteps(res.steps, appState.lista);
    });
    g1.querySelector('#btnRemover').addEventListener('click', ()=>{
      const p=parseInt(g1.querySelector('#remPos').value,10);
      if(isNaN(p)) return alert('Posição?');
      const res=stepsListaRemoverMeio(appState.lista,p,meta);
      appState.lista=res.newState; startSteps(res.steps, appState.lista);
    });
    g1.querySelector('#btnBuscar').addEventListener('click', ()=>{
      const v=parseInt(g1.querySelector('#buscaValor').value,10);
      if(isNaN(v)) return alert('Valor?');
      const res=stepsBusca(appState.lista,v);
      startSteps(res.steps, appState.lista, true);
    });

  } else if(tipo==='pilha'){
    const g1=addGroup('Pilha (LIFO)', `
      <div class="op-row"><input id="pushValor" type="number" placeholder="valor"><button class="btn btn-primary" id="btnPush">Empilhar (push)</button></div>
      <div class="op-row" style="margin-top:8px"><button class="btn btn-ghost" id="btnPop">Desempilhar (pop)</button><button class="btn btn-ghost" id="btnTopo">Consultar topo</button><button class="btn btn-ghost" id="btnBuscar">Buscar</button><input id="buscaValor" type="number" placeholder="valor buscar" style="width:120px"></div>
    `);
    g1.querySelector('#btnPush').addEventListener('click', ()=>{
      const v=parseInt(g1.querySelector('#pushValor').value,10);
      if(isNaN(v)) return alert('Valor?');
      const res=stepsPilhaPush(appState.lista, v, meta);
      appState.lista=res.newState; startSteps(res.steps, appState.lista);
    });
    g1.querySelector('#btnPop').addEventListener('click', ()=>{
      if(appState.lista.length===0) return alert('Pilha vazia');
      const res=stepsPilhaPop(appState.lista, meta);
      appState.lista=res.newState; startSteps(res.steps, appState.lista);
    });
    g1.querySelector('#btnTopo').addEventListener('click', ()=>{
      if(appState.lista.length===0) return alert('Pilha vazia');
      const steps=[{titulo:'Consultar topo',codigo:`int v = topo->${meta.no.valor||'valor'};`,explicacao:`Topo da pilha é ${appState.lista[0]}.`,ponteirosAlterados:meta.ponteiroPrincipal||'topo',snapshot:[...appState.lista],highlightIndex:0}];
      startSteps(steps, appState.lista, true);
    });
    g1.querySelector('#btnBuscar').addEventListener('click', ()=>{
      const v=parseInt(g1.querySelector('#buscaValor').value,10);
      if(isNaN(v)) return alert('Valor?');
      const res=stepsBusca(appState.lista,v);
      startSteps(res.steps, appState.lista, true);
    });

  } else if(tipo==='fila'){
    const g1=addGroup('Fila (FIFO)', `
      <div class="op-row"><input id="enqValor" type="number" placeholder="valor"><button class="btn btn-primary" id="btnEnq">Enfileirar (enqueue)</button></div>
      <div class="op-row" style="margin-top:8px"><button class="btn btn-ghost" id="btnDeq">Desenfileirar (dequeue)</button><button class="btn btn-ghost" id="btnInicio">Consultar início</button><button class="btn btn-ghost" id="btnFim">Consultar fim</button></div>
      <div class="op-row" style="margin-top:8px"><input id="buscaValor" type="number" placeholder="buscar"><button class="btn btn-ghost" id="btnBuscar">Buscar</button></div>
    `);
    g1.querySelector('#btnEnq').addEventListener('click', ()=>{
      const v=parseInt(g1.querySelector('#enqValor').value,10);
      if(isNaN(v)) return alert('Valor?');
      const res=stepsFilaEnqueue(appState.lista, v, meta);
      appState.lista=res.newState; startSteps(res.steps, appState.lista);
    });
    g1.querySelector('#btnDeq').addEventListener('click', ()=>{
      if(appState.lista.length===0) return alert('Fila vazia');
      const res=stepsFilaDequeue(appState.lista, meta);
      appState.lista=res.newState; startSteps(res.steps, appState.lista);
    });
    g1.querySelector('#btnInicio').addEventListener('click', ()=>{
      if(appState.lista.length===0) return alert('Fila vazia');
      const steps=[{titulo:'Consultar início',codigo:`int v = inicio->${meta.no.valor||'valor'};`,explicacao:`Início da fila: ${appState.lista[0]}`,ponteirosAlterados:meta.ponteiros.inicio||'inicio',snapshot:[...appState.lista],highlightIndex:0}];
      startSteps(steps, appState.lista, true);
    });
    g1.querySelector('#btnFim').addEventListener('click', ()=>{
      if(appState.lista.length===0) return alert('Fila vazia');
      const steps=[{titulo:'Consultar fim',codigo:`int v = fim->${meta.no.valor||'valor'};`,explicacao:`Fim da fila: ${appState.lista[appState.lista.length-1]}`,ponteirosAlterados:meta.ponteiros.fim||'fim',snapshot:[...appState.lista],highlightIndex:appState.lista.length-1}];
      startSteps(steps, appState.lista, true);
    });
    g1.querySelector('#btnBuscar').addEventListener('click', ()=>{
      const v=parseInt(g1.querySelector('#buscaValor').value,10);
      if(isNaN(v)) return alert('Valor?');
      const res=stepsBusca(appState.lista,v);
      startSteps(res.steps, appState.lista, true);
    });

  } else if(tipo==='arvore_binaria' || tipo==='bst'){
    const g1=addGroup('Árvore — Inserir / Remover / Buscar', `
      <div class="op-row"><input id="treeValor" type="number" placeholder="valor"><button class="btn btn-primary" id="btnTreeIns">Inserir</button><button class="btn btn-ghost" id="btnTreeRem">Remover</button></div>
      <div class="op-row" style="margin-top:8px"><input id="treeBusca" type="number" placeholder="buscar"><button class="btn btn-ghost" id="btnTreeBusca">Buscar</button></div>
      <div class="op-row" style="margin-top:8px"><button class="btn btn-ghost" id="btnPre">Pré-ordem</button><button class="btn btn-ghost" id="btnIn">Em ordem</button><button class="btn btn-ghost" id="btnPos">Pós-ordem</button></div>
    `);
    g1.querySelector('#btnTreeIns').addEventListener('click', ()=>{
      const v=parseInt(g1.querySelector('#treeValor').value,10);
      if(isNaN(v)) return alert('Valor?');
      // clone before to avoid mutation issues in steps
      let rootClone = appState.arvore ? cloneTree(appState.arvore) : null;
      const res=stepsTreeInsert(rootClone, v, isBST, meta);
      appState.arvore = res.newState;
      startSteps(res.steps, appState.arvore);
    });
    g1.querySelector('#btnTreeRem').addEventListener('click', ()=>{
      const v=parseInt(g1.querySelector('#treeValor').value,10);
      if(isNaN(v)) return alert('Informe valor a remover');
      const res=stepsTreeRemove(appState.arvore ? cloneTree(appState.arvore) : null, v, meta);
      // for tree remove, we need to set new root accordingly
      // stepsTreeRemove already clones; use returned newState
      // But if not found, keep same
      // We need to handle: res.newState is the new tree after removal (or cloned)
      // So assign directly from a fresh remove on actual state
      if(res.newState !== appState.arvore){
        // res was on clone, but we need to apply to real
        // Do actual removal on live tree
        const liveClone = appState.arvore ? cloneTree(appState.arvore) : null;
        const liveRes = stepsTreeRemove(liveClone, v, meta);
        appState.arvore = liveRes.newState;
        startSteps(liveRes.steps, appState.arvore);
      } else {
        startSteps(res.steps, appState.arvore, true);
      }
    });
    g1.querySelector('#btnTreeBusca').addEventListener('click', ()=>{
      const v=parseInt(g1.querySelector('#treeBusca').value,10);
      if(isNaN(v)) return alert('Valor?');
      const res=stepsTreeSearch(appState.arvore ? cloneTree(appState.arvore) : null, v, isBST, meta);
      startSteps(res.steps, appState.arvore, true);
    });
    g1.querySelector('#btnPre').addEventListener('click', ()=>{
      const res=stepsTraversal(appState.arvore ? cloneTree(appState.arvore) : null, 'pre');
      startSteps(res.steps, appState.arvore, true);
    });
    g1.querySelector('#btnIn').addEventListener('click', ()=>{
      const res=stepsTraversal(appState.arvore ? cloneTree(appState.arvore) : null, 'in');
      startSteps(res.steps, appState.arvore, true);
    });
    g1.querySelector('#btnPos').addEventListener('click', ()=>{
      const res=stepsTraversal(appState.arvore ? cloneTree(appState.arvore) : null, 'pos');
      startSteps(res.steps, appState.arvore, true);
    });
  }
}

let lastSnapshotForMemory=null;

function startSteps(steps, finalSnapshot, keepFinal=false){
  // finalSnapshot is the state after operation; steps already contain intermediate snapshots
  // For memory we want to reflect current appState after steps complete
  history.setSteps(steps);
  if(steps.length){
    renderStep(0);
    updateControls();
  }
  // store final for memory after steps
  lastSnapshotForMemory = finalSnapshot;
  // also immediately ensure memory shows final after steps? We'll update on each step
}

function renderCurrent(stepOverride){
  const step = stepOverride || history.current();
  let snapshot;
  if(step && step.snapshot){
    snapshot = step.snapshot;
  } else {
    snapshot = currentTipo && currentTipo.includes('arvore') ? appState.arvore : appState.lista;
  }
  // render visualization
  if(['lista_simples'].includes(currentTipo)) renderLista(visualization, snapshot, currentMeta, step);
  else if(currentTipo==='lista_dupla') renderDupla(visualization, snapshot, currentMeta, step);
  else if(currentTipo==='pilha') renderPilha(visualization, snapshot, currentMeta, step);
  else if(currentTipo==='fila') renderFila(visualization, snapshot, currentMeta, step);
  else if(currentTipo==='arvore_binaria' || currentTipo==='bst') renderTree(visualization, snapshot, currentMeta, step);

  // memory
  renderMemory(memoryView, snapshot, currentMeta);

  // step info
  if(step){
    stepInfo.classList.remove('hidden');
    stepTitle.textContent = step.titulo||'';
    stepCode.textContent = step.codigo||'';
    stepExplanation.textContent = step.explicacao||'';
    stepPointers.textContent = step.ponteirosAlterados ? `Ponteiros: ${step.ponteirosAlterados}` : '';
    if(typeof window.hljs !== 'undefined' && stepCode.textContent){
      // no highlight for step (plain), but keep style
    }
  } else {
    stepInfo.classList.add('hidden');
  }
}

function renderStep(idx){
  const step = history.steps[idx];
  if(!step) return;
  // update history index manually if needed
  history.index = idx;
  renderCurrent(step);
  updateControls();
}
function updateControls(){
  stepCounter.textContent = history.steps.length ? `Passo ${history.index+1} / ${history.steps.length}` : '';
  btnPrev.disabled = history.index<=0;
  btnNext.disabled = history.index>=history.steps.length-1;
  btnPlay.textContent = history.isPlaying ? '⏸ Pausar' : '▶ Executar';
}

btnPrev.addEventListener('click', ()=>{
  const s=history.prev();
  if(s!==null) renderCurrent(s);
  updateControls();
});
btnNext.addEventListener('click', ()=>{
  const s=history.next();
  if(s!==null) renderCurrent(s);
  updateControls();
});
btnReset.addEventListener('click', ()=>{
  history.reset();
  renderCurrent(history.current());
  updateControls();
  history.stop();
  updateControls();
});
btnPlay.addEventListener('click', ()=>{
  if(history.isPlaying){
    history.stop(); updateControls();
  } else {
    history.play((step, idx)=>{
      renderCurrent(step);
      updateControls();
    });
    updateControls();
  }
});

// initial demo: load lista simples example but not auto analyze
textarea.value = examples.lista_simples;
textarea.dispatchEvent(new Event('input'));
updateHighlight();
