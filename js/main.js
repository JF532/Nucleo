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
const avatarImg = document.getElementById('avatarImg');
const avatarLabel = document.getElementById('avatarLabel');
const speechBubble = document.querySelector('.speech-bubble');

const { updateHighlight } = initEditor({ textarea, gutter, highlightEl });

let currentMeta=null;
let currentTipo=null;
let history=new History();
let appState = { lista:[], arvore:null };
let isBST=false;

// extrai valores iniciais do codigo do usuario (ex: empilhar(10); empilhar(20); empilhar(40);)
function extractInitialValues(code, tipo){
  const vals=[];
  // procura chamadas com numero literal: func(  123 )
  const reGeral = /(?:empilhar|push|enfileirar|enqueue|inserir|inserir_inicio|inserir_fim|inserir_meio)\s*\(\s*(-?\d+)\s*(?:,|\))/gi;
  let m;
  while((m=reGeral.exec(code))!==null){
    vals.push(parseInt(m[1],10));
  }
  // fallback: se for main com numeros soltos tipo empilhar(40) ja pega; se nada, tenta pegar qualquer numero em chamada de funcao com 1 arg dentro de main
  if(vals.length===0){
    // tenta pegar todos os numeros em chamadas tipo nome( numero )
    const reMain = /\b\w+\s*\(\s*(-?\d+)\s*\)\s*;/g;
    // filtrar apenas se o codigo parece ter pilha/fila: pegar apenas os primeiros 20 valores para nao pegar lixo
    const tmp=[];
    let mm;
    while((mm=reMain.exec(code))!==null){
      // ignora malloc(sizeof) etc - ja filtra por ter apenas numero
      tmp.push(parseInt(mm[1],10));
      if(tmp.length>20) break;
    }
    // se tmp tiver valores e o codigo contem empilhar/push/enqueue, usar tmp
    if(tmp.length>0 && /(empilhar|push|enqueue|enfileirar|inserir)/i.test(code)){
      // para pilha, o ultimo empilhado deve ser o topo (primeiro da lista)
      // vamos manter ordem de aparecimento e inverter para pilha
      return tmp.slice(0,20);
    }
  }
  return vals;
}

// avatares dinamicos
const avatarMap = {
  acenando: 'Avatares/acenando.png',
  pensando: 'Avatares/pensando.png',
  computador: 'Avatares/usando_computador.png',
  joinha: 'Avatares/joinha.png',
  comemorando: 'Avatares/comemorando.png',
  raiva: 'Avatares/raiva.png'
};
function getAvatarForStep(step){
  if(!step) return avatarMap.acenando;
  const t = ((step.titulo||'') + ' ' + (step.explicacao||'')).toLowerCase();
  const code = (step.codigo||'').toLowerCase();
  if(step.notFound || t.includes('não encontrado') || t.includes('nao encontrado') || t.includes('não existe') || t.includes('vazia') || t.includes('nada a remover')) return avatarMap.raiva;
  if(step.found || t.includes('encontrado!') || step.resultadoParcial){
    const isLast = history.index === history.steps.length-1;
    return isLast ? avatarMap.comemorando : avatarMap.joinha;
  }
  if(step.tempNode !== undefined || t.includes('malloc') || t.includes('criar novo') || t.includes('alocar') || code.includes('malloc')) return avatarMap.computador;
  if(step.highlightIndex !== undefined || step.activeValue !== undefined || t.includes('percorrer') || t.includes('comparar') || t.includes('localizar') || t.includes('buscar')) return avatarMap.pensando;
  if(t.includes('atualizar') || t.includes('encadear') || t.includes('inserir') || t.includes('reorganizar') || t.includes('bypass')) return avatarMap.joinha;
  if(history.index===0) return avatarMap.acenando;
  return avatarMap.pensando;
}

// helpers for blur/disabled
function setDisabled(btn, disabled){
  if(!btn) return;
  btn.disabled = disabled;
  btn.classList.toggle('blurred', disabled);
}
function resetOpsBlur(){
  // limpa inputs e volta todos os botoes de operacao para blur
  operationsDiv.querySelectorAll('input').forEach(i=>{ i.value=''; });
  const sel = operationsDiv.querySelector('#inMeioPos');
  if(sel) sel.style.display='none';
  const selPos = operationsDiv.querySelector('#inPos');
  if(selPos) selPos.value='inicio';
  // desabilita todos os botoes de operacao
  operationsDiv.querySelectorAll('.btn').forEach(b=> setDisabled(b,true));
  // pilha: desempilhar/consultar topo nao precisam de input, reabilitar se houver elementos
  if(currentTipo==='pilha' && appState.lista.length>0){
    const btnPop=document.getElementById('btnPop');
    const btnTopo=document.getElementById('btnTopo');
    if(btnPop) setDisabled(btnPop,false);
    if(btnTopo) setDisabled(btnTopo,false);
  }
}

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
  // show banner - apenas label, sem descricao explicativa (requisito)
  detectionBanner.classList.remove('hidden','ambiguous');
  if(result.tipo){
    detectionBanner.classList.remove('ambiguous');
    detectionTitle.textContent = '✓ Estrutura detectada';
    detectionDesc.innerHTML = `<b style="color:var(--accent);font-size:16px">${result.label}</b>`;
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

  analyzedCode.querySelector('code').textContent = code || '// (vazio)';
  if(typeof window.hljs !== 'undefined') {
    try{ window.hljs.highlightElement(analyzedCode.querySelector('code')); } catch(e){}
  }

  if(!result.tipo){
    workspace.classList.add('hidden');
    return;
  }

  // resetar estado anterior (corrige persistencia ao trocar codigo)
  history.stop();
  history.setSteps([]);
  history.index=-1;
  // limpar visualizacao anterior
  if(stepInfo) stepInfo.classList.add('hidden');
  if(stepCounter) stepCounter.textContent='';

  currentMeta = result.meta;
  currentTipo = result.tipo;
  isBST = result.tipo==='bst';
  // extrair valores reais do codigo do usuario, se houver
  const extracted = extractInitialValues(code, currentTipo);
  if(['lista_simples','lista_dupla','pilha','fila'].includes(currentTipo)){
    if(extracted.length>0){
      if(currentTipo==='pilha'){
        // pilha: ultimo empilhado é topo -> inverter ordem de aparecimento
        appState.lista = [...extracted].reverse();
      } else {
        appState.lista = [...extracted];
      }
    } else {
      // fallback demo apenas se o codigo for um dos exemplos (contem struct mas sem chamadas com valor)
      // para codigo custom sem valores, comeca vazio para nao confundir
      const isExampleCode = Object.values(examples).some(ex => code.trim()===ex.trim());
      appState.lista = isExampleCode ? [10,20,30] : [];
      // se for pilha custom sem valores, manter vazio para usuario inserir
      if(!isExampleCode && extracted.length===0) appState.lista = [];
    }
    appState.arvore = null;
  } else {
    appState.lista = [];
    let root=null;
    function insert(root,v){
      if(!root) return {valor:v,esq:null,dir:null};
      if(v < root.valor) root.esq = insert(root.esq,v);
      else root.dir = insert(root.dir,v);
      return root;
    }
    if(extracted.length>0){
      extracted.forEach(v=> root=insert(root,v));
    } else {
      const vals=[50,30,70,20,40,60,80];
      vals.forEach(v=> root=insert(root,v));
    }
    appState.arvore = root;
  }

  workspace.classList.remove('hidden');
  buildOperations();
  renderCurrent(null);
  updateControls();
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
    const inValor=g1.querySelector('#inValor');
    const inPos=g1.querySelector('#inPos');
    const inMeioPos=g1.querySelector('#inMeioPos');
    const btnInserir=g1.querySelector('#btnInserir');
    const remPos=g1.querySelector('#remPos');
    const btnRemover=g1.querySelector('#btnRemover');
    const btnRemIni=g1.querySelector('#btnRemIni');
    const btnRemFim=g1.querySelector('#btnRemFim');
    const buscaValor=g1.querySelector('#buscaValor');
    const btnBuscar=g1.querySelector('#btnBuscar');

    function updateInserir(){
      const hasValor = inValor.value.trim()!=='' && !isNaN(parseInt(inValor.value,10));
      const isMeio = inPos.value==='meio';
      const hasPos = !isMeio || (inMeioPos.value.trim()!=='' && !isNaN(parseInt(inMeioPos.value,10)));
      setDisabled(btnInserir, !(hasValor && hasPos));
    }
    function updateRemover(){ setDisabled(btnRemover, remPos.value.trim()==='' || isNaN(parseInt(remPos.value,10))); }
    function updateBuscar(){ setDisabled(btnBuscar, buscaValor.value.trim()==='' || isNaN(parseInt(buscaValor.value,10))); }
    // botoes sem input mantem blurred ate haver valor em algum input (requisito)
    function updateSemInput(){
      const anyHas = inValor.value.trim()!=='' || remPos.value.trim()!=='' || buscaValor.value.trim()!=='';
      // Se nenhum input preenchido, blur tambem nos sem-input
      if(!anyHas){ setDisabled(btnRemIni,true); setDisabled(btnRemFim,true); }
      else { setDisabled(btnRemIni,false); setDisabled(btnRemFim,false); }
    }
    [inValor,inPos,inMeioPos].forEach(el=>{ el.addEventListener('input', ()=>{ updateInserir(); updateSemInput(); }); el.addEventListener('change', ()=>{ updateInserir(); updateSemInput(); }); });
    remPos.addEventListener('input', ()=>{ updateRemover(); updateSemInput(); });
    buscaValor.addEventListener('input', ()=>{ updateBuscar(); updateSemInput(); });
    // init state blurred
    setDisabled(btnInserir,true); setDisabled(btnRemover,true); setDisabled(btnBuscar,true);
    setDisabled(btnRemIni,true); setDisabled(btnRemFim,true);

    inPos.addEventListener('change', (e)=>{
      const show = e.target.value==='meio';
      inMeioPos.style.display = show?'block':'none';
      updateInserir();
    });
    btnInserir.addEventListener('click', ()=>{
      const v=parseInt(inValor.value,10);
      if(isNaN(v)) return alert('Informe valor numérico');
      const posSel=inPos.value;
      let res;
      if(posSel==='inicio') res=stepsListaInserirInicio(appState.lista, v, meta);
      else if(posSel==='fim') res=stepsListaInserirFim(appState.lista, v, meta);
      else {
        const p=parseInt(inMeioPos.value,10);
        if(isNaN(p)) return alert('Informe posição para inserção no meio');
        res=stepsListaInserirMeio(appState.lista, v, p, meta);
      }
      appState.lista = res.newState;
      startSteps(res.steps, appState.lista);
    });
    btnRemIni.addEventListener('click', ()=>{
      const res=stepsListaRemoverInicio(appState.lista, meta);
      appState.lista=res.newState;
      startSteps(res.steps, appState.lista);
    });
    btnRemFim.addEventListener('click', ()=>{
      const res=stepsListaRemoverFim(appState.lista, meta);
      appState.lista=res.newState;
      startSteps(res.steps, appState.lista);
    });
    btnRemover.addEventListener('click', ()=>{
      const p=parseInt(remPos.value,10);
      if(isNaN(p)) return alert('Informe posição');
      const res=stepsListaRemoverMeio(appState.lista, p, meta);
      appState.lista=res.newState;
      startSteps(res.steps, appState.lista);
    });
    btnBuscar.addEventListener('click', ()=>{
      const v=parseInt(buscaValor.value,10);
      if(isNaN(v)) return alert('Informe valor');
      const res=stepsBusca(appState.lista, v);
      startSteps(res.steps, appState.lista, true);
    });

  } else if(tipo==='lista_dupla'){
    const g1=addGroup('Lista duplamente encadeada — Inserir/Remover', `
      <div class="op-row"><input id="inValor" type="number" placeholder="valor"><select id="inPos"><option value="inicio">Início</option><option value="fim">Fim</option><option value="meio">Meio</option></select><input id="inMeioPos" type="number" placeholder="pos" style="display:none;width:70px"><button class="btn btn-primary" id="btnInserir">Inserir</button></div>
      <div class="op-row" style="margin-top:8px"><input id="remPos" type="number" placeholder="pos"><button class="btn btn-ghost" id="btnRemover">Remover</button><button class="btn btn-ghost" id="btnRemIni">Remover início</button><button class="btn btn-ghost" id="btnRemFim">Remover fim</button></div>
      <div class="op-row" style="margin-top:8px"><input id="buscaValor" type="number" placeholder="buscar"><button class="btn btn-ghost" id="btnBuscar">Buscar</button></div>
    `);
    const inValor=g1.querySelector('#inValor');
    const inPos=g1.querySelector('#inPos');
    const inMeioPos=g1.querySelector('#inMeioPos');
    const btnInserir=g1.querySelector('#btnInserir');
    const remPos=g1.querySelector('#remPos');
    const btnRemover=g1.querySelector('#btnRemover');
    const btnRemIni=g1.querySelector('#btnRemIni');
    const btnRemFim=g1.querySelector('#btnRemFim');
    const buscaValor=g1.querySelector('#buscaValor');
    const btnBuscar=g1.querySelector('#btnBuscar');
    function updIns(){ const hasV=inValor.value.trim()!=='' && !isNaN(parseInt(inValor.value,10)); const isMeio=inPos.value==='meio'; const hasP=!isMeio || (inMeioPos.value.trim()!=='' && !isNaN(parseInt(inMeioPos.value,10))); setDisabled(btnInserir, !(hasV&&hasP)); }
    function updRem(){ setDisabled(btnRemover, remPos.value.trim()==='' || isNaN(parseInt(remPos.value,10))); }
    function updBus(){ setDisabled(btnBuscar, buscaValor.value.trim()==='' || isNaN(parseInt(buscaValor.value,10))); }
    function updSem(){ const any=inValor.value.trim()!==''||remPos.value.trim()!==''||buscaValor.value.trim()!==''; setDisabled(btnRemIni, !any); setDisabled(btnRemFim, !any); }
    [inValor,inPos,inMeioPos].forEach(el=>{ el.addEventListener('input', ()=>{updIns(); updSem();}); el.addEventListener('change', ()=>{updIns(); updSem();}); });
    remPos.addEventListener('input', ()=>{updRem(); updSem();});
    buscaValor.addEventListener('input', ()=>{updBus(); updSem();});
    setDisabled(btnInserir,true); setDisabled(btnRemover,true); setDisabled(btnBuscar,true); setDisabled(btnRemIni,true); setDisabled(btnRemFim,true);
    inPos.addEventListener('change', e=>{ inMeioPos.style.display = e.target.value==='meio'?'block':'none'; updIns(); });
    btnInserir.addEventListener('click', ()=>{
      const v=parseInt(inValor.value,10);
      if(isNaN(v)) return alert('Valor?');
      const sel=inPos.value;
      let res;
      if(sel==='inicio') res=stepsListaInserirInicio(appState.lista, v, meta);
      else if(sel==='fim') res=stepsListaInserirFim(appState.lista, v, meta);
      else {
        const p=parseInt(inMeioPos.value,10);
        if(isNaN(p)) return alert('Posição?');
        res=stepsDuplaInserirMeio(appState.lista, v, p, meta);
      }
      appState.lista=res.newState;
      startSteps(res.steps, appState.lista);
    });
    btnRemIni.addEventListener('click', ()=>{
      const res=stepsListaRemoverInicio(appState.lista, meta);
      appState.lista=res.newState; startSteps(res.steps, appState.lista);
    });
    btnRemFim.addEventListener('click', ()=>{
      const res=stepsListaRemoverFim(appState.lista, meta);
      appState.lista=res.newState; startSteps(res.steps, appState.lista);
    });
    btnRemover.addEventListener('click', ()=>{
      const p=parseInt(remPos.value,10);
      if(isNaN(p)) return alert('Posição?');
      const res=stepsListaRemoverMeio(appState.lista,p,meta);
      appState.lista=res.newState; startSteps(res.steps, appState.lista);
    });
    btnBuscar.addEventListener('click', ()=>{
      const v=parseInt(buscaValor.value,10);
      if(isNaN(v)) return alert('Valor?');
      const res=stepsBusca(appState.lista,v);
      startSteps(res.steps, appState.lista, true);
    });

  } else if(tipo==='pilha'){
    const g1=addGroup('Pilha (LIFO)', `
      <div class="op-row"><input id="pushValor" type="number" placeholder="valor"><button class="btn btn-primary" id="btnPush">Empilhar (push)</button></div>
      <div class="op-row" style="margin-top:8px"><input id="buscaValor" type="number" placeholder="valor buscar" style="width:120px"><button class="btn btn-ghost" id="btnBuscar">Buscar</button></div>
      <div class="op-row" style="margin-top:8px"><button class="btn btn-ghost" id="btnPop">Desempilhar (pop)</button><button class="btn btn-ghost" id="btnTopo">Consultar topo</button></div>
    `);
    const pushValor=g1.querySelector('#pushValor');
    const btnPush=g1.querySelector('#btnPush');
    const buscaValor=g1.querySelector('#buscaValor');
    const btnBuscar=g1.querySelector('#btnBuscar');
    const btnPop=g1.querySelector('#btnPop');
    const btnTopo=g1.querySelector('#btnTopo');
    function updPush(){ setDisabled(btnPush, pushValor.value.trim()==='' || isNaN(parseInt(pushValor.value,10))); }
    function updBus(){ setDisabled(btnBuscar, buscaValor.value.trim()==='' || isNaN(parseInt(buscaValor.value,10))); }
    function updPopTopo(){ const hasStack = appState.lista.length>0; setDisabled(btnPop, !hasStack); setDisabled(btnTopo, !hasStack); }
    pushValor.addEventListener('input', updPush);
    buscaValor.addEventListener('input', updBus);
    setDisabled(btnPush,true); setDisabled(btnBuscar,true);
    updPopTopo();
    btnPush.addEventListener('click', ()=>{
      const v=parseInt(pushValor.value,10);
      if(isNaN(v)) return alert('Valor?');
      const res=stepsPilhaPush(appState.lista, v, meta);
      appState.lista=res.newState; startSteps(res.steps, appState.lista);
      setTimeout(updPopTopo,0);
    });
    btnPop.addEventListener('click', ()=>{
      if(appState.lista.length===0) return alert('Pilha vazia');
      const res=stepsPilhaPop(appState.lista, meta);
      appState.lista=res.newState; startSteps(res.steps, appState.lista);
      setTimeout(updPopTopo,0);
    });
    btnTopo.addEventListener('click', ()=>{
      if(appState.lista.length===0) return alert('Pilha vazia');
      const steps=[{titulo:'Consultar topo',codigo:`int v = topo->${meta.no.valor||'valor'};`,explicacao:`Topo da pilha é ${appState.lista[0]}.`,ponteirosAlterados:meta.ponteiroPrincipal||'topo',snapshot:[...appState.lista],highlightIndex:0}];
      startSteps(steps, appState.lista, true);
    });
    btnBuscar.addEventListener('click', ()=>{
      const v=parseInt(buscaValor.value,10);
      if(isNaN(v)) return alert('Valor?');
      const res=stepsBusca(appState.lista,v);
      startSteps(res.steps, appState.lista, true);
    });

  } else if(tipo==='fila'){
    const g1=addGroup('Fila (FIFO)', `
      <div class="op-row"><input id="enqValor" type="number" placeholder="valor"><button class="btn btn-primary" id="btnEnq">Enfileirar (enqueue)</button></div>
      <div class="op-row" style="margin-top:8px"><input id="remValorFila" type="number" placeholder="valor a remover"><button class="btn btn-ghost" id="btnRemValor">Remover valor</button><button class="btn btn-ghost" id="btnDeq">Desenfileirar (dequeue)</button></div>
      <div class="op-row" style="margin-top:8px"><input id="buscaValor" type="number" placeholder="buscar"><button class="btn btn-ghost" id="btnBuscar">Buscar</button><button class="btn btn-ghost" id="btnInicio">Consultar início</button><button class="btn btn-ghost" id="btnFim">Consultar fim</button></div>
    `);
    const enqValor=g1.querySelector('#enqValor');
    const btnEnq=g1.querySelector('#btnEnq');
    const remValorFila=g1.querySelector('#remValorFila');
    const btnRemValor=g1.querySelector('#btnRemValor');
    const btnDeq=g1.querySelector('#btnDeq');
    const buscaValor=g1.querySelector('#buscaValor');
    const btnBuscar=g1.querySelector('#btnBuscar');
    const btnInicio=g1.querySelector('#btnInicio');
    const btnFim=g1.querySelector('#btnFim');
    function updEnq(){ setDisabled(btnEnq, enqValor.value.trim()==='' || isNaN(parseInt(enqValor.value,10))); }
    function updRem(){ setDisabled(btnRemValor, remValorFila.value.trim()==='' || isNaN(parseInt(remValorFila.value,10))); }
    function updBus(){ setDisabled(btnBuscar, buscaValor.value.trim()==='' || isNaN(parseInt(buscaValor.value,10))); }
    function updSem(){
      const any = enqValor.value.trim()!=='' || remValorFila.value.trim()!=='' || buscaValor.value.trim()!=='';
      setDisabled(btnDeq, !any);
      setDisabled(btnInicio, !any);
      setDisabled(btnFim, !any);
    }
    enqValor.addEventListener('input', ()=>{ updEnq(); updSem(); });
    remValorFila.addEventListener('input', ()=>{ updRem(); updSem(); });
    buscaValor.addEventListener('input', ()=>{ updBus(); updSem(); });
    setDisabled(btnEnq,true); setDisabled(btnRemValor,true); setDisabled(btnBuscar,true);
    setDisabled(btnDeq,true); setDisabled(btnInicio,true); setDisabled(btnFim,true);

    btnEnq.addEventListener('click', ()=>{
      const v=parseInt(enqValor.value,10);
      if(isNaN(v)) return alert('Valor?');
      const res=stepsFilaEnqueue(appState.lista, v, meta);
      appState.lista=res.newState; startSteps(res.steps, appState.lista);
    });
    btnRemValor.addEventListener('click', ()=>{
      const v=parseInt(remValorFila.value,10);
      if(isNaN(v)) return alert('Valor?');
      const idx = appState.lista.indexOf(v);
      if(idx===-1){
        const res=stepsBusca(appState.lista, v);
        startSteps(res.steps, appState.lista, true);
        return;
      }
      const res=stepsListaRemoverMeio(appState.lista, idx, meta);
      appState.lista=res.newState; startSteps(res.steps, appState.lista);
    });
    btnDeq.addEventListener('click', ()=>{
      if(appState.lista.length===0) return alert('Fila vazia');
      const res=stepsFilaDequeue(appState.lista, meta);
      appState.lista=res.newState; startSteps(res.steps, appState.lista);
    });
    btnInicio.addEventListener('click', ()=>{
      if(appState.lista.length===0) return alert('Fila vazia');
      const steps=[{titulo:'Consultar início',codigo:`int v = inicio->${meta.no.valor||'valor'};`,explicacao:`Início da fila: ${appState.lista[0]}`,ponteirosAlterados:meta.ponteiros.inicio||'inicio',snapshot:[...appState.lista],highlightIndex:0}];
      startSteps(steps, appState.lista, true);
    });
    btnFim.addEventListener('click', ()=>{
      if(appState.lista.length===0) return alert('Fila vazia');
      const steps=[{titulo:'Consultar fim',codigo:`int v = fim->${meta.no.valor||'valor'};`,explicacao:`Fim da fila: ${appState.lista[appState.lista.length-1]}`,ponteirosAlterados:meta.ponteiros.fim||'fim',snapshot:[...appState.lista],highlightIndex:appState.lista.length-1}];
      startSteps(steps, appState.lista, true);
    });
    btnBuscar.addEventListener('click', ()=>{
      const v=parseInt(buscaValor.value,10);
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
    const treeValor=g1.querySelector('#treeValor');
    const btnTreeIns=g1.querySelector('#btnTreeIns');
    const btnTreeRem=g1.querySelector('#btnTreeRem');
    const treeBusca=g1.querySelector('#treeBusca');
    const btnTreeBusca=g1.querySelector('#btnTreeBusca');
    const btnPre=g1.querySelector('#btnPre');
    const btnIn=g1.querySelector('#btnIn');
    const btnPos=g1.querySelector('#btnPos');
    function updTree(){ const has=treeValor.value.trim()!=='' && !isNaN(parseInt(treeValor.value,10)); setDisabled(btnTreeIns, !has); setDisabled(btnTreeRem, !has); }
    function updBus(){ setDisabled(btnTreeBusca, treeBusca.value.trim()==='' || isNaN(parseInt(treeBusca.value,10))); }
    function updSem(){ const any=treeValor.value.trim()!=='' || treeBusca.value.trim()!==''; setDisabled(btnPre, !any); setDisabled(btnIn, !any); setDisabled(btnPos, !any); }
    treeValor.addEventListener('input', ()=>{ updTree(); updSem(); });
    treeBusca.addEventListener('input', ()=>{ updBus(); updSem(); });
    setDisabled(btnTreeIns,true); setDisabled(btnTreeRem,true); setDisabled(btnTreeBusca,true);
    setDisabled(btnPre,true); setDisabled(btnIn,true); setDisabled(btnPos,true);
    btnTreeIns.addEventListener('click', ()=>{
      const v=parseInt(treeValor.value,10);
      if(isNaN(v)) return alert('Valor?');
      let rootClone = appState.arvore ? cloneTree(appState.arvore) : null;
      const res=stepsTreeInsert(rootClone, v, isBST, meta);
      appState.arvore = res.newState;
      startSteps(res.steps, appState.arvore);
    });
    btnTreeRem.addEventListener('click', ()=>{
      const v=parseInt(treeValor.value,10);
      if(isNaN(v)) return alert('Informe valor a remover');
      const liveClone = appState.arvore ? cloneTree(appState.arvore) : null;
      const liveRes = stepsTreeRemove(liveClone, v, meta);
      appState.arvore = liveRes.newState;
      startSteps(liveRes.steps, appState.arvore);
    });
    btnTreeBusca.addEventListener('click', ()=>{
      const v=parseInt(treeBusca.value,10);
      if(isNaN(v)) return alert('Valor?');
      const res=stepsTreeSearch(appState.arvore ? cloneTree(appState.arvore) : null, v, isBST, meta);
      startSteps(res.steps, appState.arvore, true);
    });
    btnPre.addEventListener('click', ()=>{
      const res=stepsTraversal(appState.arvore ? cloneTree(appState.arvore) : null, 'pre');
      startSteps(res.steps, appState.arvore, true);
    });
    btnIn.addEventListener('click', ()=>{
      const res=stepsTraversal(appState.arvore ? cloneTree(appState.arvore) : null, 'in');
      startSteps(res.steps, appState.arvore, true);
    });
    btnPos.addEventListener('click', ()=>{
      const res=stepsTraversal(appState.arvore ? cloneTree(appState.arvore) : null, 'pos');
      startSteps(res.steps, appState.arvore, true);
    });
  }
}

let lastSnapshotForMemory=null;

function startSteps(steps, finalSnapshot, keepFinal=false){
  history.setSteps(steps);
  if(steps.length){
    renderStep(0);
    updateControls();
  }
  lastSnapshotForMemory = finalSnapshot;
}

function renderCurrent(stepOverride){
  const step = stepOverride || history.current();
  let snapshot;
  if(step && step.snapshot){
    snapshot = step.snapshot;
  } else {
    snapshot = currentTipo && currentTipo.includes('arvore') ? appState.arvore : appState.lista;
  }
  if(['lista_simples'].includes(currentTipo)) renderLista(visualization, snapshot, currentMeta, step);
  else if(currentTipo==='lista_dupla') renderDupla(visualization, snapshot, currentMeta, step);
  else if(currentTipo==='pilha') renderPilha(visualization, snapshot, currentMeta, step);
  else if(currentTipo==='fila') renderFila(visualization, snapshot, currentMeta, step);
  else if(currentTipo==='arvore_binaria' || currentTipo==='bst') renderTree(visualization, snapshot, currentMeta, step);

  renderMemory(memoryView, snapshot, currentMeta);

  if(step){
    stepInfo.classList.remove('hidden');
    stepTitle.textContent = step.titulo||'';
    stepCode.textContent = step.codigo||'';
    stepExplanation.textContent = step.explicacao||'';
    stepPointers.textContent = step.ponteirosAlterados ? `Ponteiros: ${step.ponteirosAlterados}` : '';
    if(avatarImg){
      const src = getAvatarForStep(step);
      avatarImg.src = src;
      avatarImg.alt = step.titulo || 'Avatar';
      if(speechBubble){
        speechBubble.classList.remove('thinking','success','error','warning');
        if(src.includes('pensando')) speechBubble.classList.add('thinking');
        else if(src.includes('raiva')) speechBubble.classList.add('error');
        else if(src.includes('comemorando')||src.includes('joinha')) speechBubble.classList.add('success');
        else if(src.includes('computador')) speechBubble.classList.add('warning');
      }
      if(avatarLabel){
        if(src.includes('raiva')) avatarLabel.textContent = 'Ops!';
        else if(src.includes('comemorando')) avatarLabel.textContent = 'Consegui!';
        else if(src.includes('pensando')) avatarLabel.textContent = 'Hmm...';
        else if(src.includes('computador')) avatarLabel.textContent = 'Criando...';
        else avatarLabel.textContent = 'VisualizaC';
      }
    }
  } else {
    stepInfo.classList.add('hidden');
    if(avatarImg) avatarImg.src = avatarMap.acenando;
  }
}

function renderStep(idx){
  const step = history.steps[idx];
  if(!step) return;
  history.index = idx;
  renderCurrent(step);
  updateControls();
}
function updateControls(){
  const hasSteps = history.steps.length>0;
  const atEnd = hasSteps && history.index === history.steps.length-1;
  stepCounter.textContent = hasSteps ? `Passo ${history.index+1} / ${history.steps.length}` : '';
  btnPrev.disabled = !hasSteps || history.index<=0;
  btnNext.disabled = !hasSteps || history.index>=history.steps.length-1;
  btnPlay.disabled = !hasSteps;
  btnPlay.textContent = history.isPlaying ? '⏸ Pausar' : '▶ Executar';
  if(atEnd){
    btnReset.textContent = '■ Parar visualização';
    btnReset.disabled = false;
    btnReset.classList.remove('blurred');
  } else if(!hasSteps){
    btnReset.textContent = 'Reiniciar';
    btnReset.disabled = true;
    btnReset.classList.add('blurred');
  } else {
    btnReset.textContent = 'Reiniciar';
    btnReset.disabled = false;
    btnReset.classList.remove('blurred');
  }
  btnPrev.classList.toggle('blurred', btnPrev.disabled);
  btnNext.classList.toggle('blurred', btnNext.disabled);
  btnPlay.classList.toggle('blurred', btnPlay.disabled);
  btnReset.classList.toggle('blurred', btnReset.disabled);
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
  const atEnd = history.steps.length>0 && history.index === history.steps.length-1;
  if(atEnd){
    history.stop();
    history.setSteps([]);
    history.index = -1;
    stepInfo.classList.add('hidden');
    stepCounter.textContent='';
    resetOpsBlur();
    updateControls();
    renderCurrent(null);
    return;
  }
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
updateControls();
