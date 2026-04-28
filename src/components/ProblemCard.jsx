import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Lightbulb, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { MathText, MathDisplay } from './MathRenderer';
import { checkAnswer } from '../lib/mathChecker';
import { evaluateAnswer, getExplanation } from '../lib/aiService';

const DIFFICULTY_COLORS = {
  'básico': 'bg-green-900/40 text-green-400 border-green-800',
  'intermedio': 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
  'avanzado': 'bg-red-900/40 text-red-400 border-red-800',
};

export default function ProblemCard({ problem, index, onAnswer, hasApiKey }) {
  const [userAnswer, setUserAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [showSteps, setShowSteps] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingExplain, setLoadingExplain] = useState(false);

  useEffect(() => {
    setUserAnswer('');
    setSubmitted(false);
    setResult(null);
    setShowSteps(false);
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
        <span className={`text-xs font-semibold border rounded-full px-2 py-0.5 ${diffColor}`}>
          {problem.difficulty}
        </span>
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
    </div>
  );
}
