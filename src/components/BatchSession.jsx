import { useState, useCallback } from 'react';
import { Loader2, RefreshCw, Wand2, BookOpen } from 'lucide-react';
import ProblemCard from './ProblemCard';
import { generateProblem } from '../lib/aiService';
import { getStaticBatch } from '../lib/staticProblems';

const DELAY_MS = 650;
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const DIFFICULTIES = ['aleatorio', 'básico', 'intermedio', 'avanzado'];
const COUNTS = [3, 5, 8, 10];

export default function BatchSession({ topicKey, hasApiKey, onScore }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState('');
  const [difficulty, setDifficulty] = useState('aleatorio');
  const [count, setCount] = useState(3);
  const [answeredSet, setAnsweredSet] = useState(new Set());

  const loadProblems = useCallback(async (useStatic = false) => {
    setLoading(true);
    setError('');
    setProblems([]);
    setAnsweredSet(new Set());
    setProgress({ current: 0, total: count });

    // Predefined examples mode → use hand-curated bank
    if (useStatic) {
      setProblems(getStaticBatch(topicKey, count));
      setLoading(false);
      return;
    }

    // Random generation: now deterministic in JS, no API key needed
    const generated = [];
    for (let i = 0; i < count; i++) {
      try {
        const p = await generateProblem(topicKey, difficulty);
        generated.push({ ...p, id: crypto.randomUUID() });
        setProgress({ current: i + 1, total: count });
      } catch (err) {
        setError(`Problema ${i + 1}: ${err.message}`);
      }
    }
    setProblems(generated);
    setLoading(false);
  }, [topicKey, count, difficulty]);

  function handleAnswer(problemId, correct) {
    if (answeredSet.has(problemId)) return;
    setAnsweredSet(prev => new Set([...prev, problemId]));
    onScore(correct);
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
        {/* Count selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Problemas:</span>
          <div className="flex gap-1">
            {COUNTS.map(c => (
              <button
                key={c}
                onClick={() => setCount(c)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  count === c
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Dificultad:</span>
          <div className="flex gap-1 flex-wrap">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition-all ${
                  difficulty === d
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Generate buttons */}
        <div className="flex gap-2 ml-auto flex-wrap">
          {/* Predefined examples button - hand-curated bank */}
          <button
            onClick={() => loadProblems(true)}
            disabled={loading}
            title="Banco curado de problemas predefinidos"
            className="flex items-center gap-2 rounded-xl border border-green-700/60 bg-green-900/20 px-4 py-2.5 text-sm font-semibold text-green-400 transition-all hover:bg-green-900/40 active:scale-95 disabled:opacity-50"
          >
            <BookOpen size={16} />
            Ejemplos predefinidos
          </button>

          {/* New random problems - generated with verified math */}
          <button
            onClick={() => loadProblems(false)}
            disabled={loading}
            title="Genera problemas aleatorios con respuestas verificadas matemáticamente"
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : problems.length > 0 ? (
              <RefreshCw size={16} />
            ) : (
              <Wand2 size={16} />
            )}
            {loading ? 'Generando...' : problems.length > 0 ? 'Nuevos problemas' : 'Generar problemas'}
          </button>
        </div>
      </div>

      {/* Mode indicator */}
      {!hasApiKey && problems.length === 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-yellow-800/40 bg-yellow-900/10 px-4 py-3 text-sm text-yellow-400">
          <span>⚠️</span>
          <span>Sin API key: se usan problemas del banco local. Agrega tu clave OpenAI para problemas generados por IA.</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-orange-800/40 bg-orange-900/10 px-4 py-3 text-sm text-orange-400">
          {error}
        </div>
      )}

      {/* Progress bar while loading with AI */}
      {loading && hasApiKey && (
        <div className="rounded-2xl border border-purple-800/30 bg-purple-900/10 p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-purple-300">
              <Loader2 size={14} className="animate-spin" />
              Generando problema {progress.current + 1} de {progress.total}...
            </span>
            <span className="text-gray-500 text-xs">{progress.current}/{progress.total}</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
              }}
            />
          </div>
        </div>
      )}

      {/* Problems — appear one by one as they arrive */}
      {problems.length > 0 && (
        <div className="space-y-4">
          {problems.map((problem, i) => (
            <ProblemCard
              key={problem.id}
              problem={problem}
              index={i}
              onAnswer={correct => handleAnswer(problem.id, correct)}
              hasApiKey={hasApiKey}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && problems.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-800 border-dashed py-16 text-center">
          <div className="text-5xl mb-4">🧮</div>
          <p className="text-gray-400 text-sm">
            Selecciona cantidad y dificultad, luego presiona{' '}
            <span className="text-purple-400 font-medium">
              {hasApiKey ? 'Generar con IA' : 'Cargar ejercicios'}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
