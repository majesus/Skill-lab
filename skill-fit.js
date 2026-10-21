/* Orientación docente adaptada del ejercicio «¿Prompt convencional o skill?». */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SkillFit = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const questions = [
    '¿La tarea se repite en distintos análisis, informes o situaciones?',
    '¿Quiere mantener un mismo formato o criterio en el resultado?',
    '¿Puede describir cómo hacerla mediante pasos claros?',
    '¿Sabría reconocer un buen resultado y detectar un error?',
    '¿Parte habitualmente del mismo tipo de material o información?',
    '¿Puede usar los materiales de forma autorizada y revisar críticamente el resultado?'
  ];
  const examples = {
    translate: { title: 'Traducir un resumen una sola vez', task: 'Traducir al inglés el resumen de mi artículo, una sola vez.', answers: ['no', 'no', 'no', 'yes', 'no', 'yes'], note: 'Es una tarea puntual y sin un procedimiento que necesite conservar. Un prompt puede bastar.' },
    methods: { title: 'Redactar el método de cada estudio', task: 'Redactar el apartado de método de cada estudio bibliométrico siguiendo los mismos criterios.', answers: ['yes', 'yes', 'yes', 'yes', 'yes', 'yes'], note: 'Se repite, tiene entradas reconocibles y un formato que puede comprobarse. Es una buena candidata a skill.' },
    titles: { title: 'Proponer títulos para un artículo', task: 'Proponer varias ideas de título para mi próximo artículo.', answers: ['no', 'no', 'no', 'yes', 'no', 'yes'], note: 'Para este encargo puntual basta describir el artículo y pedir alternativas en un prompt.' },
    indicators: { title: 'Leer tablas de producción anual', task: 'Leer y comentar la tabla de producción anual de cada análisis bibliométrico, con cifras y límites comprobables.', answers: ['yes', 'yes', 'yes', 'yes', 'yes', 'yes'], note: 'Hay una tarea recurrente, material del mismo tipo y un criterio de salida verificable.' },
    explain: { title: 'Explicar un indicador cuando lo pidan', task: 'Explicar a mi manera un indicador bibliométrico cuando me lo preguntan.', answers: ['yes', 'no', 'yes', 'yes', 'no', 'yes'], note: 'Puede acotarla: por ejemplo, explicar siempre un indicador con definición, ejemplo y límite, a partir de una ficha mínima.' },
    merit: { title: 'Ordenar candidatos solo por sus citas', task: 'Ordenar a los candidatos de un concurso según su mérito científico usando únicamente su número de citas.', answers: ['yes', 'yes', 'yes', 'yes', 'yes', 'no'], note: 'Las citas no acreditan el mérito de una persona. Reformule el encargo como una descripción de indicadores y reserve la evaluación a un juicio humano con criterios adecuados.' }
  };
  function initial() { return { task: '', selection: '', answers: Array(6).fill(null), example: false }; }
  function restore(data) {
    const out = initial();
    if (!data || typeof data !== 'object') return out;
    if (typeof data.task === 'string') out.task = data.task.slice(0, 1000);
    if (Object.hasOwn(examples, data.selection)) out.selection = data.selection;
    if (Array.isArray(data.answers)) out.answers = out.answers.map((_, i) => ['yes', 'no'].includes(data.answers[i]) ? data.answers[i] : null);
    out.example = data.example === true;
    return out;
  }
  function evaluate(data) {
    const state = restore(data), answered = state.answers.filter(v => v !== null).length;
    const score = state.answers.slice(0, 5).filter(v => v === 'yes').length;
    const base = { answered, score, ready: answered === 6 && !!state.task.trim(), type: 'pending', reasons: [] };
    if (!state.task.trim()) return { ...base, title: 'Piense en una tarea concreta.', summary: 'Escríbala o elija un ejemplo. Después responda pensando en ese caso, no en la bibliometría en general.' };
    if (answered < 6) return { ...base, title: 'Faltan ' + (6 - answered) + ' respuesta(s).', summary: 'Conteste las seis preguntas para obtener una orientación. El requisito de uso y revisión se valora aparte.' };
    if (state.answers[5] === 'no') return { ...base, type: 'review', title: 'Primero, revise el uso y los datos.', summary: 'Aunque la tarea encaje con una skill, el requisito de uso autorizado y revisión crítica no está resuelto.', reasons: ['Adapte los materiales o utilice un entorno autorizado para ese uso.', 'Defina quién revisará el resultado y con qué criterio.', 'Si el encargo afecta a personas, no sustituya el juicio experto por un único indicador.'] };
    if (score <= 1) return { ...base, type: 'prompt', title: 'Un prompt puntual puede bastar.', summary: 'Hay pocos criterios que justifiquen guardar un procedimiento reutilizable para esta tarea.', reasons: ['Describa el encargo, aporte el material necesario e indique el resultado que espera.', 'Si empieza a repetir las mismas instrucciones, vuelva a valorar una skill.'] };
    const improvements = [
      'Identifique qué parte de la tarea se repetirá.',
      'Defina un formato o criterio de salida que quiera mantener.',
      'Escriba las acciones necesarias en un orden que otra persona pueda seguir.',
      'Decida cómo distinguir un buen resultado de un error.',
      'Acote las entradas: por ejemplo, una tabla, una ficha o un archivo de un tipo concreto.'
    ];
    if (score <= 3) return { ...base, type: 'narrow', title: 'Acote la tarea antes de crearla.', summary: 'Hay una base útil, pero conviene definir mejor qué parte se convertirá en un procedimiento.', reasons: improvements.filter((_, i) => state.answers[i] === 'no') };
    const strengths = [
      'La tarea se repite: puede ahorrar instrucciones en futuras ocasiones.',
      'Quiere mantener un criterio de salida reconocible.',
      'Puede escribir pasos que guíen la ejecución.',
      'Puede comprobar el resultado y detectar errores.',
      'Las entradas tienen una forma suficientemente previsible.'
    ];
    const reasons = strengths.filter((_, i) => state.answers[i] === 'yes').slice(0, 3);
    if (state.answers[0] === 'no') reasons.push('Si finalmente solo la hará una vez, un prompt puede seguir siendo suficiente. La skill cobra sentido al reutilizarla.');
    return { ...base, type: 'skill', title: 'Es una buena candidata a skill.', summary: 'Tiene suficientes elementos para convertirla en instrucciones reutilizables y comprobables.', reasons };
  }
  return { questions, examples, initial, restore, evaluate };
});
