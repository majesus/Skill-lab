const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const C = require('../skill-core.js');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../skill-examples.js'), 'utf8'), context);
const examples = context.window.SkillExamples;
const guided = () => JSON.parse(JSON.stringify(examples.indicators.state));

test('YAML roundtrip preserves punctuation, newlines, metadata and the complete body', () => {
  const state = guided();
  state.description = 'Redacta: "método" # sin perder signos\nUsar al pedir un método.';
  state.extras = { metadata: { author: 'María: ejemplo', version: '1.0' }, license: 'MIT' };
  const result = C.parse('\uFEFF' + C.markdown(state).replace(/\n/g, '\r\n'));
  assert.equal(result.description, state.description);
  assert.deepEqual(result.extras, state.extras);
  assert.ok(result.body.includes('## Qué no debe hacer'));
  assert.throws(() => C.parse('---\nname: prueba\ndescription: método: errado\n---\nTexto'));
});

test('names and descriptions enforce structural limits without making the 200-character advice mandatory', () => {
  for (const name of ['MAYUSCULAS', '../salir', 'dos--guiones', '-inicio', 'final-', 'con', 'nul', 'x'.repeat(65)]) {
    const s = guided(); s.name = name; assert.ok(C.validate(s).errors.length, name);
  }
  const s = guided(); s.description = 'a'.repeat(201);
  assert.equal(C.validate(s).errors.length, 0); assert.ok(C.validate(s).warnings.length);
  s.description = 'a'.repeat(1025); assert.ok(C.validate(s).errors.length);
  assert.equal(C.slug('  Mi análisis: revisión 2  '), 'mi-analisis-revision-2');
});

test('aliases and unsupported complex metadata cannot cause circular serialization', () => {
  assert.throws(() => C.parse('---\nname: prueba\ndescription: Prueba\nmetadata: &x\n  ciclo: *x\n---\nTexto'));
});

test('resources cannot escape, collide or leave unresolved local links', () => {
  const s = guided();
  for (const p of ['../fuera.txt', '/absoluta', 'C:/secreto', 'references/../fuera', 'references\\fuera', 'assets/con.txt']) assert.equal(C.validPath(p), false, p);
  const r = path => ({ path, bytes: new Uint8Array([0, 255, 1]) });
  assert.ok(C.validate(s, [r('references/a'), r('references/a/b')]).errors.length);
  assert.ok(C.validate(s, [r('assets/A.txt'), r('assets/a.txt')]).errors.length);
  assert.ok(C.validate(s, [r('SKILL.md')]).errors.length);
  s.needs += '\n[Guía](references/guia.md)'; assert.ok(C.validate(s).errors.length);
  assert.equal(C.validate(s, [r('references/guia.md')]).errors.length, 0);
  s.needs += '\n[Externo](../otro/SKILL.md)'; assert.ok(C.validate(s).errors.length);
});

test('fenced examples are not interpreted as missing dependencies', () => {
  const s = guided(); s.workflow += '\n\n```markdown\n[Ejemplo](references/no-incluida.md)\n```';
  assert.equal(C.validate(s).errors.length, 0);
});

test('all five examples package with local resources and preserve source instructions', () => {
  for (const [name, example] of Object.entries(examples)) {
    const state = example.state || { ...C.parse(example.markdown), mode: 'free', tests: [] };
    const resources = example.resources.map(r => ({ path: r.path, bytes: new TextEncoder().encode(r.content) }));
    assert.deepEqual(C.validate(state, resources).errors, [], name);
    const files = C.files(state, resources);
    const parsed = C.parse(new TextDecoder().decode(files[0].bytes));
    if (example.markdown) assert.equal(parsed.body, C.parse(example.markdown).body);
    assert.ok(files.every(f => f.path === 'SKILL.md' || C.validPath(f.path)));
  }
});

test('ZIP preserves binary bytes and includes one named top-level folder', () => {
  const bytes = new Uint8Array([0, 255, 128, 13, 10, 0]);
  const zip = C.zip('prueba-binaria', [{ path: 'SKILL.md', bytes: new TextEncoder().encode('Texto') }, { path: 'assets/prueba.bin', bytes }]);
  const view = new DataView(zip.buffer); let pos = 0; const entries = [];
  while (view.getUint32(pos, true) === 0x04034b50) {
    const length = view.getUint32(pos + 18, true), namesize = view.getUint16(pos + 26, true);
    const name = new TextDecoder().decode(zip.slice(pos + 30, pos + 30 + namesize));
    const data = zip.slice(pos + 30 + namesize, pos + 30 + namesize + length); entries.push([name, data]);
    pos += 30 + namesize + length;
  }
  assert.equal(entries[1][0], 'prueba-binaria/assets/prueba.bin'); assert.deepEqual(entries[1][1], bytes);
  assert.equal(view.getUint32(pos, true), 0x02014b50);
  assert.throws(() => C.zip('../fuera', []));
});

test('every exported skill carries an academic integrity notice and its complete local reference', () => {
  const files = C.files(guided());
  const manifest = new TextDecoder().decode(files.find(f => f.path === 'SKILL.md').bytes);
  assert.ok(manifest.includes('## Integridad académica y uso responsable de IA'));
  const notice = new TextDecoder().decode(files.find(f => f.path === 'references/integridad-academica.md').bytes);
  assert.ok(notice.includes('Artículo 4'));
  assert.ok(notice.includes('Artículo 50.4'));
  assert.ok(notice.includes('no constituye asesoramiento jurídico ni un certificado'));
  const imported = { ...C.parse(manifest), mode: 'free', tests: [] };
  const exported = C.markdown(imported);
  assert.equal((exported.match(/## Integridad académica y uso responsable de IA/g) || []).length, 1);
  const preserved = files.filter(f => f.path !== 'SKILL.md');
  assert.equal(C.files(imported, preserved).filter(f => f.path === 'references/integridad-academica.md').length, 1);
});
