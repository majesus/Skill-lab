/* Skill Lab · formato, validación y ZIP. Sin conexiones ni ejecución de recursos. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./vendor/js-yaml.min.js'));
  else root.SkillCore = factory(root.jsyaml);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (yaml) {
  'use strict';
  const sections = [
    ['task', 'Tarea'], ['when', 'Cuándo se usa'], ['needs', 'Qué necesita'],
    ['workflow', 'Qué hace'], ['output', 'Qué entrega'], ['limits', 'Qué no debe hacer']
  ];
  const encoder = new TextEncoder();
  const size = s => Array.from(s).length;
  const slug = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64).replace(/-+$/g, '');
  const reserved = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i;
  function validPath(path) {
    if (typeof path !== 'string' || path.length > 240 || path.includes('\\')) return false;
    const parts = path.split('/');
    return parts.every(p => /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(p) && !p.endsWith('.') && !reserved.test(p)) &&
      !parts.some(p => p === '.' || p === '..');
  }
  function plainTree(value, depth = 0, seen = new Set()) {
    if (depth > 10 || seen.size > 5000) throw Error('La cabecera YAML es demasiado compleja. Simplifique los metadatos.');
    if (value && typeof value === 'object') {
      if (seen.has(value)) throw Error('Simplifique los alias o referencias repetidas del YAML antes de importar.');
      seen.add(value);
      Object.values(value).forEach(v => plainTree(v, depth + 1, seen));
    }
  }
  function parse(text) {
    if (typeof text !== 'string' || text.length > 1000000) throw Error('El archivo debe ser texto y ocupar menos de 1 MB.');
    text = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    const match = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(text);
    if (!match) throw Error('Falta la cabecera YAML entre dos líneas --- al principio del archivo.');
    let meta;
    try { meta = yaml.load(match[1], { schema: yaml.CORE_SCHEMA }); }
    catch (error) { throw Error('Cabecera YAML no válida: ' + error.message); }
    if (!meta || typeof meta !== 'object' || Array.isArray(meta)) throw Error('La cabecera debe contener campos YAML, como name y description.');
    plainTree(meta);
    if (typeof meta.name !== 'string' || typeof meta.description !== 'string') throw Error('name y description deben ser textos. Si contienen signos, use comillas.');
    const extras = Object.fromEntries(Object.entries(meta).filter(([k]) => !['name', 'description'].includes(k)));
    return { name: meta.name, description: meta.description, extras, body: text.slice(match[0].length).trim() };
  }
  function body(state) {
    if (state.mode === 'free') return state.body.trim();
    const title = state.title.trim() || state.name.trim() || 'Mi skill';
    return '# ' + title.replace(/[\r\n]+/g, ' ') + '\n\n' + sections.map(([key, title]) =>
      '## ' + title + '\n\n' + (state[key] || '').trim()).join('\n\n');
  }
  function testFile(tests) {
    return '# Pruebas de la skill\n\nEstas pruebas deben realizarse en un asistente. El editor no las ejecuta ni acredita activación automática.\n\n' +
      tests.map((t, i) => '## ' + ['Caso normal', 'Información incompleta', 'Fuera de propósito'][i] +
        '\n\n**Petición:**\n\n' + (t.prompt || '(pendiente)') + '\n\n**Comportamiento esperado:**\n\n' +
        (t.expected || '(pendiente)') + '\n\n**Estado:** ' + (t.status || 'Sin probar') + '\n\n**Observación:**\n\n' +
        (t.observed || '(sin observación registrada)')).join('\n\n') + '\n';
  }
  function hasTests(state) { return (state.tests || []).some(t => t.prompt || t.expected || t.observed || t.status !== 'Sin probar'); }
  function markdown(state) {
    const meta = { name: state.name.trim(), description: state.description.trim(), ...(state.extras || {}) };
    // Imported metadata cannot override the two fields edited in the form.
    meta.name = state.name.trim(); meta.description = state.description.trim();
    let content = body(state);
    if (hasTests(state)) content += '\n\n## Pruebas de uso\n\nPara probar esta skill, consulte [references/pruebas-skill-lab.md](references/pruebas-skill-lab.md). Las pruebas son un plan; revise allí su estado real.';
    return '---\n' + yaml.dump(meta, { lineWidth: -1, noRefs: true, quotingType: '"', forceQuotes: true, schema: yaml.CORE_SCHEMA }).trimEnd() + '\n---\n\n' + content + '\n';
  }
  function localLinks(text) {
    const links = [];
    // Links inside fenced examples are illustrative, not package dependencies.
    const prose = text.replace(/^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\1[ \t]*$/gm, '');
    for (const m of prose.matchAll(/!?\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
      let path = m[1].replace(/^<|>$/g, '').split('#')[0];
      if (!path || /^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith('//')) continue;
      try { path = decodeURIComponent(path); } catch { /* Invalid URL will fail the path check. */ }
      links.push(path.replace(/^\.\//, ''));
    }
    return [...new Set(links)];
  }
  function validate(state, resources = []) {
    const errors = [], warnings = [];
    const name = state.name.trim(), desc = state.description.trim();
    if (!name || name.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) errors.push('Nombre: use de 1 a 64 letras minúsculas sin tildes, números y guiones simples entre palabras.');
    if (reserved.test(name)) errors.push('Ese nombre está reservado en Windows. Elija otro para poder crear la carpeta.');
    if (!desc || size(desc) > 1024) errors.push('Descripción: escriba entre 1 y 1024 caracteres.');
    if (/[<>]/.test(name + desc)) errors.push('Evite etiquetas XML y signos < > en name y description para la compatibilidad del taller.');
    if (/claude|anthropic/i.test(name)) warnings.push('Claude reserva «claude» y «anthropic» en los nombres. Elija otro si va a usar esa plataforma.');
    if (size(desc) > 200) warnings.push('La descripción supera unos 200 caracteres: revise si puede acortarla. Es una pauta del taller; el máximo técnico es 1024.');
    if (state.mode === 'guided') sections.forEach(([key, title]) => { if (!(state[key] || '').trim()) errors.push('Complete «' + title + '» en el recorrido guiado.'); });
    else if (!state.body.trim()) errors.push('Las instrucciones están vacías.');
    const content = body(state);
    if (content.split('\n').length >= 500) warnings.push('El cuerpo alcanza 500 líneas. Considere trasladar el detalle a references/.');
    if (/\[TODO\b|\[PENDIENTE\]|\[ESCRIBIR\]/i.test(content)) warnings.push('Hay marcadores de borrador en las instrucciones. Revise si deben completarse antes de usar la skill.');
    const names = new Set(); let bytes = 0;
    for (const r of resources) {
      if (!validPath(r.path)) errors.push('Ruta de recurso no válida: ' + r.path);
      if (r.path.toLowerCase() === 'skill.md') errors.push('SKILL.md se genera desde el editor; no se puede añadir como recurso.');
      if (names.has(r.path.toLowerCase())) errors.push('Recurso duplicado: ' + r.path);
      names.add(r.path.toLowerCase()); bytes += r.bytes.length;
    }
    for (const p of names) for (const q of names) if (p !== q && q.startsWith(p + '/')) errors.push('Un archivo y una carpeta comparten ruta: ' + p);
    if (resources.length > 100 || bytes > 20 * 1024 * 1024) errors.push('Use hasta 100 recursos y 20 MB en total en este editor.');
    const tests = hasTests(state);
    if (tests && names.has('references/pruebas-skill-lab.md')) errors.push('El nombre references/pruebas-skill-lab.md está reservado para las pruebas del editor. Renombre su recurso.');
    const allPaths = new Set(['SKILL.md', ...resources.map(r => r.path), ...(tests ? ['references/pruebas-skill-lab.md'] : [])]);
    localLinks(content).forEach(path => {
      if (path !== 'SKILL.md' && !validPath(path)) errors.push('El enlace debe apuntar dentro de esta skill: ' + path);
      else if (!allPaths.has(path)) errors.push('Falta el archivo enlazado: ' + path + '. Añádalo en Recursos o corrija el enlace.');
    });
    const extra = state.extras || {};
    const known = new Set(['metadata', 'license', 'compatibility', 'allowed-tools']);
    Object.keys(extra).filter(k => !known.has(k)).forEach(k => warnings.push('Se conserva el campo adicional «' + k + '». Su compatibilidad depende del producto.'));
    if (extra.metadata && (typeof extra.metadata !== 'object' || Array.isArray(extra.metadata) || Object.values(extra.metadata).some(v => typeof v !== 'string'))) errors.push('metadata debe ser un mapa de claves y valores de texto. Corrija la cabecera en el archivo e impórtelo de nuevo.');
    if (extra.compatibility !== undefined && (typeof extra.compatibility !== 'string' || size(extra.compatibility) > 500)) errors.push('compatibility debe ser texto de hasta 500 caracteres.');
    return { errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
  }
  function files(state, resources = []) {
    const check = validate(state, resources);
    if (check.errors.length) throw Error(check.errors.join('\n'));
    const list = [{ path: 'SKILL.md', bytes: encoder.encode(markdown(state)) }, ...resources];
    if (hasTests(state)) list.push({ path: 'references/pruebas-skill-lab.md', bytes: encoder.encode(testFile(state.tests)) });
    return list;
  }
  const table = Array.from({ length: 256 }, (_, n) => {
    let c = n; for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  function crc32(bytes) { let c = 0xffffffff; for (const b of bytes) c = table[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
  function zip(name, list) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64 || reserved.test(name)) throw Error('Nombre de carpeta no válido.');
    const chunks = [], central = []; let offset = 0;
    for (const f of list) {
      if (f.path !== 'SKILL.md' && !validPath(f.path)) throw Error('Ruta ZIP no válida.');
      const path = encoder.encode(name + '/' + f.path), data = f.bytes, crc = crc32(data);
      const header = new Uint8Array(30 + path.length), d = new DataView(header.buffer);
      d.setUint32(0, 0x04034b50, true); d.setUint16(4, 20, true); d.setUint16(6, 0x800, true);
      d.setUint16(12, 33, true); d.setUint32(14, crc, true); d.setUint32(18, data.length, true); d.setUint32(22, data.length, true); d.setUint16(26, path.length, true); header.set(path, 30);
      const entry = new Uint8Array(46 + path.length), e = new DataView(entry.buffer);
      e.setUint32(0, 0x02014b50, true); e.setUint16(4, 20, true); e.setUint16(6, 20, true); e.setUint16(8, 0x800, true); e.setUint16(14, 33, true);
      e.setUint32(16, crc, true); e.setUint32(20, data.length, true); e.setUint32(24, data.length, true); e.setUint16(28, path.length, true); e.setUint32(42, offset, true); entry.set(path, 46);
      chunks.push(header, data); central.push(entry); offset += header.length + data.length;
    }
    const end = new Uint8Array(22), e = new DataView(end.buffer), centralSize = central.reduce((n, b) => n + b.length, 0);
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, list.length, true); e.setUint16(10, list.length, true); e.setUint32(12, centralSize, true); e.setUint32(16, offset, true);
    const result = new Uint8Array(offset + centralSize + end.length); let pos = 0;
    for (const part of [...chunks, ...central, end]) { result.set(part, pos); pos += part.length; }
    return result;
  }
  return { sections, slug, validPath, parse, body, markdown, validate, files, zip, testFile, hasTests };
});
