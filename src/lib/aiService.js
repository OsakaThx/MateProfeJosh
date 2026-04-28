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

// Track recently generated problems to avoid duplicates (last 50)
const recentProblems = new Set();
const MAX_RECENT = 50;

function trackProblem(key) {
  recentProblems.add(key);
  if (recentProblems.size > MAX_RECENT) {
    const first = recentProblems.values().next().value;
    recentProblems.delete(first);
  }
}

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pickArr(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/**
 * Build problem deterministically per topic. AI is NEVER asked to compute answers.
 */
function buildProblem(topicKey, difficulty) {
  // Try up to 20 times to get a non-duplicate problem
  for (let tries = 0; tries < 20; tries++) {
    const built = buildSingleProblem(topicKey, difficulty);
    const key = `${topicKey}|${built.problem}`;
    if (!recentProblems.has(key)) {
      trackProblem(key);
      return built;
    }
  }
  // If all attempts collide, just return the latest
  return buildSingleProblem(topicKey, difficulty);
}

function buildSingleProblem(topicKey, difficulty) {
  const diff = difficulty === 'aleatorio' ? pickArr(['básico', 'intermedio', 'avanzado']) : difficulty;

  if (topicKey === 'funciones') {
    // f(x) = ax^2 + bx + c, evaluate at x=k
    const a = diff === 'básico' ? rand(1, 3) : rand(1, 6);
    const b = rand(-6, 6);
    const c = rand(-5, 8);
    const k = diff === 'básico' ? rand(2, 4) : rand(-3, 6);

    // Build problem string with proper signs
    const bStr = b >= 0 ? `+ ${b}x` : `- ${Math.abs(b)}x`;
    const cStr = c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
    const fxBody = `${a}x^2 ${bStr} ${cStr}`;
    const problem = `Calcula $f(${k})$ si $f(x) = ${fxBody}$`;

    // Compute answer
    const answer = a*k*k + b*k + c;
    const steps = [
      `Sustituir $x = ${k}$ en la función: $f(${k}) = ${a}(${k})^2 ${bStr.replace('x', '')} (${k}) ${cStr}$`,
      `Calcular potencia: $(${k})^2 = ${k*k}$`,
      `Multiplicar: $${a}(${k*k}) = ${a*k*k}$ y $${b}(${k}) = ${b*k}$`,
      `Sumar: $${a*k*k} ${b*k >= 0 ? '+' : ''} ${b*k} ${c >= 0 ? '+' : ''} ${c} = ${answer}$`,
    ];
    return { problem, answer: String(answer), answerLatex: String(answer), steps, difficulty: diff, type: 'open' };
  }

  if (topicKey === 'dominio_rango') {
    const subtype = pickArr(['rational', 'sqrt']);
    if (subtype === 'rational') {
      const k = rand(2, 9);
      const problem = `Hallar el dominio de $f(x) = \\dfrac{1}{x - ${k}}$`;
      const answer = `x ≠ ${k}`;
      const answerLatex = `(-\\infty, ${k}) \\cup (${k}, \\infty)`;
      const steps = [
        `El denominador no puede ser cero, así que $x - ${k} \\neq 0$`,
        `Resolver: $x \\neq ${k}$`,
        `Dominio: todos los reales excepto $${k}$, es decir $(-\\infty, ${k}) \\cup (${k}, \\infty)$`,
      ];
      return { problem, answer, answerLatex, steps, difficulty: diff, type: 'open' };
    } else {
      const k = rand(2, 9);
      const problem = `Hallar el dominio de $f(x) = \\sqrt{x - ${k}}$`;
      const answer = `x ≥ ${k}`;
      const answerLatex = `[${k}, \\infty)`;
      const steps = [
        `Lo que está dentro de la raíz cuadrada debe ser $\\geq 0$`,
        `Resolver: $x - ${k} \\geq 0 \\Rightarrow x \\geq ${k}$`,
        `Dominio: $[${k}, \\infty)$`,
      ];
      return { problem, answer, answerLatex, steps, difficulty: diff, type: 'open' };
    }
  }

  if (topicKey === 'formulas_notables') {
    const subtype = pickArr(['cuadrado_suma', 'cuadrado_resta', 'diferencia']);
    const a = rand(1, 5);
    const b = rand(2, 8);

    if (subtype === 'cuadrado_suma') {
      // (ax + b)^2 = a²x² + 2abx + b²
      const problem = `Expande $(${a}x + ${b})^2$`;
      const t1 = a*a, t2 = 2*a*b, t3 = b*b;
      const answer = `${t1}x^2 + ${t2}x + ${t3}`;
      const steps = [
        `Aplicar fórmula: $(p+q)^2 = p^2 + 2pq + q^2$`,
        `Identificar: $p = ${a}x$ y $q = ${b}$`,
        `Calcular cada término: $(${a}x)^2 = ${t1}x^2$, $\\;2(${a}x)(${b}) = ${t2}x$, $\\;${b}^2 = ${t3}$`,
        `Resultado: $${answer}$`,
      ];
      return { problem, answer, answerLatex: answer, steps, difficulty: diff, type: 'open' };
    }
    if (subtype === 'cuadrado_resta') {
      const problem = `Expande $(${a}x - ${b})^2$`;
      const t1 = a*a, t2 = 2*a*b, t3 = b*b;
      const answer = `${t1}x^2 - ${t2}x + ${t3}`;
      const steps = [
        `Aplicar fórmula: $(p-q)^2 = p^2 - 2pq + q^2$`,
        `Identificar: $p = ${a}x$ y $q = ${b}$`,
        `Calcular: $(${a}x)^2 = ${t1}x^2$, $\\;-2(${a}x)(${b}) = -${t2}x$, $\\;${b}^2 = ${t3}$`,
        `Resultado: $${answer}$`,
      ];
      return { problem, answer, answerLatex: answer, steps, difficulty: diff, type: 'open' };
    }
    // diferencia de cuadrados: (ax + b)(ax - b) = a²x² - b²
    const problem = `Expande $(${a}x + ${b})(${a}x - ${b})$`;
    const t1 = a*a, t2 = b*b;
    const answer = `${t1}x^2 - ${t2}`;
    const steps = [
      `Aplicar fórmula: $(p+q)(p-q) = p^2 - q^2$`,
      `Identificar: $p = ${a}x$, $q = ${b}$`,
      `Calcular: $(${a}x)^2 - ${b}^2 = ${t1}x^2 - ${t2}$`,
      `Resultado: $${answer}$`,
    ];
    return { problem, answer, answerLatex: answer, steps, difficulty: diff, type: 'open' };
  }

  if (topicKey === 'factorizacion') {
    // Build trinomial x^2 + (p+q)x + pq with integer roots
    const p = rand(2, 7);
    const q = rand(2, 7);
    const sumPos = pickArr([true, false]);
    const b = sumPos ? -(p + q) : (p + q); // x^2 - (p+q)x + pq has roots p, q
    const c = p * q; // both positive product
    const bStr = b >= 0 ? `+ ${b}x` : `- ${Math.abs(b)}x`;
    const problem = `Factoriza $x^2 ${bStr} + ${c}$`;
    // If sumPos true, both roots negative: (x-p)(x-q) when b is -(p+q)
    // Actually: x^2 - (p+q)x + pq = (x-p)(x-q)
    // x^2 + (p+q)x + pq = (x+p)(x+q)
    const answer = sumPos
      ? `(x - ${p})(x - ${q})`
      : `(x + ${p})(x + ${q})`;
    const steps = [
      `Buscar dos números que multiplicados den $${c}$ y sumados den $${b}$`,
      sumPos
        ? `Esos números son $-${p}$ y $-${q}$ (porque $-${p} \\cdot -${q} = ${c}$ y $-${p} + (-${q}) = ${b}$)`
        : `Esos números son $${p}$ y $${q}$ (porque $${p} \\cdot ${q} = ${c}$ y $${p} + ${q} = ${b}$)`,
      `Por tanto, la factorización es $${answer}$`,
    ];
    return { problem, answer, answerLatex: answer, steps, difficulty: diff, type: 'open' };
  }

  if (topicKey === 'formula_general') {
    // Build with integer roots r1, r2 → x^2 - (r1+r2)x + r1*r2 = 0
    const r1 = rand(1, 5);
    const r2 = rand(2, 7);
    const b = -(r1 + r2);
    const c = r1 * r2;
    const bStr = b >= 0 ? `+ ${b}x` : `- ${Math.abs(b)}x`;
    const cStr = c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
    const problem = `Resuelve usando la fórmula general: $x^2 ${bStr} ${cStr} = 0$`;
    const sm = Math.min(r1, r2);
    const lg = Math.max(r1, r2);
    const answer = sm === lg ? `x = ${sm}` : `x = ${sm} \\text{ ó } x = ${lg}`;
    const discriminant = b*b - 4*c;
    const steps = [
      `Identificar coeficientes: $a = 1$, $b = ${b}$, $c = ${c}$`,
      `Calcular discriminante: $\\Delta = b^2 - 4ac = ${b*b} - ${4*c} = ${discriminant}$`,
      `Aplicar fórmula: $x = \\dfrac{-b \\pm \\sqrt{\\Delta}}{2a} = \\dfrac{${-b} \\pm \\sqrt{${discriminant}}}{2}$`,
      `Calcular: $\\sqrt{${discriminant}} = ${Math.sqrt(discriminant)}$, las raíces son $x_1 = ${r1}$ y $x_2 = ${r2}$`,
      `Resultado: $${answer}$`,
    ];
    return { problem, answer: sm === lg ? `x=${sm}` : `x=${sm} o x=${lg}`, answerLatex: answer, steps, difficulty: diff, type: 'open' };
  }

  throw new Error(`Topic ${topicKey} not supported`);
}

export async function generateProblem(topicKey, difficulty = 'aleatorio') {
  const topic = TOPIC_PROMPTS[topicKey];
  if (!topic) throw new Error('Unknown topic');

  // Build problem deterministically (no AI involved in generation OR answer)
  const built = buildProblem(topicKey, difficulty);
  return {
    ...built,
    topic: topicKey,
    topicLabel: topic.label,
  };
}

// Old AI-based generation kept for reference but unused
async function _legacyGenerateProblem(topicKey, difficulty = 'aleatorio') {
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
  
  // CLEAN AI text but PRESERVE structure markers
  function cleanAiText(text) {
    if (!text) return '';
    
    // Remove control chars
    text = text.replace(/[\x00-\x08\x0b-\x0c\x0e-\x1f]/g, '');
    
    // Remove broken nulls and unicode artifacts
    text = text.replace(/\u200b/g, '');
    
    // Fix LaTeX with extra dollars: $$...$$ → $...$
    text = text.replace(/\$\$+/g, '$');
    
    // Fix broken LaTeX commands with spaces
    text = text.replace(/\\\s+([a-zA-Z])/g, '\\$1');
    
    return text.trim();
  }
  
  const cleanedRaw = cleanAiText(raw);
  
  // Parse: extract just the part after "PROBLEMA:" and before "TIPO:"
  // Be flexible: TIPO might be on same line or next line, with or without colon
  let problemText;
  const problemMatch = cleanedRaw.match(/PROBLEMA\s*:?\s*([\s\S]+?)(?=\s*TIPO\s*:|\s*DIFICULTAD\s*:|$)/i);
  if (problemMatch) {
    problemText = problemMatch[1].trim();
  } else {
    // Fallback: take first line that has math
    const lines = cleanedRaw.split(/\n/).filter(l => l.trim());
    problemText = lines.find(l => l.includes('$')) || lines[0] || cleanedRaw;
  }
  
  // Final cleanup of problem text
  problemText = problemText
    .replace(/\$\$/g, '$')           // double dollar to single
    .replace(/\s+/g, ' ')             // collapse whitespace
    .trim();
  
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
