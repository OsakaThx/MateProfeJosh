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
RESPONDE ÚNICAMENTE con un objeto JSON válido, sin texto antes ni después, sin bloques de código markdown.
Usa LaTeX solo dentro de los valores del JSON, entre $ (inline).`;

const JSON_SHAPE = `{"problem":"enunciado en español","answer":"respuesta","answerLatex":"LaTeX","steps":["paso 1","paso 2","paso 3"],"difficulty":"básico","type":"open"}`;

const TOPIC_PROMPTS = {
  funciones: {
    label: 'Funciones',
    userPrompt: (diff) => `Genera UN problema de pre-cálculo sobre funciones (evaluación f(x), composición, o identificar función). Dificultad: ${diff}.
Devuelve ÚNICAMENTE este JSON (sin texto extra, sin markdown):
${JSON_SHAPE}`,
  },
  dominio_rango: {
    label: 'Dominio y Rango',
    userPrompt: (diff) => `Genera UN problema sobre dominio de una función (racional, con raíz o logarítmica). Dificultad: ${diff}.
Devuelve ÚNICAMENTE este JSON (sin texto extra, sin markdown):
${JSON_SHAPE}`,
  },
  formulas_notables: {
    label: 'Fórmulas Notables',
    userPrompt: (diff) => `Genera UN problema de productos notables (expandir o factorizar: cuadrado binomio, diferencia cuadrados, cubos). Dificultad: ${diff}.
Devuelve ÚNICAMENTE este JSON (sin texto extra, sin markdown):
${JSON_SHAPE}`,
  },
  factorizacion: {
    label: 'Factorización',
    userPrompt: (diff) => `Genera UN problema de factorización de polinomios (factor común, diferencia cuadrados, suma/diferencia cubos, o trinomio). Dificultad: ${diff}.
Devuelve ÚNICAMENTE este JSON (sin texto extra, sin markdown):
${JSON_SHAPE}`,
  },
  formula_general: {
    label: 'Fórmula General',
    userPrompt: (diff) => `Genera UN problema de ecuación cuadrática ax²+bx+c=0 para resolver con la fórmula general. Dificultad: ${diff}.
Devuelve ÚNICAMENTE este JSON (sin texto extra, sin markdown):
${JSON_SHAPE}`,
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
        temperature: 0.7,
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
  return { ...parsed, topic: topicKey, topicLabel: topic.label };
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
