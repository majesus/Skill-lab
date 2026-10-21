(function () {
  'use strict';
  const C = window.SkillCore, $ = id => document.getElementById(id), KEY = 'skill-lab-draft-v1';
  const textFields = ['name', 'description', 'title', ...C.sections.map(x => x[0])];
  const blankTests = () => Array.from({ length: 3 }, () => ({ prompt: '', expected: '', observed: '', status: 'Sin probar' }));
  const blank = () => ({ ...Object.fromEntries(textFields.map(x => [x, ''])), body: '', mode: 'guided', extras: {}, tests: blankTests() });
  let state = blank(), resources = [], pendingResources = [], currentStep = 1, toastTimer, restored = false;
  const encoder = new TextEncoder();
  function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 7000); }
  function hasContent() { return textFields.some(k => state[k].trim()) || state.body.trim() || resources.length || pendingResources.length; }
  function replaceAllowed() { return !hasContent() || window.confirm('Se sustituirá el borrador actual. Para conservarlo con sus recursos, pulse Cancelar y use «Guardar proyecto». ¿Continuar?'); }
  function showStep(n, focus = true) {
    currentStep = n;
    [1, 2, 3].forEach(i => {
      $('step-' + i).hidden = i !== n;
      const button = document.querySelector('[data-step="' + i + '"]');
      button.classList.toggle('active', i === n);
      if (i === n) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
    });
    if (focus) { $('heading-' + n).focus(); $('editor').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }
  function saveDraft() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ version: 1, state, pendingResources: [...new Set([...resources.map(r => r.path), ...pendingResources])] }));
      $('draft-status').textContent = (restored ? 'Borrador restaurado. ' : '') + 'Texto guardado en este navegador' + (resources.length || pendingResources.length ? '; guarde el proyecto para conservar los recursos.' : '.');
    } catch { $('draft-status').textContent = 'El navegador no permite guardar el borrador. Use «Guardar proyecto» para conservarlo.'; }
  }
  function hydrate(data) {
    if (!data || typeof data !== 'object') throw Error('El proyecto no contiene un borrador válido.');
    const out = blank();
    for (const k of [...textFields, 'body']) if (typeof data[k] === 'string' && data[k].length <= 1000000) out[k] = data[k];
    out.mode = data.mode === 'free' ? 'free' : 'guided';
    if (data.extras) {
      // Reuse the YAML parser's bounded, plain-data validation.
      out.extras = C.parse('---\n' + window.jsyaml.dump({ ...data.extras, name: 'project-check', description: 'Project check' }) + '---\n').extras;
    }
    if (Array.isArray(data.tests)) out.tests = blankTests().map((t, i) => {
      const source = data.tests[i] || {};
      ['prompt', 'expected', 'observed'].forEach(k => { if (typeof source[k] === 'string') t[k] = source[k].slice(0, 100000); });
      if (['Sin probar', 'Funciona', 'Necesita cambios'].includes(source.status)) t.status = source.status;
      return t;
    });
    return out;
  }
  function fill() {
    textFields.forEach(k => { $(k).value = state[k]; }); $('free-body').value = state.body;
    $('guided-fields').hidden = state.mode !== 'guided'; $('free-fields').hidden = state.mode !== 'free';
    $('mode-label').textContent = state.mode === 'guided' ? 'Recorrido guiado' : 'Edición libre · cuerpo completo';
    $('mode-btn').textContent = state.mode === 'guided' ? 'Usar edición libre' : 'Volver al recorrido guiado';
    state.tests.forEach((t, i) => Object.keys(t).forEach(k => { $('test-' + i + '-' + k).value = t[k]; }));
    render();
  }
  function renderResources() {
    const ul = $('resource-list'); ul.replaceChildren();
    resources.forEach((r, index) => {
      const li = document.createElement('li'), label = document.createElement('span'), button = document.createElement('button');
      label.textContent = r.path + ' · ' + (r.bytes.length < 1024 ? r.bytes.length + ' B' : Math.ceil(r.bytes.length / 1024) + ' KB');
      button.textContent = 'Quitar ×'; button.setAttribute('aria-label', 'Quitar ' + r.path);
      button.addEventListener('click', () => { resources.splice(index, 1); render(); }); li.append(label, button); ul.append(li);
    });
    pendingResources.forEach((path, index) => {
      const li = document.createElement('li'), label = document.createElement('span'), button = document.createElement('button');
      label.textContent = path + ' · pendiente de volver a adjuntar'; button.textContent = 'Descartar ×';
      button.addEventListener('click', () => { pendingResources.splice(index, 1); render(); }); li.append(label, button); ul.append(li);
    });
  }
  function render() {
    const check = C.validate(state, resources);
    pendingResources.forEach(path => check.errors.push('Vuelva a adjuntar el recurso del borrador: ' + path + ', o descártelo en Recursos.'));
    $('preview').textContent = C.markdown(state);
    $('name-count').textContent = state.name.length + ' / 64';
    $('description-count').textContent = Array.from(state.description).length + ' / 1024';
    $('folder-hint').textContent = (state.name.trim() || 'mi-skill') + '/SKILL.md';
    const paths = ['SKILL.md', ...resources.map(r => r.path), ...pendingResources.map(p => p + ' [pendiente]')];
    if (!resources.some(r => r.path === 'references/integridad-academica.md') && !pendingResources.includes('references/integridad-academica.md')) paths.push('references/integridad-academica.md');
    if (C.hasTests(state)) paths.push('references/pruebas-skill-lab.md');
    $('tree').textContent = (state.name.trim() || 'mi-skill') + '/\n' + paths.map((p, i) => (i === paths.length - 1 ? '└── ' : '├── ') + p).join('\n');
    $('structure-status').textContent = check.errors.length ? 'Borrador · ' + check.errors.length + ' pendiente(s)' : 'Estructura comprobada';
    $('validation-summary').textContent = check.errors.length ? check.errors.length + ' punto(s) por resolver antes de exportar.' : 'La estructura permite exportar. Falta probar el comportamiento en su asistente.';
    const ul = $('validation-list'); ul.replaceChildren();
    [...check.errors.map(t => ['validation-error', t]), ...check.warnings.map(t => ['validation-warning', t])].forEach(([cls, text]) => { const li = document.createElement('li'); li.className = cls; li.textContent = text; ul.append(li); });
    ['zip-btn', 'md-btn'].forEach(id => { $(id).disabled = !!check.errors.length; });
    $('folder-btn').disabled = !!check.errors.length || typeof window.showDirectoryPicker !== 'function' || !window.isSecureContext;
    $('folder-support').textContent = typeof window.showDirectoryPicker === 'function' && window.isSecureContext ? 'Elija una carpeta de destino: se creará una subcarpeta nueva. No se sobrescriben carpetas existentes.' : 'Este navegador no permite crear carpetas directamente. Descargue el ZIP y extráigalo; contiene la misma estructura.';
    renderResources(); saveDraft();
  }
  function imported(text) {
    const parsed = C.parse(text), next = blank();
    next.name = parsed.name; next.description = parsed.description; next.extras = parsed.extras; next.body = parsed.body; next.mode = 'free';
    return next;
  }
  function bytesToBase64(bytes) {
    let result = ''; for (let i = 0; i < bytes.length; i += 16384) result += String.fromCharCode(...bytes.subarray(i, i + 16384));
    return btoa(result);
  }
  function base64ToBytes(text) {
    if (typeof text !== 'string' || text.length > 28 * 1024 * 1024) throw Error('Recurso de proyecto no válido o demasiado grande.');
    return Uint8Array.from(atob(text), c => c.charCodeAt(0));
  }
  function readResources(items) {
    if (!Array.isArray(items) || items.length > 100) throw Error('El proyecto admite como máximo 100 recursos.');
    const output = items.map(r => { if (!C.validPath(r.path)) throw Error('Ruta no válida: ' + r.path); return { path: r.path, bytes: base64ToBytes(r.data) }; });
    if (output.reduce((n, r) => n + r.bytes.length, 0) > 20 * 1024 * 1024) throw Error('Los recursos superan 20 MB.');
    return output;
  }
  function download(bytes, name, type) {
    const url = URL.createObjectURL(new Blob([bytes], { type })), a = document.createElement('a');
    a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  function checkedFiles() { if (pendingResources.length) throw Error('Faltan recursos del borrador. Vuelva a adjuntarlos o descártelos.'); return C.files(state, resources); }
  function toGuided() {
    const body = state.body.trim(), fields = {};
    const headings = [...body.matchAll(/^## (.+)\s*$/gm)];
    if (headings.length !== C.sections.length || headings.some((h, i) => h[1].trim() !== C.sections[i][1])) throw Error('Este cuerpo tiene una estructura propia. Mantenga la edición libre para conservar todo su contenido.');
    for (let i = 0; i < headings.length; i++) fields[C.sections[i][0]] = body.slice(headings[i].index + headings[i][0].length, headings[i + 1]?.index ?? body.length).trim();
    const before = body.slice(0, headings[0].index).trim();
    if (before && !/^# [^\n]+$/.test(before)) throw Error('Hay contenido introductorio adicional. Mantenga la edición libre para conservarlo.');
    Object.assign(state, fields); state.title = before.replace(/^# /, ''); state.mode = 'guided';
  }
  document.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => showStep(Number(b.dataset.step))));
  document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => showStep(Number(b.dataset.goto))));
  textFields.forEach(k => $(k).addEventListener('input', () => { state[k] = $(k).value; restored = false; render(); }));
  $('free-body').addEventListener('input', () => { state.body = $('free-body').value; render(); });
  $('normalize-btn').addEventListener('click', () => { state.name = C.slug(state.name); fill(); toast('Nombre ajustado; revise que describa la tarea.'); });
  $('mode-btn').addEventListener('click', () => { try { if (state.mode === 'guided') { state.body = C.body(state); state.mode = 'free'; } else toGuided(); fill(); } catch (e) { toast(e.message); } });
  $('new-btn').addEventListener('click', () => { if (!replaceAllowed()) return; state = blank(); resources = []; pendingResources = []; restored = false; fill(); showStep(1); });
  $('example-btn').addEventListener('click', () => {
    if (!replaceAllowed()) return;
    const example = window.SkillExamples[$('example-select').value];
    state = example.state ? hydrate(example.state) : imported(example.markdown);
    resources = (example.resources || []).map(r => ({ path: r.path, bytes: encoder.encode(r.content) })); pendingResources = []; restored = false;
    fill(); showStep(1); toast('Ejemplo cargado. Adáptelo a su tarea; no se ha ejecutado en un asistente.');
  });
  $('import-btn').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', async () => {
    const file = $('import-file').files[0]; $('import-file').value = ''; if (!file) return;
    try {
      if (file.size > 30 * 1024 * 1024) throw Error('El archivo supera 30 MB.');
      const text = await file.text(); let next, nextResources = [], missing = [];
      if (file.name.toLowerCase().endsWith('.json')) {
        const project = JSON.parse(text); if (project.version !== 1 || project.app !== 'skill-lab') throw Error('No es un proyecto de Skill Lab versión 1.');
        next = hydrate(project.state); nextResources = readResources(project.resources || []);
        missing = Array.isArray(project.pendingResources) ? project.pendingResources.filter(p => C.validPath(p)) : [];
      } else next = imported(text);
      if (!replaceAllowed()) return;
      state = next; resources = nextResources; pendingResources = missing; restored = false; fill(); showStep(2);
      toast('Archivo importado. El contenido se conserva como texto; los recursos no se ejecutan.');
    } catch (error) { toast(error.message); }
  });
  $('import-folder-btn').addEventListener('click', () => $('import-folder').click());
  $('import-folder').addEventListener('change', async () => {
    const list = [...$('import-folder').files]; $('import-folder').value = ''; if (!list.length) return;
    try {
      if (list.length > 101 || list.reduce((n, f) => n + f.size, 0) > 21 * 1024 * 1024) throw Error('Importe una sola skill, con hasta 100 recursos y 20 MB de recursos.');
      const manifests = list.filter(f => f.webkitRelativePath.split('/').length === 2 && f.name.toLowerCase() === 'skill.md');
      if (manifests.length !== 1) throw Error('Elija una sola carpeta que contenga SKILL.md directamente dentro.');
      const manifest = manifests[0], next = imported(await manifest.text()), nextResources = [];
      for (const f of list) if (f !== manifest) {
        const path = f.webkitRelativePath.split('/').slice(1).join('/');
        if (path.split('/').some(p => p.startsWith('.'))) continue;
        if (!C.validPath(path)) throw Error('Ruta no compatible con una carpeta portable: ' + path);
        nextResources.push({ path, bytes: new Uint8Array(await f.arrayBuffer()) });
      }
      if (!replaceAllowed()) return;
      state = next; resources = nextResources; pendingResources = []; restored = false; fill(); showStep(2);
      toast('Carpeta importada con sus recursos. Al exportar, el nombre de carpeta coincidirá con name.');
    } catch (error) { toast(error.message); }
  });
  $('resource-add-btn').addEventListener('click', () => $('resource-files').click());
  $('resource-files').addEventListener('change', async () => {
    const list = [...$('resource-files').files]; $('resource-files').value = '';
    try {
      if (resources.length + list.length > 100 || resources.reduce((n, r) => n + r.bytes.length, 0) + list.reduce((n, f) => n + f.size, 0) > 20 * 1024 * 1024) throw Error('Se permiten hasta 100 recursos y 20 MB en total.');
      const additions = [];
      for (const f of list) {
        const path = $('resource-kind').value + '/' + f.name;
        if (!C.validPath(path)) throw Error('Renombre el archivo sin tildes, espacios ni caracteres especiales: ' + f.name);
        if ([...resources, ...additions].some(r => r.path.toLowerCase() === path.toLowerCase())) throw Error('Ya existe un recurso con esa ruta: ' + path + '. Quítelo antes de añadir el reemplazo.');
        additions.push({ path, bytes: new Uint8Array(await f.arrayBuffer()) });
      }
      resources.push(...additions); pendingResources = pendingResources.filter(p => !additions.some(r => r.path === p)); render();
    } catch (error) { toast(error.message); }
  });
  ['Caso normal', 'Información incompleta', 'Fuera de propósito'].forEach((title, i) => {
    const div = document.createElement('div'); div.className = 'test-case';
    // Static labels only; imported content is assigned to .value in fill().
    div.innerHTML = '<h4>' + (i + 1) + ' · ' + title + '</h4>' + ['prompt', 'expected', 'observed'].map((k, n) => '<div class="field"><label for="test-' + i + '-' + k + '">' + ['Petición para probar', 'Qué debería ocurrir', 'Qué ocurrió realmente'][n] + '</label><textarea rows="3" id="test-' + i + '-' + k + '"></textarea></div>').join('') + '<label for="test-' + i + '-status">Estado de la prueba</label><select id="test-' + i + '-status"><option>Sin probar</option><option>Funciona</option><option>Necesita cambios</option></select>';
    $('test-fields').append(div);
    ['prompt', 'expected', 'observed', 'status'].forEach(k => $('test-' + i + '-' + k).addEventListener('input', () => { state.tests[i][k] = $('test-' + i + '-' + k).value; render(); }));
  });
  $('save-project').addEventListener('click', () => { const data = { app: 'skill-lab', version: 1, state, resources: resources.map(r => ({ path: r.path, data: bytesToBase64(r.bytes) })), pendingResources }; download(JSON.stringify(data, null, 2), (C.slug(state.name) || 'borrador') + '.skill-lab.json', 'application/json'); toast('Proyecto guardado: incluye los recursos adjuntos y el estado de las pruebas.'); });
  $('zip-btn').addEventListener('click', () => { try { download(C.zip(state.name.trim(), checkedFiles()), state.name.trim() + '.zip', 'application/zip'); toast('ZIP preparado con una única carpeta raíz. No se ha instalado la skill.'); } catch (e) { toast(e.message); } });
  $('md-btn').addEventListener('click', () => { try { checkedFiles(); download(C.markdown(state), 'SKILL.md', 'text/markdown;charset=utf-8'); } catch (e) { toast(e.message); } });
  $('folder-btn').addEventListener('click', async () => {
    let targetCreated = false;
    try {
      const list = checkedFiles(), name = state.name.trim();
      const parent = await window.showDirectoryPicker({ mode: 'readwrite' });
      try { await parent.getDirectoryHandle(name); throw Error('Ya existe una carpeta llamada ' + name + '. Elija otro destino para no sobrescribirla.'); }
      catch (e) { if (e.name !== 'NotFoundError') throw e; }
      const directory = await parent.getDirectoryHandle(name, { create: true }); targetCreated = true;
      for (const f of list) {
        const parts = f.path.split('/'); let handle = directory;
        for (const p of parts.slice(0, -1)) handle = await handle.getDirectoryHandle(p, { create: true });
        const file = await handle.getFileHandle(parts.at(-1), { create: true }), writer = await file.createWritable(); await writer.write(f.bytes); await writer.close();
      }
      toast('Carpeta ' + name + ' creada con SKILL.md y sus recursos.');
    } catch (error) { if (error.name !== 'AbortError') toast((targetCreated ? 'La carpeta puede haber quedado incompleta. ' : '') + error.message + ' Puede usar la descarga ZIP.'); }
  });
  $('copy-btn').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(C.markdown(state)); toast('SKILL.md copiado; los recursos se exportan con el ZIP.'); }
    catch { const range = document.createRange(); range.selectNodeContents($('preview')); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); toast('Texto seleccionado. Pulse Ctrl+C o ⌘C para copiarlo.'); }
  });
  $('help-btn').addEventListener('click', () => $('help-dialog').showModal()); $('close-help').addEventListener('click', () => $('help-dialog').close());
  try {
    const draft = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (draft && draft.version === 1) { state = hydrate(draft.state); pendingResources = Array.isArray(draft.pendingResources) ? draft.pendingResources.filter(p => C.validPath(p)) : []; restored = true; }
  } catch { /* A blocked or invalid draft must not prevent editing. */ }
  fill(); showStep(1, false);
})();
