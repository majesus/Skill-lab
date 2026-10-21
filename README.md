# Skill Lab

Editor local para convertir una tarea que se repite en una skill clara, comprobar su estructura y descargarla con el nombre de carpeta correcto. Está pensado para el taller de bibliometría y utiliza las seis partes de sus diapositivas.

> <sub>**Aviso de integridad académica.** Skill Lab y las skills que prepara asisten el trabajo del investigador; no sustituyen su criterio ni asumen autoría. Toda salida de un asistente que utilice estas skills requiere verificación humana contra las fuentes originales. El uso de IA generativa debe declararse según exijan la institución y la revista. Los análisis bibliométricos de los ejemplos son descriptivos o exploratorios, no confirmatorios; superar las comprobaciones del editor no valida científicamente una skill. Las exportaciones de bases de datos con licencia (Web of Science, Scopus) se rigen por sus términos. El [aviso completo](skills/INTEGRIDAD_ACADEMICA.md) tiene en cuenta el Reglamento (UE) 2024/1689 (Ley de IA), el RGPD y las orientaciones de la Comisión Europea sobre ética e integridad en la investigación, según su aplicación al uso concreto.</sub>

**No necesita instalar Python, GLiNER, Node ni ningún servicio de IA. No requiere claves de API.** Descargue el repositorio completo, extraiga el ZIP y abra `index.html`. Mantenga los archivos de la aplicación juntos.

## Empezar

1. [Descargue el ZIP](https://github.com/majesus/Skill-lab/archive/refs/heads/main.zip) y extráigalo en su equipo.
2. Abra **`index.html`** con un navegador actualizado.
3. Si aún no sabe si necesita una skill, complete el **test previo «¿Prompt puntual o skill?»**: escriba una tarea y responda a seis preguntas. Puede elegir un ejemplo y ver sus respuestas orientativas.
4. Empiece en blanco o pulse **Cargar ejemplo**. Hay un ejemplo guiado de lectura de indicadores y cuatro skills bibliométricas revisadas.
5. Recorra **Identificar → Escribir → Probar y llevar**.
6. Resuelva los pendientes y pulse **Descargar carpeta ZIP**. Dentro encontrará `nombre-de-la-skill/SKILL.md` y los recursos añadidos.
7. Instale o adjunte la skill siguiendo las instrucciones del asistente que vaya a utilizar. Pruebe su comportamiento con datos adecuados antes de usarla en un trabajo.

El editor prepara archivos: **no instala la skill, no la ejecuta ni llama a un modelo de IA**. Pegar las instrucciones en un chat sirve para probar su utilidad; para probar la selección automática hay que instalar la skill en un producto que la admita.

## Qué permite hacer

- Valorar si una tarea merece una skill, necesita acotarse o puede resolverse con un prompt puntual, con motivos y un requisito independiente de uso autorizado y revisión crítica.
- Editar **name** y **description** con ayudas, contadores y ajuste del nombre.
- Redactar **Tarea, Cuándo se usa, Qué necesita, Qué hace, Qué entrega y Qué no debe hacer**.
- Ver el Markdown y la estructura de carpetas mientras escribe.
- Importar un `SKILL.md`, una carpeta de skill o un proyecto guardado. El Markdown importado se abre en edición libre para conservar su contenido completo y los campos adicionales de su cabecera.
- Añadir documentos en `references/`, scripts en `scripts/` y plantillas u otros recursos en `assets/`. Los recursos importados se conservan como archivos: no se ejecutan.
- Registrar tres pruebas —caso normal, información incompleta y fuera de propósito— con comportamiento esperado, estado y observaciones. Si se rellenan, se incluyen en `references/pruebas-skill-lab.md`.
- Incluir en cada skill un aviso de integridad académica dentro de `SKILL.md` y un documento completo en `references/integridad-academica.md`, con responsabilidad humana, verificación, confidencialidad y marco de aplicación de la Ley de IA de la UE.
- Descargar un ZIP, descargar solo `SKILL.md`, copiar el texto o **Guardar proyecto** con todos sus recursos y pruebas para continuar después.

**Crear carpeta en mi equipo** está disponible cuando el navegador ofrece la API de acceso a carpetas, normalmente en Chrome o Edge y en un contexto seguro. El navegador pide elegir el destino; el editor crea una subcarpeta nueva y rechaza sobrescribir una existente. Si la opción está deshabilitada, descargue el ZIP y extráigalo: obtendrá la misma estructura. Esta alternativa también funciona abriendo el HTML como archivo local.

## Reglas y ayudas

El nombre utiliza de 1 a 64 caracteres: letras minúsculas de `a` a `z`, números y guiones, sin guiones iniciales, finales ni consecutivos. La carpeta coincide con `name`. Se evitan además nombres reservados en Windows para poder crear carpetas portables.

La descripción debe explicar qué hace la skill y cuándo usarla. El máximo técnico del formato es **1024 caracteres**; **unos 200 caracteres** es una pauta de concisión del taller. Las seis partes, los tres casos de prueba y la orientación de tres a siete pasos son decisiones docentes, no campos adicionales obligatorios de YAML. Menos de 500 líneas es una recomendación de concisión, no una certificación de calidad.

Solo `name` y `description` son obligatorios en la cabecera básica. El editor conserva otros campos al importar, avisa de posibles incompatibilidades y comprueba los enlaces locales del cuerpo para detectar recursos que falten. En la edición guiada pide completar las seis partes; la edición libre admite otras estructuras. Una comprobación estructural correcta **no demuestra que el asistente vaya a seleccionar la skill ni que sus resultados sean correctos**.

Los límites prácticos del editor son 100 recursos y 20 MB de recursos por proyecto. No son límites universales del formato. La carga de archivos adjuntos, scripts, herramientas y campos específicos depende del producto de destino.

El test previo adapta el ejercicio de las diapositivas: entre las primeras cinco preguntas, 4–5 respuestas afirmativas orientan hacia una skill; 2–3, a acotar la tarea; 0–1, a un prompt. La sexta pregunta es un requisito independiente sobre uso autorizado y revisión crítica. No se presenta un resultado hasta que constan una tarea y las seis respuestas. Estos umbrales son docentes, no una regla del formato ni una certificación. El test no bloquea el editor. Si recomienda una skill, permite copiar la tarea al borrador guiado cuando ese campo está vacío, conservando cualquier trabajo previo. Las respuestas se guardan con el borrador y con el proyecto JSON.

## Guardado y privacidad

La aplicación funciona sin conexión y no envía los textos a servicios externos. El parser YAML está incluido localmente; no utiliza CDN. Los enlaces a documentación y diapositivas solo se abren cuando la persona los elige.

El guardado automático conserva **texto y observaciones**, en el almacenamiento de este navegador y dirección. Los recursos deben volver a adjuntarse después de cerrar o recargar; el editor los señala como pendientes. Para conservarlo todo, use **Guardar proyecto** y guarde el JSON. En modo privado o con almacenamiento bloqueado, use también esta descarga. El editor avisa si el navegador no permite guardar.

Para borrar el borrador visible y guardado, pulse **Empezar en blanco**. Conserve primero su proyecto si quiere recuperarlo. Use ejemplos sin datos confidenciales y revise cualquier skill o script antes de instalarlo en un asistente.

## Skills revisadas incluidas

La carpeta `skills/` contiene únicamente las skills de redacción y revisión. Las de generación de análisis se conservan aparte, en `analysis-skills/`, como ejemplos docentes. Cada carpeta de skill puede utilizarse por separado:

| Carpeta | Para qué sirve |
| --- | --- |
| `skills/bibliometria-paper` | Redacción a partir de una entrega ya calculada de bibliolab, con cifras y pendientes trazables. |
| `skills/bibliometria-review` | Revisión de un borrador contra su evidencia, distinguiendo errores demostrados, riesgos y cuestiones abiertas. |
| `analysis-skills/bibliometric-analysis-basic` | Ejemplo separado: análisis modular de un corpus bibliográfico. |
| `analysis-skills/bibliometric-analysis-advanced` | Ejemplo separado: modelos multivariantes, mapas, sensibilidad y visualización. |

Las dos skills de análisis tienen nombres distintos y metadatos compatibles con el formato. Sus instrucciones ya no exigen una entrevista redundante si el encargo está definido, ni prometen equivalencia exacta entre R y Python o aceptación editorial. Distinguen citas ausentes de cero, normalización por cohorte de normalización por campo, ACP/AC/ACM y visualización 2D de agrupación. También distinguen HTML con CDN de una entrega que funciona sin conexión.

Redacción y revisión incluyen en su propia carpeta los recursos de integridad, evidencia y comprobación que necesitan. Los verificadores de Python distinguen revisión manual de recálculo, comprueban conteos exactos, conservan el formato CSV, rechazan números no finitos y no leen rutas fuera de la entrega. Necesitan **Python 3.9 o superior**; esto afecta a esos scripts opcionales, no al editor.

La revisión de las skills fue estructural, metodológica y de sus herramientas de comprobación. **No se ha ejecutado un estudio bibliométrico completo en R y Python ni se ha certificado su comportamiento en todas las plataformas.** Las pruebas de cada skill deben completarse con el modelo y el entorno de destino. Consulte `skills/USO.md` para el uso con bibliolab.

Todas las skills incluidas y las exportadas por el editor incorporan un aviso de integridad. El documento común distingue normas académicas de obligaciones legales: el artículo 4 contempla medidas de alfabetización según el contexto; el artículo 50.4 regula determinados textos publicados para informar al público sobre asuntos de interés público y contempla una excepción con revisión humana o control editorial y responsabilidad editorial. La revisión meramente ortográfica no basta. Una excepción legal al etiquetado no elimina una declaración de IA exigida por la institución o la revista. **Incluir un aviso no acredita ni certifica el cumplimiento de la Ley de IA.** Consulte las fuentes oficiales del documento antes de aplicar sus criterios al caso concreto.

## Archivos y mantenimiento

`index.html`, `skill-lab.css`, `skill-lab.js`, `skill-core.js`, `skill-fit.js`, `skill-integrity.js`, `skill-examples.js` y `vendor/` forman el editor. `SKILLS_bibliometria_v2.html` conserva las diapositivas de referencia del taller. `skills/` contiene solo redacción y revisión; `analysis-skills/` mantiene aparte los ejemplos de análisis. El ZIP generado para una skill incluye únicamente su archivo, recursos, aviso de integridad y pruebas; no incluye el editor ni las diapositivas.

Las pruebas de mantenimiento no necesitan instalar paquetes:

```sh
node --test tests/skill-core.test.cjs tests/skill-fit.test.cjs
python tests/test_evidence.py
```

Comprueban conservación de YAML y Markdown, nombres, rutas, recursos, archivos ZIP y casos de los verificadores con datos sintéticos. No ejecutan una IA ni transfieren un corpus.

## Fuentes y licencia

El recorrido docente procede de las diapositivas incluidas. Las reglas del formato se contrastaron con la [especificación Agent Skills](https://agentskills.io/specification), las [buenas prácticas de Claude](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) y la [documentación de skills de OpenAI](https://developers.openai.com/plugins/build/skills). Las correcciones metodológicas se apoyan, entre otras fuentes primarias, en la documentación de [TF-IDF de scikit-learn](https://scikit-learn.org/stable/modules/feature_extraction.html#tfidf-term-weighting), [KS de SciPy](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.kstest.html) y [agrupación con UMAP](https://umap-learn.readthedocs.io/en/latest/clustering.html). Revisión: 21 de octubre de 2026.

Se conserva la licencia MIT de bibliolab en `LICENSE.md`. El parser incluido es **js-yaml 4.1.1**, también MIT; su aviso está en `vendor/js-yaml.LICENSE`. Las instrucciones y los resultados requieren revisión humana y no garantizan cumplimiento editorial o aceptación de un manuscrito.
