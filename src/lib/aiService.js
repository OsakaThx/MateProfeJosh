/**
 * aiService.js
 * Usa la API de Groq (GRATIS) con el modelo llama-3.3-70b-versatile.
 * Obtén tu clave gratuita en: https://console.groq.com/keys
 * La clave se guarda SOLO en localStorage del navegador.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_BASE = `Eres MateProfe, un tutor experto en pre-cálculo. Respondes SIEMPRE en español.
Cuando uses expresiones matemáticas, escríbelas en LaTeX entre $ ... $ (inline) o $$ ... $$ (display).
Eres paciente, claro y motivador. Siempre verificas que los problemas sean matemáticamente correctos.`;

const TOPIC_PROMPTS = {
  funciones: {
    label: 'Funciones',
    systemPrompt: `${SYSTEM_BASE}
Genera problemas variados sobre funciones matemáticas: evaluación de f(x), composición, identificar funciones.
Responde SOLO con JSON válido, sin texto extra, con esta estructura EXACTA:
{"problem":"enunciado en español con LaTeX $...$","answer":"respuesta exacta","answerLatex":"respuesta en LaTeX","steps":["paso 1","paso 2","paso 3"],"difficulty":"básico","type":"open"}`,
  },
  dominio_rango: {
    label: 'Dominio y Rango',
    systemPrompt: `${SYSTEM_BASE}
Genera problemas sobre dominio y rango de funciones. Incluye funciones racionales, con raíces, logarítmicas.
Responde SOLO con JSON válido, sin texto extra, con esta estructura EXACTA:
{"problem":"enunciado en español con LaTeX $...$","answer":"respuesta en notación intervalo","answerLatex":"LaTeX del intervalo","steps":["paso 1","paso 2","paso 3"],"difficulty":"básico","type":"open"}`,
  },
  formulas_notables: {
    label: 'Fórmulas Notables',
    systemPrompt: `${SYSTEM_BASE}
Genera problemas de productos notables: cuadrado de binomio, diferencia de cuadrados, cubos.
Pide expandir O factorizar (varía entre problemas).
Responde SOLO con JSON válido, sin texto extra, con esta estructura EXACTA:
{"problem":"enunciado con LaTeX $...$","answer":"expresión matemática resultado","answerLatex":"LaTeX del resultado","steps":["paso 1","paso 2","paso 3"],"difficulty":"básico","type":"open"}`,
  },
  factorizacion: {
    label: 'Factorización',
    systemPrompt: `${SYSTEM_BASE}
Genera problemas de factorización de polinomios: factor común, diferencia cuadrados, suma/diferencia cubos, trinomios.
Responde SOLO con JSON válido, sin texto extra, con esta estructura EXACTA:
{"problem":"enunciado con LaTeX $...$","answer":"forma factorizada","answerLatex":"LaTeX factorizado","steps":["paso 1","paso 2","paso 3"],"difficulty":"básico","type":"open"}`,
  },
  formula_general: {
    label: 'Fórmula General',
    systemPrompt: `${SYSTEM_BASE}
Genera problemas de ecuaciones cuadráticas ax²+bx+c=0 para resolver con la fórmula general.
Responde SOLO con JSON válido, sin texto extra, con esta estructura EXACTA:
{"problem":"enunciado con LaTeX $...$","answer":"x = val1 o x = val2","answerLatex":"x = \\text{val1} \\text{ ó } x = \\text{val2}","steps":["paso 1","paso 2","paso 3","paso 4"],"difficulty":"básico","type":"open"}`,
  },
};

function getApiKey() {
  return localStorage.getItem('groq_api_key') || '';
}

async function callGroq(messages, apiKey) {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.8,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
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
      ? 'Elige aleatoriamente entre básico, intermedio o avanzado.'
      : `Dificultad: ${difficulty}.`;

  const messages = [
    { role: 'system', content: topic.systemPrompt },
    {
      role: 'user',
      content: `Genera UN problema nuevo y diferente de ${topic.label}. ${diffText} Devuelve SOLO el JSON, sin explicaciones adicionales.`,
    },
  ];

  const raw = await callGroq(messages, apiKey);
  const parsed = JSON.parse(raw);
  return { ...parsed, topic: topicKey, topicLabel: topic.label };
}

/**
 * Generate multiple problems at once (batch). Uses Promise.all for speed.
 */
export async function generateBatch(topicKey, count = 5, difficulty = 'aleatorio') {
  const tasks = Array.from({ length: count }, () =>
    generateProblem(topicKey, difficulty)
  );
  const results = await Promise.all(tasks);
  return results.map(p => ({ ...p, id: crypto.randomUUID() }));
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
