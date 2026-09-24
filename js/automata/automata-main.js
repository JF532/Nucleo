import { createAutomata } from './automata-state.js';
import { createAutomataEditor } from './automata-editor.js';
import { runWord } from './automata-engine.js';
import { validate, automataInfo } from './automata-validator.js';
import { toFormal, toTableData, inferLanguage, getEffectiveAlphabet } from './automata-state.js';
import { automataExamples } from './automata-examples.js';

let automata = createAutomata();
let editor=null;
let execHistory=null;
let execIdx=-1;

const avatarMap = {
  acenando: 'Avatares/acenando.png',
  pensando: 'Avatares/pensando.png',
  computador: 'Avatares/usando_computador.png',
  joinha: 'Avatares/joinha.png',
  comemorando: 'Avatares/comemorando.png',
  raiva: 'Avatares/raiva.png',
  professor: 'Avatares/professor_ricardo.gif'
};
function updateAutomataAvatar({ title='', explanation='', code='', pointers='', avatar='professor', label=null }){
  const img=$('automataAvatarImg');
  const lbl=$('automataAvatarLabel');
  const bubble=$('automataSpeechBubble');
  const tEl=$('automataStepTitle');
  const eEl=$('automataStepExplanation');
  const cEl=$('automataStepCode');
  const pEl=$('automataStepPointers');
  const wrap=$('automataStepInfo');
  if(!img||!wrap) return;
  const src=avatarMap[avatar]||avatarMap.professor;
  img.src=src;
  img.alt=title||'Professor Ricardo';
  if(lbl) lbl.textContent=label||'Professor Ricardo';
  else {
    if(avatar==='raiva') lbl.textContent='Ops!';
    else if(avatar==='comemorando') lbl.textContent='Consegui!';
    else if(avatar==='pensando') lbl.textContent='Hmm...';
    else if(avatar==='computador') lbl.textContent='Criando...';
    else if(avatar==='joinha') lbl.textContent='Muito bem!';
    else lbl.textContent='Professor Ricardo';
  }
  if(bubble){
    bubble.classList.remove('thinking','success','error','warning');
    if(avatar==='pensando') bubble.classList.add('thinking');
    else if(avatar==='raiva') bubble.classList.add('error');
    else if(avatar==='comemorando'||avatar==='joinha') bubble.classList.add('success');
    else if(avatar==='computador') bubble.classList.add('warning');
  }
  if(tEl) tEl.textContent=title;
  if(eEl) eEl.textContent=explanation;
  if(cEl){ cEl.textContent=code; cEl.style.display= code? 'block':'none'; }
  if(pEl) pEl.textContent=pointers? `Ponteiros: ${pointers}` : '';
  wrap.classList.remove('hidden');
}

function $(id){ return document.getElementById(id); }

function refreshSide(){
  // auto-sincroniza alfabeto com símbolos já no canvas (corrige caso da imagem: c fora vira chip)
  for(const t of automata.transitions){
    if(t.symbol && t.symbol!=='ε' && t.symbol!=='epsilon' && !automata.alphabet.includes(t.symbol)){
      automata.alphabet.push(t.symbol);
    }
  }
  // info — usa alfabeto efetivo para refletir canvas (vazio se nada criado)
  const effectiveAlphabet=getEffectiveAlphabet(automata);
  const info=automataInfo(automata);
  info.alphabet = effectiveAlphabet.length ? `{${effectiveAlphabet.join(', ')}}` : '∅';
  const infoEl=$('automataInfo');
  if(infoEl){
    infoEl.innerHTML=`
      <div style="font-size:12px; line-height:1.6">
        <div><b>Tipo:</b> ${info.type}</div>
        <div><b>Estados:</b> ${info.states}</div>
        <div><b>Alfabeto:</b> ${info.alphabet}</div>
        <div><b>Inicial:</b> ${info.initial}</div>
        <div><b>Finais:</b> ${info.finals}</div>
        <div><b>Transições:</b> ${info.transitionsCount}</div>
      </div>`;
  }
  // validation
  const vEl=$('automataValidation');
  if(vEl){
    const msgs=validate(automata);
    vEl.innerHTML = msgs.map(m=> `<div class="validation-item ${m.level==='error'?'error': m.level==='warn'?'warn':'info'}">${m.msg}</div>`).join('');
  }
  // formal
  const formalEl=$('automataFormal');
  if(formalEl) formalEl.textContent = toFormal(automata);
  // table — vazia se sem símbolos/estados
  const tableWrap=$('automataTableWrap');
  if(tableWrap){
    const {syms, rows}=toTableData(automata);
    if(rows.length===0) tableWrap.innerHTML='<span style="color:var(--text-muted);font-size:12px">Sem estados.</span>';
    else if(syms.length===0) tableWrap.innerHTML='<span style="color:var(--text-muted);font-size:12px">Sem símbolos no alfabeto — adicione símbolos ou crie transições.</span>';
    else {
      let h=`<table class="transition-table"><thead><tr><th>Estado</th>${syms.map(s=>`<th>${s}</th>`).join('') }</tr></thead><tbody>`;
      for(const r of rows){
        h+=`<tr class="${r.isInitial?'initial':''} ${r.isFinal?'final':''}"><td>${r.id}${r.isInitial?' →':''}${r.isFinal?' ◎':''}</td>${syms.map(s=>`<td>${r.cols[s]}</td>`).join('')}</tr>`;
      }
      h+='</tbody></table>';
      tableWrap.innerHTML=h;
    }
  }
  // alphabet chips — vazio mostra placeholder, se adaptando ao que colocar
  const chipsEl=$('alphabetChips');
  if(chipsEl){
    if(automata.alphabet.length===0){
      chipsEl.innerHTML = '<span style="color:var(--text-muted);font-size:12px">vazio — crie transições ou adicione símbolos</span>';
    } else {
      chipsEl.innerHTML = automata.alphabet.map(s=> `<span class="chip">${s} <button data-sym="${s}" title="remover">×</button></span>`).join('') ;
    }
    chipsEl.querySelectorAll('button').forEach(b=>{
      b.addEventListener('click', ()=>{
        const s=b.dataset.sym;
        automata.alphabet = automata.alphabet.filter(x=>x!==s);
        refreshSide(); if(editor) editor.render();
      });
    });
  }
  // type radios
  const typeRadios=document.querySelectorAll('input[name="automataType"]');
  typeRadios.forEach(r=>{ r.checked = r.value===automata.type; });

  // language desc — vazio e se adapta ao canvas (inferência)
  const langDesc=$('languageDesc');
  if(langDesc){
    if(document.activeElement!==langDesc){
      const inferred=inferLanguage(automata);
      // se ainda vazio ou era default antigo, preenche com inferido; senão só atualiza se for cadeia linear clara
      const isEmpty = !automata.languageDesc || automata.languageDesc.trim()==='';
      const isDefault = automata.languageDesc && automata.languageDesc.includes('termina em ab');
      if(inferred && inferred!==automata.languageDesc){
        if(isEmpty || isDefault || inferred.startsWith('Aceitar palavras que terminam em')){
          automata.languageDesc = inferred;
        }
      }
      langDesc.value = automata.languageDesc||'';
      if(!automata.languageDesc) langDesc.placeholder = 'Ex.: L = { w | w termina em ... } (auto)';
    }
  }
}

function handleEditorChange(info){
  refreshSide();
  if(info && info.tool){
    if(info.tool==='state') updateAutomataAvatar({ title:'Modo Estado', explanation:'Clique no canvas (área escura) para criar um novo estado qN. Arraste para reposicionar.', avatar:'computador' });
    else if(info.tool==='trans') updateAutomataAvatar({ title:'Modo Transição', explanation: info.selectedId ? `Origem ${info.selectedId} selecionada. Agora clique no estado de destino.` : 'Clique no estado de origem, depois no destino e informe o símbolo.', avatar:'pensando' });
    else if(info.tool==='initial') updateAutomataAvatar({ title:'Definir inicial', explanation:'Clique no estado que será o inicial (seta de entrada). Apenas um inicial para AFD/AFN.', avatar:'joinha' });
    else if(info.tool==='final') updateAutomataAvatar({ title:'Estado final', explanation:'Clique no estado para alternar final (círculo duplo ◎). Pode ter vários finais.', avatar:'joinha' });
    else if(info.tool==='delete') updateAutomataAvatar({ title:'Excluir', explanation:'Clique no estado ou transição para excluir. Ao excluir estado, os ids q são reindexados (ex.: q3 vira q2).', avatar:'raiva', label:'Atenção' });
  } else if(info && info.selectedId){
    // criação/edição genérica
    const cnt=automata.states.length;
    if(cnt>0) updateAutomataAvatar({ title:`Estado ${info.selectedId} selecionado`, explanation:`Selecionado ${info.selectedId}. Use ★ Inicial, ◎ Final ou ⌫ Excluir, ou arraste para mover.`, avatar:'professor' });
  }
}

function initAutomataTab(){
  const canvasContainer=$('automataCanvas');
  if(!canvasContainer) return;
  // evitar dupla inicialização
  if(editor && canvasContainer.querySelector('svg')) { refreshSide(); return; }
  editor = createAutomataEditor({ automata, canvasContainer, onChange: handleEditorChange });
  refreshSide();
  updateAutomataAvatar({ title:'Bem-vindo aos Autômatos!', explanation:'Crie estados com ○ Estado, ligue com → Transição, defina inicial ★ e finais ◎, ajuste o alfabeto e execute palavras. Professor Ricardo vai te guiar.', avatar:'professor' });

  // toolbar
  document.querySelectorAll('.tool-btn').forEach(b=>{
    b.addEventListener('click', ()=>{
      document.querySelectorAll('.tool-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      editor.setTool(b.dataset.tool);
    });
  });
  // default tool select
  document.querySelector('.tool-btn[data-tool="select"]')?.classList.add('active');

  // alphabet add
  $('btnAddSymbol')?.addEventListener('click', ()=>{
    const inp=$('inputNewSymbol');
    const v=(inp.value||'').trim();
    if(!v) return alert('Informe um símbolo');
    if(v.length!==1 && v!=='ε' && v!=='epsilon') alert('Alfabeto geralmente usa símbolos unitários (a,b,0,1). Continuando...');
    if(automata.alphabet.includes(v)) return alert('Símbolo já existe');
    automata.alphabet.push(v); inp.value=''; refreshSide(); editor.render();
    updateAutomataAvatar({ title:`Símbolo "${v}" adicionado`, explanation:`Alfabeto agora {${automata.alphabet.join(', ')}}. Use este alfabeto nas transições.`, avatar:'joinha' });
  });
  $('inputNewSymbol')?.addEventListener('keydown', e=>{ if(e.key==='Enter'){ $('btnAddSymbol').click(); } });

  // language
  $('languageDesc')?.addEventListener('input', e=>{ automata.languageDesc=e.target.value; });

  // type change
  document.querySelectorAll('input[name="automataType"]').forEach(r=>{
    r.addEventListener('change', ()=>{
      automata.type=r.value;
      refreshSide(); editor.render();
      updateAutomataAvatar({ title:`Tipo: ${r.value}`, explanation: r.value==='AFD' ? 'AFD: determinístico, no máximo uma transição por símbolo.' : r.value==='AFN' ? 'AFN: não-determinístico, múltiplos caminhos possíveis.' : 'AFN-ε: permite transições ε (fechamento-ε).', avatar:'pensando' });
    });
  });

  // examples
  $('automataExampleSelect')?.addEventListener('change', (e)=>{
    const key=e.target.value;
    if(!key) return;
    const factory=automataExamples[key];
    if(factory){ automata=factory(); editor=null; const cc=$('automataCanvas'); cc.innerHTML=''; editor=createAutomataEditor({automata, canvasContainer: cc, onChange: handleEditorChange}); refreshSide(); clearExec();
      updateAutomataAvatar({ title:'Exemplo carregado!', explanation:`Autômato "${key}" pronto no canvas. Execute palavras e veja o Professor Ricardo explicar.`, avatar:'comemorando' }); }
  });

  // clear
  $('btnAutomataClear')?.addEventListener('click', ()=>{
    if(confirm('Limpar todo o autômato?')){ automata=createAutomata(); const cc=$('automataCanvas'); cc.innerHTML=''; editor=createAutomataEditor({automata, canvasContainer: cc, onChange: handleEditorChange}); refreshSide(); clearExec();
      updateAutomataAvatar({ title:'Autômato limpo', explanation:'Comece criando estados com ○ Estado. O Professor Ricardo está pronto para guiar novamente.', avatar:'acenando' }); }
  });

  // execução — só via controles inferiores (sem botão superior e sem Enter)
  $('btnExecPrev')?.addEventListener('click', ()=> stepExec(-1));
  $('btnExecNext')?.addEventListener('click', ()=> stepExec(1));
  $('btnExecReset')?.addEventListener('click', ()=> { execIdx=0; renderExec(); });
  $('btnExecPlay')?.addEventListener('click', togglePlay);
}

let playTimer=null;
function execWord(){
  const word=($('inputWord')?.value||'').trim();
  // validacao: avisar se simbolo fora do alfabeto (exceto ε)
  const invalid=[...word].filter(ch=> !automata.alphabet.includes(ch));
  if(invalid.length && word.length>0){
    // apenas aviso, continua
    console.warn('Símbolos fora do alfabeto:', invalid);
  }
  const res=runWord(automata, word);
  execHistory=res;
  execIdx=0;
  renderExec();
}

function renderExec(){
  const histEl=$('execHistoryBody');
  const word=($('inputWord')?.value||'').trim();
  const resultEl=$('execResult');
  const detailEl=$('execDetail');
  const posEl=$('execPos');
  if(!execHistory){ if(histEl) histEl.innerHTML='<tr><td colspan="3" style="color:var(--text-muted);">Nenhuma execução.</td></tr>'; return; }
  const hist=execHistory.history;
  if(hist.length===0){
    if(resultEl) resultEl.innerHTML='<span class="result-reject">✕ PALAVRA REJEITADA</span>';
    if(detailEl) detailEl.textContent=execHistory.reason||'Sem estado inicial.';
    updateAutomataAvatar({ title:'✕ Sem autômato', explanation: execHistory.reason||'Defina ao menos um estado inicial e uma transição.', avatar:'raiva', label:'Ops!' });
    if(histEl) histEl.innerHTML='<tr><td colspan="3" style="color:var(--text-muted);">—</td></tr>';
    return;
  }
  if(histEl){
    let h='';
    for(let i=0;i<hist.length;i++){
      const e=hist[i];
      const active=i===execIdx? ' class="active"' : '';
      const sym=e.symbol;
      const states = [...e.nextSet].join(', ') || '∅';
      const curStates = [...e.currentSet].join(', ')||'∅';
      // para passo 0 mostra nextSet
      const displaySet = i===0? [...e.nextSet].join(', ')||'∅' : states;
      h+=`<tr${active}><td>${e.step}</td><td>${sym}</td><td>{${displaySet}}</td></tr>`;
    }
    histEl.innerHTML=h;
  }
  // highlight
  const cur = hist[execIdx];
  if(cur){
    const set = cur.nextSet;
    const transIds=new Set(cur.used||[]);
    if(editor) editor.setHighlight(set, transIds);
    // pos indicator
    if(posEl){
      const total=word.length;
      const consumed=cur.step;
      const nextSym = word[consumed] || '—';
      posEl.textContent = `Símbolo: ${cur.symbol} | Posição: ${consumed} / ${total} | Estados: {${[...set].join(', ')||'∅'}} | Próximo: ${nextSym}`;
    }
    // palavra com destaque
    const wordEl=$('wordHighlight');
    if(wordEl){
      const w=word;
      let html='';
      for(let i=0;i<w.length;i++){
        const isCur = i===cur.step-1; // step 1 = first symbol
        html+= `<span style="${isCur? 'background:#B8860B;color:#0B0D0E;padding:2px 4px;border-radius:4px;font-weight:700':''}">${w[i]}</span>`;
      }
      if(w.length===0) html='<span style="color:var(--text-muted)">(palavra vazia ε)</span>';
      wordEl.innerHTML=html;
    }
  }
  // resultado final apenas quando no último passo
  if(execIdx===hist.length-1){
    if(resultEl) resultEl.innerHTML = execHistory.accepted? '<span class="result-accept">✓ PALAVRA ACEITA</span>' : '<span class="result-reject">✕ PALAVRA REJEITADA</span>';
    if(detailEl) detailEl.textContent = execHistory.reason;
    if(execHistory.accepted){
      updateAutomataAvatar({ title:'✓ Palavra aceita!', explanation: execHistory.reason, avatar:'comemorando', label:'Consegui!' });
    } else {
      updateAutomataAvatar({ title:'✕ Palavra rejeitada', explanation: execHistory.reason, avatar:'raiva', label:'Ops!' });
    }
  } else {
    if(resultEl) resultEl.innerHTML = '<span style="color:var(--text-muted)">Em execução...</span>';
    if(detailEl){
      const cur2=hist[execIdx];
      const isAFN = automata.type.startsWith('AFN');
      detailEl.textContent = `Estamos em {${[...cur2.nextSet].join(', ')||'∅'}}. Próximo símbolo: "${word[cur2.step]||'—'}". ${isAFN? 'AFN acompanha múltiplos estados.':''}`;
    }
    // avatar pensando durante execução intermediária
    const curAv = hist[execIdx];
    const sym = curAv ? curAv.symbol : '—';
    const estados = curAv ? [...curAv.nextSet].join(', ')||'∅' : '∅';
    updateAutomataAvatar({ title:`Processando "${sym}"`, explanation:`Estamos em {${estados}}. Símbolo atual: "${sym}". Transição em destaque no canvas. Use Próximo/Pausar para acompanhar.`, avatar:'pensando', label:'Hmm...' });
  }
}

function stepExec(dir){
  if(!execHistory) return;
  const len=execHistory.history.length;
  execIdx=Math.max(0, Math.min(len-1, execIdx+dir));
  renderExec();
}
function togglePlay(){
  const btn=$('btnExecPlay');
  if(playTimer){ clearInterval(playTimer); playTimer=null; if(btn) btn.textContent='▶ Executar'; return; }
  if(!execHistory) execWord();
  if(btn) btn.textContent='⏸ Pausar';
  playTimer=setInterval(()=>{
    if(execIdx >= execHistory.history.length-1){ clearInterval(playTimer); playTimer=null; if(btn) btn.textContent='▶ Executar'; return; }
    execIdx++; renderExec();
  }, 800);
}
function clearExec(){
  execHistory=null; execIdx=-1;
  const histEl=$('execHistoryBody'); if(histEl) histEl.innerHTML='<tr><td colspan="3" style="color:var(--text-muted);">Nenhuma execução.</td></tr>';
  const r=$('execResult'); if(r) r.innerHTML='';
  const d=$('execDetail'); if(d) d.textContent='';
  const p=$('execPos'); if(p) p.textContent='';
  const w=$('wordHighlight'); if(w) w.innerHTML='';
  if(editor) editor.clearHighlight();
  updateAutomataAvatar({ title:'Pronto para executar', explanation:'Digite uma palavra e clique em ▶ Executar. Use Anterior/Próximo para acompanhar passo a passo.', avatar:'professor' });
}

// expose for tab switch
window.initAutomataTab = initAutomataTab;
window.refreshAutomata = refreshSide;
document.addEventListener('DOMContentLoaded', ()=>{
  // se já estamos na aba autômatos ao carregar (hash), init
  if(document.getElementById('automataCanvas')) initAutomataTab();
});
