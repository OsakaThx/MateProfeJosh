/**
 * aiService.js
 * Usa la API de Groq (GRATIS) con el modelo llama-3.3-70b-versatile.
 * Este modelo soporta JSON mode y es estable para matemáticas.
 * Obtén tu clave gratuita en: https://console.groq.com/keys
 * La clave se guarda SOLO en localStorage del navegador.
 */

import nerdamer from 'nerdamer';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Llama 3.3 70B - soporta JSON mode, bueno para matemáticas con temperatura baja
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const DELAY_MS = 600; // ms entre peticiones para no exceder TPM

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const SYSTEM_BASE = `Eres MateProfe, tutor de pre-cálculo. Respondes SIEMPRE en español.
Responde con texto claro siguiendo el formato solicitado. Usa LaTeX $...$ para todas las fórmulas matemáticas.

REGLA CRÍTICA - ORDEN DE OPERACIONES:
Primero potencias/exponentes, luego multiplicaciones/divisions, luego sumas/restas.
NO hagas $2(4)^2 = 8^2 = 64$. Lo correcto es: $2(4)^2 = 2(16) = 32$.

Ejemplo correcto: $f(x)=4x^2+8x-5$, calcular $f(8)$:
  Paso 1: Potencia primero → $8^2 = 64$
  Paso 2: Multiplicaciones → $4(64) = 256$, $8(8) = 64$
  Paso 3: Suma y resta → $256 + 64 - 5 = 315$

REGLAS DE LATEX:
- Toda expresión matemática entre $...$
- NUNCA \rac{} — SIEMPRE \frac{}{}
- NUNCA \sqrt sin llaves — SIEMPRE \sqrt{}
- NUNCA pongas LaTeX fuera de los signos $...$`;

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
      const a = Math.floor(Math.random()*5)+1; // 1-5
      const b = Math.floor(Math.random()*5)+1; // 1-5
      const c = Math.floor(Math.random()*5); // 0-4
      const x = Math.floor(Math.random()*5)+2; // 2-6
      return `Crea UN problema simple de evaluar funcion.

Reglas:
- Usa solo numeros pequenos: ${a}, ${b}, ${c}
- Evalua en x = ${x}
- Formato: "Calcula f(${x}) si f(x) = ${a}x^2 + ${b}x + ${c}"
- Responde EXACTAMENTE:

PROBLEMA: Calcula $f(${x})$ si $f(x) = ${a}x^2 + ${b}x + ${c}$
TIPO: funciones
DIFICULTAD: ${diff}`;
    },
  },
  dominio_rango: {
    label: 'Dominio y Rango',
    userPrompt: (diff) => {
      const k = Math.floor(Math.random()*8)+2; // 2-9
      return `Crea UN problema simple de hallar dominio.

Reglas:
- Usa numero simple: ${k}
- Formato: "Hallar el dominio de f(x) = 1/(x - ${k})"
- O usa raiz: "Hallar el dominio de f(x) = sqrt(x - ${k})"
- Responde EXACTAMENTE:

PROBLEMA: Hallar el dominio de $f(x) = \\frac{1}{x - ${k}}$
TIPO: dominio_rango
DIFICULTAD: ${diff}`;
    },
  },
  formulas_notables: {
    label: 'Fórmulas Notables',
    userPrompt: (diff) => {
      const a = Math.floor(Math.random()*3)+2; // 2-4
      const b = Math.floor(Math.random()*5)+2; // 2-6
      return `Crea UN problema simple de expandir binomio.

Reglas:
- Usa solo numeros pequenos
- Formato: "Expande (ax + b)^2" con a=${a}, b=${b}
- Ejemplo: "Expande (${a}x + ${b})^2"
- Responde EXACTAMENTE:

PROBLEMA: Expande $(${a}x + ${b})^2$
TIPO: formulas_notables
DIFICULTAD: ${diff}`;
    },
  },
  factorizacion: {
    label: 'Factorización',
    userPrompt: (diff) => {
      const p = Math.floor(Math.random()*4)+2; // 2-5
      const q = Math.floor(Math.random()*4)+3; // 3-6
      const sum = p + q;
      const prod = p * q;
      return `Crea UN problema simple de factorizar trinomio.

Reglas:
- Usa raices ${p} y ${q}
- Formato: "Factoriza x^2 - ${sum}x + ${prod}"
- Responde EXACTAMENTE:

PROBLEMA: Factoriza $x^2 - ${sum}x + ${prod}$
TIPO: factorizacion
DIFICULTAD: ${diff}`;
    },
  },
  formula_general: {
    label: 'Fórmula General',
    userPrompt: (diff) => {
      const a = 1;
      const r1 = Math.floor(Math.random()*4)+1; // 1-4
      const r2 = Math.floor(Math.random()*4)+5; // 5-8
      const sum = r1 + r2;
      const prod = r1 * r2;
      return `Crea UN problema simple de ecuacion cuadratica.

Reglas:
- Raices: ${r1} y ${r2}
- Ecuacion: x^2 - ${sum}x + ${prod} = 0
- Formato: "Resuelve x^2 - ${sum}x + ${prod} = 0"
- Responde EXACTAMENTE:

PROBLEMA: Resuelve $x^2 - ${sum}x + ${prod} = 0$
TIPO: formula_general
DIFICULTAD: ${diff}`;
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
        temperature: 0.3, // temperatura moderada para creatividad pero consistencia
        max_tokens: 512,
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
 * AI generates the problem statement, WE calculate the answer using Nerdamer for 100% accuracy.
 */

/**
 * Calculate correct answer and steps using Nerdamer for mathematical precision.
 * This ensures 100% accurate answers regardless of AI calculation errors.
 */
function calculatePrecalculusAnswer(problemText, topicKey) {
  try {
    // Clean the problem text first
    const clean = problemText.replace(/\$\$/g, '$').replace(/\s+/g, ' ').trim();
    
    // Extract function expression if present
    // Match patterns like: f(x) = 2x^2 + 3x - 1 OR f(x)=2x^2+3x-1
    const funcMatch = clean.match(/f\(x\)\s*=\s*([^.,;]+?)(?=\s*\)|\s*$|Evaluar|Calcular)/i);
    // Match evaluation point: f(3), f(4), etc
    const evalMatch = clean.match(/[fc]\(\s*(\d+)\s*\)/i);
    
    if (funcMatch && evalMatch && topicKey === 'funciones') {
      let expr = funcMatch[1].trim();
      const xVal = evalMatch[1];
      
      // Clean up the expression: remove LaTeX artifacts
      expr = expr.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');
      expr = expr.replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)');
      
      // Substitute x with value
      const substituted = expr.replace(/\bx\b/g, `(${xVal})`);
      
      try {
        const result = nerdamer(substituted).evaluate().text();
        // Format as nice number
        const numResult = parseFloat(result);
        if (!isNaN(numResult) && Number.isInteger(numResult)) {
          return { answer: String(numResult), answerLatex: String(numResult) };
        }
        return { answer: result, answerLatex: result };
      } catch {
        // Manual calculation fallback
        try {
          const val = eval(substituted.replace(/\^/g, '**'));
          if (Number.isFinite(val)) {
            return { answer: String(Math.round(val * 100) / 100), answerLatex: String(Math.round(val * 100) / 100) };
          }
        } catch {}
        return null;
      }
    }
    
    // For quadratic equations: x^2 - 7x + 12 = 0
    // Match various formats: x^2-7x+12, x^2 - 7x + 12, etc
    const quadMatch = clean.match(/(\d*)\s*[*]?x\^2\s*([+-])\s*(\d*)\s*[*]?x\s*([+-])\s*(\d+)/i);
    if (quadMatch && topicKey === 'formula_general') {
      let a = quadMatch[1] ? parseInt(quadMatch[1]) : 1;
      const bSign = quadMatch[2] === '-' ? -1 : 1;
      const b = (parseInt(quadMatch[3]) || 0) * bSign;
      const cSign = quadMatch[4] === '-' ? -1 : 1;
      const c = (parseInt(quadMatch[5]) || 0) * cSign;
      
      const discriminant = b*b - 4*a*c;
      if (discriminant < 0) return { answer: 'no tiene raices reales', answerLatex: '\\text{No tiene raíces reales}' };
      
      const sqrtD = Math.sqrt(discriminant);
      const x1 = (-b + sqrtD) / (2*a);
      const x2 = (-b - sqrtD) / (2*a);
      
      const fmt = (n) => {
        const rounded = Math.round(n * 100) / 100;
        return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2).replace(/\.?0+$/, '');
      };
      
      if (Math.abs(x1 - x2) < 0.0001) {
        return { answer: `x=${fmt(x1)}`, answerLatex: `x = ${fmt(x1)}` };
      }
      return { answer: `x=${fmt(x1)} o x=${fmt(x2)}`, answerLatex: `x = ${fmt(x1)} \\text{ ó } x = ${fmt(x2)}` };
    }
    
    // For binomial expansion: (ax + b)^2
    const binomMatch = clean.match(/\(\s*(\d*)\s*x\s*([+-])\s*(\d+)\s*\)\^2/);
    if (binomMatch && topicKey === 'formulas_notables') {
      const a = parseInt(binomMatch[1]) || 1;
      const bSign = binomMatch[2] === '-' ? -1 : 1;
      const b = parseInt(binomMatch[3]) * bSign;
      // (ax+b)^2 = a^2x^2 + 2abx + b^2
      const a2 = a*a;
      const ab2 = 2*a*b;
      const b2 = b*b;
      
      const terms = [];
      if (a2 !== 0) terms.push(`${a2}x^2`);
      if (ab2 > 0) terms.push(`+${ab2}x`);
      else if (ab2 < 0) terms.push(`${ab2}x`);
      if (b2 > 0) terms.push(`+${b2}`);
      else if (b2 < 0) terms.push(`${b2}`);
      
      const answer = terms.join('').replace(/^\+/, '');
      return { answer, answerLatex: answer };
    }
    
    // For factorization: x^2 - 7x + 12
    const factorMatch = clean.match(/x\^2\s*([+-])\s*(\d+)x\s*([+-])\s*(\d+)/i);
    if (factorMatch && topicKey === 'factorizacion') {
      const bSign = factorMatch[1] === '-' ? -1 : 1;
      const b = parseInt(factorMatch[2]) * bSign;
      const cSign = factorMatch[3] === '-' ? -1 : 1;
      const c = parseInt(factorMatch[4]) * cSign;
      
      // Find factors of c that add up to b
      for (let i = -Math.abs(c); i <= Math.abs(c); i++) {
        if (i === 0) continue;
        if (c % i === 0) {
          const j = c / i;
          if (i + j === b) {
            const sign1 = i < 0 ? '-' : '+';
            const sign2 = j < 0 ? '-' : '+';
            const ai = Math.abs(i);
            const aj = Math.abs(j);
            const answer = `(x${sign1}${ai})(x${sign2}${aj})`;
            return { answer, answerLatex: answer };
          }
        }
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

export async function generateProblem(topicKey, difficulty = 'aleatorio') {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('NO_API_KEY');

  const topic = TOPIC_PROMPTS[topicKey];
  if (!topic) throw new Error('Unknown topic');

  const diffText =
    difficulty === 'aleatorio'
      ? ['básico', 'intermedio', 'avanzado'][Math.floor(Math.random() * 3)]
      : difficulty;

  // Generate problem using AI - but AI only creates the statement, we calculate the answer
  const messages = [
    { 
      role: 'system', 
      content: `Eres un generador de problemas de pre-cálculo. Crea UN problema claro en español.
IMPORTANTE: Usa coeficientes pequeños (1-10) para que sea fácil calcular.
Responde EXACTAMENTE en este formato (sin JSON, texto plano):

PROBLEMA: [enunciado con LaTeX $...$]
TIPO: ${topicKey}
DIFICULTAD: ${diffText}

Ejemplo:
PROBLEMA: Calcula $f(4)$ si $f(x) = 2x^2 + 3x - 1$
TIPO: ${topicKey}
DIFICULTAD: básico` 
    },
    { role: 'user', content: topic.userPrompt(diffText) },
  ];

  const raw = await callGroq(messages, apiKey);
  
  // AGGRESSIVE CLEANING: Fix AI broken output with newlines between chars
  function cleanAiText(text) {
    if (!text) return '';
    
    // Remove nulls and control chars
    text = text.replace(/[\x00-\x08\x0b-\x0c\x0e-\x1f]/g, '');
    
    // Fix the most common AI bug: single chars on separate lines like "f\n(\n3\n)"
    // Join lines that are single non-space characters
    text = text.replace(/^(\S)\s*$/gm, '$1');
    text = text.replace(/(\S)\n+(?=\S)/g, '$1');
    
    // Remove all newlines within LaTeX expressions ($...$)
    text = text.replace(/\$([^$]*)\n+([^$]*)\$/g, '$$1$2$');
    
    // Collapse all whitespace to single spaces
    text = text.replace(/\s+/g, ' ');
    
    // Fix broken LaTeX commands
    text = text.replace(/\\\s+/g, '\\');
    
    // Remove garbage quotes and escapes
    text = text.replace(/\\{3,}/g, '');
    text = text.replace(/["]{2,}/g, '"');
    text = text.replace(/'\s*'/g, '');
    
    return text.trim();
  }
  
  const cleanedRaw = cleanAiText(raw);
  
  // Parse the text format - be very flexible
  const problemMatch = cleanedRaw.match(/PROBLEMA[:\s]+([\s\S]+?)(?:\nTIPO:|$)/i);
  const problemText = problemMatch ? problemMatch[1].trim() : cleanedRaw.trim();
  
  // Calculate correct answer using Nerdamer (not AI!)
  const calculated = calculatePrecalculusAnswer(problemText, topicKey);
  
  // If we can calculate it precisely, use that. Otherwise ask AI for steps only
  let answer, answerLatex, steps;
  
  if (calculated) {
    answer = calculated.answer;
    answerLatex = calculated.answerLatex;
    // Generate steps based on calculation
    steps = generateSteps(problemText, topicKey, answer);
  } else {
    // Fallback: ask AI for the answer (less reliable but necessary for some types)
    const verifyMessages = [
      {
        role: 'system',
        content: 'Resuelve este problema de pre-cálculo paso a paso. Responde en formato:\nRESPUESTA: [valor numérico]\nPASOS:\n1. [paso]\n2. [paso]\nUsa LaTeX $...$ para fórmulas.',
      },
      { role: 'user', content: problemText },
    ];
    const verifyRaw = await callGroq(verifyMessages, apiKey);
    const ansMatch = verifyRaw.match(/RESPUESTA:\s*([^\n]+)/i);
    answer = ansMatch ? ansMatch[1].trim() : '?';
    answerLatex = answer;
    steps = (verifyRaw.match(/PASOS:([\s\S]*)/i)?.[1] || verifyRaw)
      .split('\n')
      .filter(s => s.trim().match(/^\d+\./))
      .map(s => s.replace(/^\d+\.\s*/, '').trim())
      .slice(0, 4);
  }

  return {
    problem: sanitizeProblem({ problem: problemText }).problem,
    answer,
    answerLatex,
    steps: steps.length > 0 ? steps : ['Paso 1: Analizar el problema', 'Paso 2: Aplicar la fórmula correspondiente', 'Paso 3: Calcular el resultado'],
    difficulty: diffText,
    type: 'open',
    topic: topicKey,
    topicLabel: topic.label,
  };
}

function generateSteps(problemText, topicKey, answer) {
  // Generate appropriate steps based on problem type
  if (topicKey === 'funciones') {
    const evalMatch = problemText.match(/f\(\s*(\d+)\s*\)/);
    const funcMatch = problemText.match(/f\(x\)\s*=\s*([^.,;\n]+)/i);
    if (evalMatch && funcMatch) {
      const xVal = evalMatch[1];
      const expr = funcMatch[1].trim();
      return [
        `Identificar la función: $f(x) = ${expr}$`,
        `Sustituir $x = ${xVal}$ en la función`,
        `Calcular paso a paso reemplazando $x$ por ${xVal}`,
        `Resultado: $f(${xVal}) = ${answer}$`,
      ];
    }
  }
  if (topicKey === 'formula_general') {
    return [
      'Identificar coeficientes $a$, $b$, $c$ de la ecuación',
      'Calcular discriminante $\Delta = b^2 - 4ac$',
      'Aplicar fórmula: $x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$',
      `Resolver y obtener: ${answer}`,
    ];
  }
  return ['Paso 1: Leer cuidadosamente el problema', 'Paso 2: Identificar la fórmula a aplicar', 'Paso 3: Realizar los cálculos paso a paso'];
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

/**
 * Asks Groq to provide a verified, student-friendly explanation of
 * what the problem is asking and how to solve it, in plain Spanish.
 */
export async function getConceptExplanation(problem) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('NO_API_KEY');

  const messages = [
    {
      role: 'system',
      content: `Eres un tutor de pre-cálculo paciente y RIGUROSO. Respondes SIEMPRE en español.
REGLAS ABSOLUTAS:
1. Resuelve el problema TÚ MISMO desde cero, paso a paso, con cuidado.
2. NUNCA te contradigas. Si calculas algo, mantén ese resultado. No digas "no, espera, en realidad...".
3. Verifica tu cálculo final dos veces ANTES de escribirlo.
4. Usa LaTeX entre $ ... $ para todas las fórmulas y números.
5. Estructura tu respuesta EXACTAMENTE así:

**¿Qué te piden?**
[1-2 líneas explicando en palabras simples qué calcular]

**Concepto que aplica:**
[Nombre del concepto y por qué se llama así, 1-2 líneas]

**Resolución paso a paso:**
1. [paso 1 con cálculo]
2. [paso 2 con cálculo]
3. [paso 3 con cálculo]
...

**Resultado final:** $[respuesta]$

NO escribas más después del resultado. NO dudes. NO te corrijas a ti mismo.`,
    },
    {
      role: 'user',
      content: `Explica este problema y resuélvelo desde cero (no asumas ninguna respuesta dada):

${problem.problem}

Tema: ${problem.topicLabel}`,
    },
  ];

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.1, // temperatura muy baja para máxima consistencia matemática
      max_tokens: 600,
    }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

export { TOPIC_PROMPTS };
