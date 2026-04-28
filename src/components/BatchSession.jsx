import { useState, useCallback } from 'react';
import { Loader2, RefreshCw, Wand2, BookOpen } from 'lucide-react';
import ProblemCard from './ProblemCard';
import { generateBatch } from '../lib/aiService';
import { getStaticBatch } from '../lib/staticProblems';

const DIFFICULTIES = ['aleatorio', 'básico', 'intermedio', 'avanzado'];
const COUNTS = [3, 5, 8, 10];

export default function BatchSession({ topicKey, hasApiKey, onScore }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [difficulty, setDifficulty] = useState('aleatorio');
  const [count, setCount] = useState(5);
  const [answeredSet, setAnsweredSet] = useState(new Set());

  const loadProblems = useCallback(async () => {
    setLoading(true);
    setError('');
    setProblems([]);
    setAnsweredSet(new Set());

    try {
      let batch;
      if (hasApiKey) {
        batch = await generateBatch(topicKey, count, difficulty);
      } else {
        batch = getStaticBatch(topicKey, count);
      }
      setProblems(batch);
    } catch (err) {
      if (err.message === 'NO_API_KEY' || err.message?.includes('401')) {
        setError('API key inválida. Usando banco local de problemas.');
        setProblems(getStaticBatch(topicKey, count));
      } else {
        setError(`Error: ${err.message}. Cargando banco local...`);
        setProblems(getStaticBatch(topicKey, count));
      }
    } finally {
      setLoading(false);
    }
  }, [topicKey, hasApiKey, count, difficulty]);

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

        {/* Generate button */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={loadProblems}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : problems.length > 0 ? (
              <RefreshCw size={16} />
            ) : (
              hasApiKey ? <Wand2 size={16} /> : <BookOpen size={16} />
            )}
            {loading
              ? `Generando${hasApiKey ? ' con IA' : ''}...`
              : problems.length > 0
              ? 'Nuevos problemas'
              : hasApiKey ? 'Generar con IA' : 'Cargar ejercicios'}
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

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-5" />
              <div className="h-10 bg-gray-800 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Problems */}
      {!loading && problems.length > 0 && (
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
      {!loading && problems.length === 0 && !error && (
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
