/**
 * aiService.js
 * Usa la API de Groq (GRATIS) con el modelo llama-3.3-70b-versatile.
 * Obtén tu clave gratuita en: https://console.groq.com/keys
 * La clave se guarda SOLO en localStorage del navegador.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const DELAY_MS = 600; // ms entre peticiones para no exceder TPM

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const SYSTEM_BASE = `Eres MateProfe, tutor de pre-cálculo. Respondes SIEMPRE en español.
RESPONDE ÚNICAMENTE con un objeto JSON válido, sin texto antes ni después, sin markdown.
REGLA CRÍTICA DE LATEX: Toda expresión matemática DEBE ir entre signos de dólar.
CORRECTO: "Calcula $f(3)$ si $f(x) = 2x + 1$"
INCORRECTO: "Calcula f(3) si f(x) = 2x + 1"
CORRECTO en steps: "Sustituir $x = 3$: $f(3) = 2(3)+1 = 7$"
INCORRECTO en steps: "Sustituir x = 3: f(3) = 2(3)+1 = 7"
NUNCA uses \rac{} — SIEMPRE usa \frac{}{}
NUNCA uses \sqrt sin llaves — SIEMPRE usa \sqrt{}
NUNCA pongas LaTeX fuera de los signos $...$`;

const JSON_EXAMPLE = `{"problem":"Calcula $f(2)$ si $f(x) = 3x - 1$","answer":"5","answerLatex":"5","steps":["Sustituir $x = 2$: $f(2) = 3(2) - 1$","Calcular: $6 - 1 = 5$","Resultado: $f(2) = 5$"],"difficulty":"básico","type":"open"}`;

const FUNCIONES_SUBTOPICS = [
  'evaluación de f(x) con un número positivo',
  'evaluación de f(x) con un número negativo',
  'evaluación de f(x) con x=0',
  'composición f(g(x)) paso a paso',
  'función cuadrática evaluada en un punto',
  'función con fracción evaluada en un punto',
  'suma de dos evaluaciones f(a)+f(b)',
];
const DOMINIO_SUBTOPICS = [
  'función racional simple 1/(x-k)',
  'función con raíz cuadrada √(x+k)',
  'función racional con numerador constante',
  'función con raíz √(ax+b)',
  'función racional con denominador cuadrático',
  'polinomio (dominio todos los reales)',
  'función racional 1/(x²-k²)',
];
const NOTABLES_SUBTOPICS = [
  'expandir cuadrado de binomio (a+b)²',
  'expandir cuadrado de binomio (a-b)²',
  'factorizar diferencia de cuadrados a²-b²',
  'expandir producto (a+b)(a-b)',
  'expandir con coeficientes: (2x+k)²',
  'factorizar diferencia de cuadrados con coeficiente',
  'expandir cubo de binomio (a+b)³',
];
const FACTORIZACION_SUBTOPICS = [
  'factor común monomio',
  'trinomio x²+bx+c con raíces enteras positivas',
  'trinomio x²+bx+c con una raíz negativa',
  'factor común + diferencia de cuadrados',
  'trinomio cuadrado perfecto',
  'diferencia de cubos',
  'suma de cubos',
];
const FORMULA_SUBTOPICS = [
  'ecuación con dos raíces enteras distintas',
  'ecuación con raíz doble (discriminante=0)',
  'ecuación con raíces fraccionarias',
  'ecuación con coeficiente a=2',
  'ecuación con coeficiente a=3',
  'ecuación sin término lineal (b=0)',
  'ecuación sin discriminante negativo (sin solución real)',
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Sanitiza texto para corregir LaTeX mal formateado del modelo.
 * Envuelve expresiones matemáticas sueltas en $...$
 */
function sanitizeProblem(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const fix = (str) => {
    if (!str || typeof str !== 'string') return str;
    // Fix \frac sin $ → agregar $
    let s = str.replace(/(^|[^$])(\\frac\{[^}]+\}\{[^}]+\})/g, '$1$$$2$$');
    // Fix \sqrt sin $
    s = s.replace(/(^|[^$])(\\sqrt\{[^}]+\})/g, '$1$$$2$$');
    // Fix \rac → \frac
    s = s.replace(/\\rac\{/g, '\\frac{');
    // Fix LaTeX commands sueltos sin $ (ej: x^2, x_1)
    s = s.replace(/(^|[\s(])([a-zA-Z]\^\d)([\s),]|$)/g, '$1$$$2$$$3');
    // Doble $$ accidentales → $
    s = s.replace(/\$\$([^$]+)\$\$/g, '\$$1\$');
    return s;
  };
  return {
    ...obj,
    problem: fix(obj.problem),
    answer: obj.answer,
    answerLatex: obj.answerLatex,
    steps: Array.isArray(obj.steps) ? obj.steps.map(fix) : obj.steps,
  };
}

const TOPIC_PROMPTS = {
  funciones: {
    label: 'Funciones',
    userPrompt: (diff) => {
      const sub = pickRandom(FUNCIONES_SUBTOPICS);
      const n1 = Math.floor(Math.random()*8)+1;
      const n2 = Math.floor(Math.random()*8)+2;
      return `Genera UN problema ORIGINAL de funciones. Tipo específico: "${sub}". Nivel: ${diff}.
IMPORTANTE: Usa números distintos a ejemplos previos. Sugerencia de coeficientes: usa ${n1} y ${n2}.
El problema debe ser diferente a "f(x)=3x-1" y "f(x)=2x+3".
Devuelve EXACTAMENTE este JSON (reemplaza los valores, usa $ en LaTeX):
${JSON_EXAMPLE}`;
    },
  },
  dominio_rango: {
    label: 'Dominio y Rango',
    userPrompt: (diff) => {
      const sub = pickRandom(DOMINIO_SUBTOPICS);
      const k = Math.floor(Math.random()*9)+1;
      return `Genera UN problema ORIGINAL de dominio de funciones. Tipo: "${sub}". Nivel: ${diff}.
IMPORTANTE: Usa una constante diferente, sugiero k=${k}. El resultado debe ser un intervalo específico.
Devuelve EXACTAMENTE este JSON (reemplaza los valores, usa $ en LaTeX):
${JSON_EXAMPLE}`;
    },
  },
  formulas_notables: {
    label: 'Fórmulas Notables',
    userPrompt: (diff) => {
      const sub = pickRandom(NOTABLES_SUBTOPICS);
      const k = Math.floor(Math.random()*8)+2;
      return `Genera UN problema ORIGINAL de productos notables. Tipo: "${sub}". Nivel: ${diff}.
IMPORTANTE: Usa constante ${k}. NO generes "x²+7x+12" ni "(x+3)(x+4)" — busca valores distintos.
Usa solo la variable x y coeficientes simples.
Devuelve EXACTAMENTE este JSON (reemplaza los valores, usa $ en LaTeX):
${JSON_EXAMPLE}`;
    },
  },
  factorizacion: {
    label: 'Factorización',
    userPrompt: (diff) => {
      const sub = pickRandom(FACTORIZACION_SUBTOPICS);
      const r1 = Math.floor(Math.random()*6)+1;
      const r2 = Math.floor(Math.random()*6)+2;
      return `Genera UN problema ORIGINAL de factorización. Tipo: "${sub}". Nivel: ${diff}.
IMPORTANTE: Construye el trinomio con raíces ${r1} y ${r2} (o sus negativos según el tipo). NO repitas x²+7x+12.
Usa coeficientes enteros menores a 10.
Devuelve EXACTAMENTE este JSON (reemplaza los valores, usa $ en LaTeX):
${JSON_EXAMPLE}`;
    },
  },
  formula_general: {
    label: 'Fórmula General',
    userPrompt: (diff) => {
      const sub = pickRandom(FORMULA_SUBTOPICS);
      const a = pickRandom([1,1,1,2,3]);
      const r1 = Math.floor(Math.random()*6)-2;
      const r2 = Math.floor(Math.random()*6)+1;
      return `Genera UN problema ORIGINAL de ecuación cuadrática. Tipo: "${sub}". Nivel: ${diff}.
IMPORTANTE: Construye la ecuación con $a=${a}$ y raíces ${r1} y ${r2}. NO uses x²-5x+6=0.
El enunciado debe decir "Resuelve usando la fórmula general: ...".
Devuelve EXACTAMENTE este JSON (reemplaza los valores, usa $ en LaTeX):
${JSON_EXAMPLE}`;
    },
  },
};

function getApiKey() {
  return localStorage.getItem('groq_api_key') || '';
}

async function callGroq(messages, apiKey, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.9,
        max_tokens: 512,
        response_format: { type: 'json_object' },
      }),
    });

    if (response.status === 429) {
      // Rate limited — wait and retry
      const retryAfter = parseInt(response.headers.get('retry-after') || '2', 10);
      await sleep((retryAfter * 1000) + 500);
      continue;
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
  throw new Error('Rate limit: demasiadas peticiones. Intenta con menos problemas.');
}

/**
 * Generate a math problem for the given topic and difficulty.
 */
export async function generateProblem(topicKey, difficulty = 'aleatorio') {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('NO_API_KEY');

  const topic = TOPIC_PROMPTS[topicKey];
  if (!topic) throw new Error('Unknown topic');

  const diffText =
    difficulty === 'aleatorio'
      ? ['básico', 'intermedio', 'avanzado'][Math.floor(Math.random() * 3)]
      : difficulty;

  const messages = [
    { role: 'system', content: SYSTEM_BASE },
    { role: 'user', content: topic.userPrompt(diffText) },
  ];

  const raw = await callGroq(messages, apiKey);
  const parsed = JSON.parse(raw);
  return { ...sanitizeProblem(parsed), topic: topicKey, topicLabel: topic.label };
}

/**
 * Generate multiple problems at once (batch). Uses Promise.all for speed.
 */
export async function generateBatch(topicKey, count = 5, difficulty = 'aleatorio') {
  const results = [];
  for (let i = 0; i < count; i++) {
    const p = await generateProblem(topicKey, difficulty);
    results.push({ ...p, id: crypto.randomUUID() });
    if (i < count - 1) await sleep(DELAY_MS);
  }
  return results;
}

/**
 * Ask the AI to evaluate a user's free-text answer and provide feedback.
 */
export async function evaluateAnswer(problem, userAnswer) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('NO_API_KEY');

  const messages = [
    {
      role: 'system',
      content: `${SYSTEM_BASE}
Evalúa si la respuesta del estudiante es matemáticamente correcta.
Responde SOLO con JSON válido:
{"correct":true,"feedback":"explicación motivadora","hint":null}
o si está mal:
{"correct":false,"feedback":"qué falló brevemente","hint":"pista concreta para corregir"}`,
    },
    {
      role: 'user',
      content: `Problema: ${problem.problem}
Respuesta correcta: ${problem.answer}
Respuesta del estudiante: ${userAnswer}
¿Es correcta matemáticamente? Sé flexible con la forma de escribir (ej: (x+2)(x-2) es igual a (x-2)(x+2)).`,
    },
  ];

  const raw = await callGroq(messages, apiKey);
  return JSON.parse(raw);
}

/**
 * Get a detailed step-by-step explanation for a problem.
 */
export async function getExplanation(problem) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('NO_API_KEY');

  const messages = [
    {
      role: 'system',
      content: `${SYSTEM_BASE}
Explica la solución paso a paso de forma clara y didáctica.
Usa LaTeX entre $ ... $ para las expresiones matemáticas.
Responde SOLO con JSON: {"explanation":"texto con pasos numerados y LaTeX"}`,
    },
    {
      role: 'user',
      content: `Explica detalladamente cómo resolver:\n${problem.problem}\nRespuesta final: ${problem.answer}`,
    },
  ];

  const raw = await callGroq(messages, apiKey);
  const parsed = JSON.parse(raw);
  return parsed.explanation;
}

export { TOPIC_PROMPTS };
