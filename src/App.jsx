import { useState, useCallback } from 'react';
import { Key, BookOpen, Sparkles, FlaskConical, Library } from 'lucide-react';
import TopicSelector from './components/TopicSelector';
import BatchSession from './components/BatchSession';
import ScoreBoard from './components/ScoreBoard';
import ApiKeyModal from './components/ApiKeyModal';
import DocsPage from './components/DocsPage';
import { MathText } from './components/MathRenderer';

const INITIAL_SCORE = { correct: 0, total: 0, streak: 0 };

const REFS = [
  {
    title: 'Productos Notables',
    color: 'text-purple-400',
    items: [
      '$(a+b)^2 = a^2 + 2ab + b^2$',
      '$(a-b)^2 = a^2 - 2ab + b^2$',
      '$(a+b)(a-b) = a^2 - b^2$',
    ],
  },
  {
    title: 'Cubos',
    color: 'text-blue-400',
    items: [
      '$a^3+b^3 = (a+b)(a^2-ab+b^2)$',
      '$a^3-b^3 = (a-b)(a^2+ab+b^2)$',
    ],
  },
  {
    title: 'Fórmula General',
    color: 'text-green-400',
    items: [
      '$x = \\dfrac{-b \\pm \\sqrt{b^2-4ac}}{2a}$',
      '$\\Delta = b^2 - 4ac$',
    ],
  },
  {
    title: 'Dominio — Reglas clave',
    color: 'text-yellow-400',
    items: [
      '$\\frac{1}{x}$ → excluir $x$ que hacen denom. $= 0$',
      '$\\sqrt{x}$ → interior $\\geq 0$',
    ],
  },
];

function ReferenceCard() {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/30 p-5">
      <h3 className="text-sm font-bold text-gray-300 mb-3">📚 Fórmulas de Referencia Rápida</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-400">
        {REFS.map(section => (
          <div key={section.title} className="space-y-1">
            <p className={`font-semibold ${section.color}`}>{section.title}</p>
            {section.items.map((item, i) => (
              <p key={i}><MathText text={item} /></p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('practice');
  const [selectedTopic, setSelectedTopic] = useState('funciones');
  const [apiKey, setApiKey] = useState(localStorage.getItem('groq_api_key') || '');
  const [showApiModal, setShowApiModal] = useState(false);
  const [score, setScore] = useState(INITIAL_SCORE);
  const [sessionKey, setSessionKey] = useState(0);

  const hasApiKey = Boolean(apiKey);

  const handleScore = useCallback((correct) => {
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
      streak: correct ? prev.streak + 1 : 0,
    }));
  }, []);

  function handleTopicChange(topic) {
    setSelectedTopic(topic);
    setSessionKey(k => k + 1);
  }

  function resetScore() {
    setScore(INITIAL_SCORE);
  }

  return (
    <div className="min-h-screen" style={{ background: '#0f0f1a' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-800/80"
        style={{ background: 'rgba(15,15,26,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
              ∑
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">MateProfeJosh</h1>
              <p className="text-xs text-gray-500 leading-none mt-0.5">Entrenador de Pre-Cálculo</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors rounded-lg border border-gray-700 px-3 py-1.5"
            >
              <BookOpen size={13} />
              Groq Gratis
            </a>
            <button
              onClick={() => setShowApiModal(true)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                hasApiKey
                  ? 'border-green-700 text-green-400 bg-green-900/20 hover:bg-green-900/30'
                  : 'border-purple-700 text-purple-400 bg-purple-900/20 hover:bg-purple-900/30'
              }`}
            >
              <Key size={13} />
              {hasApiKey ? 'IA Activa ✓' : 'Activar IA Gratis'}
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-4xl mx-auto px-4 flex gap-1 pb-0">
          <button
            onClick={() => setActiveTab('practice')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'practice'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <FlaskConical size={14} />
            Práctica
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'docs'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Library size={14} />
            Documentación
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-8">

        {activeTab === 'practice' && (
          <div className="space-y-6">
            {/* Hero */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-800/50 bg-purple-900/20 px-4 py-1.5 text-xs text-purple-300">
                <Sparkles size={12} />
                {hasApiKey
                  ? 'IA activa: llama-3.3-70b (Groq gratis)'
                  : 'Modo local: banco de ejercicios incluido — activa IA gratis arriba'}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                Practica Pre-Cálculo
              </h2>
              <p className="text-gray-400 text-sm max-w-xl mx-auto">
                Genera problemas automáticos, responde y recibe retroalimentación instantánea.
                Domina funciones, factorización, fórmulas notables y más.
              </p>
            </div>

            {/* Score */}
            <ScoreBoard score={score} onReset={resetScore} />

            {/* Topic selector */}
            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Selecciona un tema
              </h3>
              <TopicSelector selected={selectedTopic} onSelect={handleTopicChange} />
            </section>

            {/* Batch session */}
            <section key={sessionKey}>
              <BatchSession
                topicKey={selectedTopic}
                hasApiKey={hasApiKey}
                onScore={handleScore}
              />
            </section>

            <ReferenceCard />

            <footer className="text-center text-xs text-gray-600 pb-4">
              MateProfeJosh • Groq (llama-3.3-70b) • Corre 100% en local
            </footer>
          </div>
        )}

        {activeTab === 'docs' && <DocsPage />}

      </main>

      {/* API Key Modal */}
      {showApiModal && (
        <ApiKeyModal
          onClose={() => setShowApiModal(false)}
          onSave={setApiKey}
        />
      )}
    </div>
  );
}

export default App;
