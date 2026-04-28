import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, Lightbulb, ChevronDown, ChevronUp, ArrowRight, HelpCircle, X, BookOpen, Loader2 } from 'lucide-react';
import { MathText, MathDisplay } from './MathRenderer';
import { checkAnswer } from '../lib/mathChecker';
import { evaluateAnswer, getExplanation, getConceptExplanation } from '../lib/aiService';

const DIFFICULTY_COLORS = {
  'básico': 'bg-green-900/40 text-green-400 border-green-800',
  'intermedio': 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
  'avanzado': 'bg-red-900/40 text-red-400 border-red-800',
};

/* ── Concepto base para cada tema ── */
const CONCEPT_GUIDE = {
  funciones: {
    titulo: '¿Qué es una función y cómo se evalúa?',
    definicion: 'Una **función** es como una máquina: le metes un número $x$ y te devuelve exactamente un resultado $f(x)$. La notación $f(x)$ se lee "f de x".',
    regla: 'Para **evaluar** $f(x)$ en un punto, simplemente reemplaza la variable $x$ por el número que te dan y calcula.',
    ejemplo: 'Si $f(x) = 2x + 3$ y te piden $f(4)$: sustituye $x=4$ → $f(4) = 2(4)+3 = 8+3 = 11$',
    origen: 'El concepto de función viene de la idea de que cada entrada tiene exactamente UNA salida. Si un valor de $x$ diera dos resultados distintos, ya no sería función.',
  },
  dominio_rango: {
    titulo: '¿Qué es el dominio y cómo se encuentra?',
    definicion: 'El **dominio** es el conjunto de todos los valores de $x$ para los que la función tiene sentido (está definida). No todos los $x$ funcionan en todas las funciones.',
    regla: 'Hay 2 reglas principales:\n• **Regla 1:** No puedes dividir entre cero → el denominador ≠ 0\n• **Regla 2:** No puedes sacar raíz de número negativo → el interior ≥ 0',
    ejemplo: 'En $f(x) = \\frac{1}{x-3}$: el denominador sería 0 cuando $x=3$, así que ese valor se excluye. Dominio: $(-\\infty, 3)\\cup(3,+\\infty)$',
    origen: 'La restricción del dominio existe porque matemáticamente la división entre cero y la raíz de negativos no están definidas en los números reales.',
  },
  formulas_notables: {
    titulo: '¿Qué son las fórmulas notables y para qué sirven?',
    definicion: 'Las **fórmulas notables** (también llamadas productos notables) son multiplicaciones algebraicas que tienen un patrón fijo. Son atajos matemáticos que siempre funcionan.',
    regla: 'Las más importantes:\n• $(a+b)^2 = a^2 + 2ab + b^2$ (cuadrado de suma)\n• $(a-b)^2 = a^2 - 2ab + b^2$ (cuadrado de resta)\n• $(a+b)(a-b) = a^2 - b^2$ (diferencia de cuadrados)',
    ejemplo: 'En $(x+9)^2$: identifica $a=x$ y $b=9$. Aplica $(a+b)^2$: $x^2 + 2(x)(9) + 9^2 = x^2 + 18x + 81$',
    origen: 'Se llaman "notables" porque su resultado siempre sigue el mismo patrón sin importar los números. Son la base de la factorización y simplificación algebraica.',
  },
  factorizacion: {
    titulo: '¿Qué es factorizar y cómo se hace?',
    definicion: '**Factorizar** es el proceso inverso de expandir: en vez de multiplicar, descomponemos una expresión en sus factores (los números o expresiones que al multiplicarse dan el original).',
    regla: 'Pasos en orden:\n1. Busca **factor común** primero (siempre)\n2. Con 2 términos → busca diferencia de cuadrados\n3. Con 3 términos → busca dos números que sumen el coeficiente de $x$ y multipliquen el término independiente',
    ejemplo: 'Para $x^2 + 5x + 6$: busca dos números que sumen 5 y multipliquen 6 → son 2 y 3. Resultado: $(x+2)(x+3)$',
    origen: 'Factorizar es esencial para resolver ecuaciones, simplificar fracciones y encontrar raíces. Viene de la misma idea que factorizar números: $12 = 3 \\times 4$',
  },
  formula_general: {
    titulo: '¿Qué es la fórmula general y cuándo se usa?',
    definicion: 'La **fórmula general** (o cuadrática) resuelve cualquier ecuación de la forma $ax^2+bx+c=0$. Es la herramienta más poderosa para encontrar las raíces de una parábola.',
    regla: 'La fórmula es: $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$\nEl símbolo $\\pm$ significa que hay dos soluciones: una con $+$ y otra con $-$.\nEl **discriminante** $\\Delta = b^2-4ac$ te dice cuántas soluciones hay.',
    ejemplo: 'En $x^2-5x+6=0$: $a=1, b=-5, c=6$. Discriminante: $25-24=1$. Entonces $x = \\frac{5\\pm1}{2}$ → $x=3$ ó $x=2$',
    origen: 'Esta fórmula se deduce completando el cuadrado en la ecuación general. Fue conocida por matemáticos árabes en el siglo IX. El término "cuadrática" viene del latín "quadratus" (cuadrado).',
  },
};

function ConceptPanel({ problem, onClose, hasApiKey }) {
  const guide = CONCEPT_GUIDE[problem.topic] || null;
  const [aiVerified, setAiVerified] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (!hasApiKey) return;
    setLoadingAI(true);
    getConceptExplanation(problem)
      .then(text => setAiVerified(text))
      .catch(() => setAiVerified(''))
      .finally(() => setLoadingAI(false));
  }, [problem.id]);

  const panel = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-2xl border border-purple-700/60 flex flex-col animate-fade-in"
        style={{ background: '#0f0f1a', maxHeight: 'calc(100vh - 48px)', boxShadow: '0 0 40px rgba(124,58,237,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-purple-900/60 border border-purple-700 flex items-center justify-center">
              <BookOpen size={14} className="text-purple-400" />
            </div>
            <h3 className="text-sm font-bold text-white">
              {guide ? guide.titulo : '¿Qué me están pidiendo?'}
            </h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all">
            <X size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#4c4c6d #1e1e2e' }}>

          {/* Problem restatement */}
          <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">📋 El problema te pide:</p>
            <p className="text-white text-sm leading-relaxed">
              <MathText text={problem.problem} />
            </p>
          </div>

          {guide && (
            <>
              {/* Definition */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">📖 ¿Qué significa esto?</p>
                <p className="text-sm text-gray-200 leading-relaxed">
                  <MathText text={guide.definicion} />
                </p>
              </div>

              {/* Rule */}
              <div className="rounded-xl border border-blue-800/40 bg-blue-900/10 p-4 space-y-2">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">📐 La fórmula que necesitas</p>
                {guide.regla.split('\n').map((line, i) => (
                  <p key={i} className="text-sm text-gray-200 leading-relaxed">
                    <MathText text={line} />
                  </p>
                ))}
              </div>

              {/* Example */}
              <div className="rounded-xl border border-green-800/40 bg-green-900/10 p-4 space-y-2">
                <p className="text-xs font-bold text-green-400 uppercase tracking-wider">✏️ Ejemplo con números distintos</p>
                <p className="text-sm text-gray-200 leading-relaxed">
                  <MathText text={guide.ejemplo} />
                </p>
              </div>

              {/* Origin */}
              <div className="rounded-xl border border-yellow-800/30 bg-yellow-900/10 p-4 space-y-2">
                <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider">💡 ¿Por qué existe esta regla?</p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  <MathText text={guide.origen} />
                </p>
              </div>
            </>
          )}

          {/* AI verified explanation */}
          {hasApiKey && (
            <div className="rounded-xl border border-purple-800/40 bg-purple-900/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">🤖 Explicación verificada por IA (Groq)</p>
                {loadingAI && <Loader2 size={12} className="animate-spin text-purple-400" />}
              </div>
              {loadingAI ? (
                <p className="text-xs text-gray-500 animate-pulse">Consultando IA para verificar la explicación...</p>
              ) : aiVerified ? (
                <div className="space-y-2">
                  {aiVerified.split('\n\n').filter(p => p.trim()).map((paragraph, i) => (
                    <p key={i} className="text-sm text-gray-200 leading-relaxed">
                      <MathText text={paragraph.replace(/\n/g, ' ').trim()} />
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No se pudo cargar la verificación IA.</p>
              )}
            </div>
          )}

          {/* Steps for THIS problem */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">🔢 Cómo resolver ESTE problema paso a paso</p>
            <div className="space-y-2">
              {problem.steps?.map((step, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-gray-900/50 border border-gray-800 px-4 py-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-purple-800/70 text-purple-300 text-xs flex items-center justify-center font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-200 leading-relaxed">
                    <MathText text={step} />
                  </p>
                </div>
              ))}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-green-700/50 bg-green-900/15">
                <span className="text-green-400 font-bold text-sm shrink-0">✓ Respuesta:</span>
                <span className="text-white text-sm font-semibold">
                  <MathDisplay latex={problem.answerLatex} />
                </span>
              </div>
            </div>
          </div>

          {/* Close button at bottom */}
          <button
            onClick={onClose}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}
          >
            Entendido, voy a resolverlo
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}

export default function ProblemCard({ problem, index, onAnswer, hasApiKey }) {
  const [userAnswer, setUserAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [showSteps, setShowSteps] = useState(false);
  const [showConcept, setShowConcept] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingExplain, setLoadingExplain] = useState(false);

  useEffect(() => {
    setUserAnswer('');
    setSubmitted(false);
    setResult(null);
    setShowSteps(false);
    setShowConcept(false);
    setAiExplanation('');
  }, [problem.id]);

  async function handleSubmit() {
    if (!userAnswer.trim()) return;
    setSubmitted(true);

    let correct = false;
    let feedback = '';
    let hint = null;

    // Try symbolic/numeric check first
    const mathCheck = checkAnswer(userAnswer, problem.answer);
    correct = mathCheck.correct;

    if (hasApiKey) {
      // Also ask AI to evaluate
      setLoadingAI(true);
      try {
        const aiResult = await evaluateAnswer(problem, userAnswer);
        correct = aiResult.correct;
        feedback = aiResult.feedback;
        hint = aiResult.hint;
      } catch {
        feedback = correct
          ? '¡Correcto! Tu respuesta coincide matemáticamente.'
          : 'La respuesta no coincide. Revisa los pasos.';
      } finally {
        setLoadingAI(false);
      }
    } else {
      feedback = correct
        ? '¡Correcto! Tu respuesta coincide matemáticamente.'
        : `La respuesta correcta es: ${problem.answer}`;
    }

    setResult({ correct, feedback, hint });
    onAnswer(correct);
  }

  async function handleExplain() {
    if (aiExplanation) { setShowSteps(true); return; }
    if (!hasApiKey) { setShowSteps(true); return; }

    setLoadingExplain(true);
    try {
      const explanation = await getExplanation(problem);
      setAiExplanation(explanation);
    } catch {
      setAiExplanation(null);
    } finally {
      setLoadingExplain(false);
      setShowSteps(true);
    }
  }

  const diffColor = DIFFICULTY_COLORS[problem.difficulty] || 'bg-gray-800 text-gray-400 border-gray-700';

  return (
    <div className="rounded-2xl border border-gray-800 overflow-hidden animate-fade-in"
      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500">#{index + 1}</span>
          <span className="text-xs font-semibold text-purple-400 bg-purple-900/30 border border-purple-800/50 rounded-full px-2 py-0.5">
            {problem.topicLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold border rounded-full px-2 py-0.5 ${diffColor}`}>
            {problem.difficulty}
          </span>
          <button
            onClick={() => setShowConcept(true)}
            title="¿Qué me están pidiendo?"
            className="flex items-center gap-1 rounded-full border border-blue-700/60 bg-blue-900/20 px-2.5 py-1 text-xs text-blue-400 hover:bg-blue-800/30 hover:text-blue-300 transition-all"
          >
            <HelpCircle size={13} />
            <span className="hidden sm:inline font-medium">¿Cómo?</span>
          </button>
        </div>
      </div>

      {/* Problem statement */}
      <div className="px-5 py-5">
        <p className="text-white leading-relaxed text-base">
          <MathText text={problem.problem} />
        </p>
      </div>

      {/* Answer input */}
      {!submitted ? (
        <div className="px-5 pb-5 flex gap-2">
          <input
            type="text"
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Escribe tu respuesta..."
            className="flex-1 rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors"
          />
          <button
            onClick={handleSubmit}
            disabled={!userAnswer.trim()}
            className="flex items-center gap-1.5 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
          >
            <ArrowRight size={16} />
            Verificar
          </button>
        </div>
      ) : (
        <div className="px-5 pb-5 space-y-3">
          {/* Result banner */}
          {loadingAI ? (
            <div className="flex items-center gap-2 text-yellow-400 text-sm animate-pulse">
              <span className="text-lg">🤖</span> IA evaluando tu respuesta...
            </div>
          ) : result && (
            <div className={`flex items-start gap-3 rounded-xl p-4 border ${
              result.correct
                ? 'bg-green-900/30 border-green-700/50'
                : 'bg-red-900/30 border-red-700/50'
            }`}>
              {result.correct
                ? <CheckCircle2 size={20} className="text-green-400 mt-0.5 shrink-0" />
                : <XCircle size={20} className="text-red-400 mt-0.5 shrink-0" />
              }
              <div className="flex-1">
                <p className={`text-sm font-semibold ${result.correct ? 'text-green-300' : 'text-red-300'}`}>
                  {result.correct ? '¡Correcto! 🎉' : 'Incorrecto'}
                </p>
                <p className="text-sm text-gray-300 mt-1">
                  <MathText text={result.feedback} />
                </p>
                {result.hint && (
                  <p className="text-xs text-yellow-400 mt-1">
                    💡 <MathText text={result.hint} />
                  </p>
                )}
                {!result.correct && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-400">Respuesta correcta: </span>
                    <span className="text-sm text-white font-mono">
                      <MathDisplay latex={problem.answerLatex} />
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Show steps button */}
          <button
            onClick={handleExplain}
            disabled={loadingExplain}
            className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            <Lightbulb size={15} />
            {loadingExplain ? 'Cargando explicación...' : showSteps ? 'Ocultar pasos' : 'Ver solución paso a paso'}
            {!loadingExplain && (showSteps ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
          </button>

          {/* Steps panel */}
          {showSteps && (
            <div className="rounded-xl border border-purple-800/30 bg-purple-900/10 p-4 space-y-2 animate-fade-in">
              {aiExplanation ? (
                <p className="text-sm text-gray-200 leading-relaxed">
                  <MathText text={aiExplanation} />
                </p>
              ) : (
                problem.steps?.map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-purple-800/50 text-purple-300 text-xs flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-200">
                      <MathText text={step} />
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {showConcept && (
        <ConceptPanel problem={problem} onClose={() => setShowConcept(false)} hasApiKey={hasApiKey} />
      )}
    </div>
  );
}
