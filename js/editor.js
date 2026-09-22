export const examples = {
  lista_simples: `typedef struct No {
    int valor;
    struct No *prox;
} No;

No *inicio = NULL;

void inserir_inicio(int v){
    No *novo = malloc(sizeof(No));
    novo->valor = v;
    novo->prox = inicio;
    inicio = novo;
}
void remover_inicio(){
    if(inicio==NULL) return;
    No *tmp = inicio;
    inicio = inicio->prox;
    free(tmp);
}`,
  lista_dupla: `typedef struct No {
    int valor;
    struct No *prox;
    struct No *ant;
} No;

No *inicio = NULL;
No *fim = NULL;

void inserir_fim(int v){
    No *novo = malloc(sizeof(No));
    novo->valor = v;
    novo->prox = NULL;
    novo->ant = fim;
    if(fim) fim->prox = novo;
    else inicio = novo;
    fim = novo;
}`,
  pilha: `typedef struct No {
    int valor;
    struct No *prox;
} No;

No *topo = NULL;

void push(int v){
    No *novo = malloc(sizeof(No));
    novo->valor = v;
    novo->prox = topo;
    topo = novo;
}
int pop(){
    if(topo==NULL) return -1;
    No *tmp = topo;
    int v = tmp->valor;
    topo = topo->prox;
    free(tmp);
    return v;
}`,
  fila: `typedef struct No {
    int valor;
    struct No *prox;
} No;

No *inicio = NULL;
No *fim = NULL;

void enqueue(int v){
    No *novo = malloc(sizeof(No));
    novo->valor = v;
    novo->prox = NULL;
    if(fim) fim->prox = novo;
    else inicio = novo;
    fim = novo;
}
int dequeue(){
    if(inicio==NULL) return -1;
    No *tmp = inicio;
    int v = tmp->valor;
    inicio = inicio->prox;
    if(inicio==NULL) fim=NULL;
    free(tmp);
    return v;
}`,
  arvore: `typedef struct No {
    int valor;
    struct No *esquerda;
    struct No *direita;
} No;

No *raiz = NULL;

No* inserir(No *no, int v){
    if(no==NULL){
        No *novo=malloc(sizeof(No));
        novo->valor=v;
        novo->esquerda=novo->direita=NULL;
        return novo;
    }
    // insercao sem regra fixa (exemplo binaria)
    if(no->esquerda==NULL) no->esquerda=inserir(no->esquerda,v);
    else no->direita=inserir(no->direita,v);
    return no;
}`,
  bst: `typedef struct No {
    int valor;
    struct No *esquerda;
    struct No *direita;
} No;

No *raiz = NULL;

No* inserir(No *no, int v){
    if(no==NULL){
        No *novo=malloc(sizeof(No));
        novo->valor=v;
        novo->esquerda=novo->direita=NULL;
        return novo;
    }
    if(v < no->valor)
        no->esquerda = inserir(no->esquerda, v);
    else
        no->direita = inserir(no->direita, v);
    return no;
}`
};

export function initEditor({ textarea, gutter, highlightEl }) {
  function updateGutter(){
    const lines = textarea.value.split('\n').length || 1;
    let s='';
    for(let i=1;i<=lines;i++) s+= i+'\n';
    gutter.textContent = s.trimEnd();
  }
  function escapeHtml(str){
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function fallbackHighlight(code){
    let h = escapeHtml(code);
    h = h.replace(/\/\*[\s\S]*?\*\//g, m=>`<span class="hl-comment">${m}</span>`);
    h = h.replace(/\/\/.*$/gm, m=>`<span class="hl-comment">${m}</span>`);
    h = h.replace(/&quot;[^&]*?&quot;|&#39;[^&]*?&#39;/g, m=>`<span class="hl-string">${m}</span>`);
    h = h.replace(/\b(typedef|struct|int|char|float|double|void|malloc|free|sizeof|NULL|if|else|return|while|for)\b/g,'<span class="hl-keyword">$1</span>');
    h = h.replace(/\b(No|Node)\b/g,'<span class="hl-type">$1</span>');
    h = h.replace(/\b(\d+)\b/g,'<span class="hl-number">$1</span>');
    return h;
  }
  function updateHighlight(){
    const code = textarea.value;
    if(!code){ highlightEl.textContent=''; return; }
    if(typeof window.hljs !== 'undefined' && window.hljs.highlightElement){
      highlightEl.textContent = code;
      highlightEl.className = 'language-c';
      try{ window.hljs.highlightElement(highlightEl); } catch(e){ highlightEl.innerHTML = fallbackHighlight(code); }
    } else {
      highlightEl.innerHTML = fallbackHighlight(code);
    }
  }
  function syncScroll(){
    highlightEl.parentElement.scrollTop = textarea.scrollTop;
    highlightEl.parentElement.scrollLeft = textarea.scrollLeft;
    gutter.scrollTop = textarea.scrollTop;
  }
  textarea.addEventListener('input', ()=>{ updateGutter(); updateHighlight(); });
  textarea.addEventListener('scroll', syncScroll);
  textarea.addEventListener('keydown', (e)=>{
    if(e.key==='Tab'){ e.preventDefault(); const s=textarea.selectionStart, ed=textarea.selectionEnd; textarea.value = textarea.value.substring(0,s)+'    '+textarea.value.substring(ed); textarea.selectionStart=textarea.selectionEnd=s+4; updateGutter(); updateHighlight(); }
  });
  updateGutter(); updateHighlight();
  return { updateGutter, updateHighlight };
}
