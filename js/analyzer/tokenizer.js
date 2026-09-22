export function tokenize(code){
  const original = code;
  const noComments = code.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
  const normalized = noComments;

  // structs
  const structs = [];
  const structRe = /(typedef\s+)?struct\s+(\w*)\s*\{([^}]+)\}\s*(\w+)?\s*;/g;
  let m;
  while((m = structRe.exec(normalized))){
    const body = m[3];
    const fields = [];
    // field lines: type ... *? name ;
    const fieldRe = /([^;]+);/g;
    let fm;
    while((fm = fieldRe.exec(body))){
      const line = fm[1].trim();
      // detect pointer to self: struct No *prox  or  No *prox  or int *x
      const ptrMatch = line.match(/(struct\s+(\w+)\s*\*|(\w+)\s*\*)\s*(\w+)/);
      const isSelfPtr = (() => {
        if(!ptrMatch) return false;
        // heuristic: if line contains struct <Name> *  it's likely self ptr
        // also typedef self: No *prox where No is typedef name
        return /struct\s+\w+\s*\*/.test(line) || /\*\s*(prox|next|ant|prev|anterior|esquerda|direita|left|right|esq|dir)/i.test(line);
      })();
      fields.push({ raw: line, isSelfPtr, isPointer: line.includes('*') });
    }
    structs.push({ raw: m[0], name: m[2]||m[4]||'', body, fields });
  }

  // global pointer vars: No *inicio = NULL;  struct No *topo;
  // remove struct bodies to avoid capturing field pointers
  const withoutStructs = normalized.replace(/(typedef\s+)?struct\s+\w*\s*\{[^}]+\}\s*\w*\s*;/g, ' ');
  const globals = [];
  const globalRe = /(?:struct\s+\w+|\w+)\s*\*\s*(\w+)\s*(?:=\s*NULL)?\s*;/g;
  while((m = globalRe.exec(withoutStructs))){
    const name = m[1];
    // exclude field-like names that are not globals? keep all, struct removal already prevents fields
    // also filter common type names mistaken as var
    if(!/^(No|Node|struct)$/i.test(name)){
      globals.push(name);
    }
  }

  // functions
  const functions = [];
  const funcRe = /\b(\w+)\s+(\w+)\s*\([^)]*\)\s*\{/g;
  while((m = funcRe.exec(normalized))){
    functions.push({ retType: m[1], name: m[2] });
  }
  const funcNames = functions.map(f=>f.name.toLowerCase());

  // pointer assignments
  const pointerAssigns = [];
  const assignRe = /(\w+)\s*->\s*(prox|next|ant|prev|anterior|esquerda|direita|left|right|esq|dir)\s*=/gi;
  while((m = assignRe.exec(normalized))){
    pointerAssigns.push({ left: m[1], field: m[2].toLowerCase() });
  }

  // raw lower for keyword search
  const lower = normalized.toLowerCase();

  return { original, normalized, lower, structs, globals, functions, funcNames, pointerAssigns };
}
