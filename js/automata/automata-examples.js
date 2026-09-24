import { addState, addTransition } from './automata-state.js';

function base(type='AFD', alphabet, desc){
  return { type, alphabet:[...alphabet], states:[], initialId:null, transitions:[], nextId:0, languageDesc:desc };
}

export const automataExamples={
  termina_ab: ()=>{
    const a=base('AFD',['a','b'],'L = { w ∈ {a,b}* | w termina com ab }');
    // triângulo para desocultar q2→q0 que ficava atrás de q1
    const q0=addState(a,180,320,'q0');
    const q1=addState(a,400,160,'q1');
    const q2=addState(a,620,320,'q2');
    q2.isFinal=true; a.initialId='q0';
    addTransition(a,'q0','q1','a'); addTransition(a,'q0','q0','b');
    addTransition(a,'q1','q1','a'); addTransition(a,'q1','q2','b');
    addTransition(a,'q2','q1','a'); addTransition(a,'q2','q0','b');
    return a;
  },
  par_zeros: ()=>{
    const a=base('AFD',['0','1'],'L = { w ∈ {0,1}* | quantidade de 0 é par }');
    const q0=addState(a,180,240,'q0'); const q1=addState(a,580,240,'q1');
    q0.isFinal=true; a.initialId='q0';
    addTransition(a,'q0','q1','0'); addTransition(a,'q0','q0','1');
    addTransition(a,'q1','q0','0'); addTransition(a,'q1','q1','1');
    return a;
  },
  comeca_1: ()=>{
    const a=base('AFD',['0','1'],'L = { w | w começa com 1 }');
    const q0=addState(a,200,260,'q0'); const q1=addState(a,580,260,'q1');
    q1.isFinal=true; a.initialId='q0';
    // sem q2 armadilha: se começar com 0, sem transição → palavra inválida imediata (∅)
    addTransition(a,'q0','q1','1');
    addTransition(a,'q1','q1','0'); addTransition(a,'q1','q1','1');
    return a;
  },
  contem_101: ()=>{
    const a=base('AFD',['0','1'],'L = { w | w contém 101 }');
    const q0=addState(a,100,260,'q0'); const q1=addState(a,300,140,'q1'); const q2=addState(a,500,140,'q2'); const q3=addState(a,700,260,'q3');
    q3.isFinal=true; a.initialId='q0';
    addTransition(a,'q0','q1','1'); addTransition(a,'q0','q0','0');
    addTransition(a,'q1','q2','0'); addTransition(a,'q1','q1','1');
    addTransition(a,'q2','q3','1'); addTransition(a,'q2','q0','0');
    addTransition(a,'q3','q3','0'); addTransition(a,'q3','q3','1');
    return a;
  },
  afn_simples: ()=>{
    const a=base('AFN',['a','b'],'L = { w ∈ {a,b}* | w possui ao menos um a }');
    const q0=addState(a,200,260,'q0'); const q1=addState(a,580,260,'q1');
    q1.isFinal=true; a.initialId='q0';
    // só um final: q1/q2 faziam mesma coisa (a/b loops), fundidos
    addTransition(a,'q0','q1','a');
    addTransition(a,'q0','q0','b');
    addTransition(a,'q1','q1','a'); addTransition(a,'q1','q1','b');
    return a;
  },
  afn_epsilon: ()=>{
    const a=base('AFN-ε',['a','b'],'AFN-ε: q0 --ε--> q1');
    const q0=addState(a,140,260,'q0'); const q1=addState(a,400,260,'q1'); const q2=addState(a,660,260,'q2');
    q2.isFinal=true; a.initialId='q0';
    addTransition(a,'q0','q1','ε');
    addTransition(a,'q1','q2','a');
    addTransition(a,'q1','q1','b');
    addTransition(a,'q2','q2','a'); addTransition(a,'q2','q2','b');
    return a;
  }
};
