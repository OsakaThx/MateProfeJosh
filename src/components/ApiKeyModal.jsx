import { useState } from 'react';
import { Key, Eye, EyeOff, X, ExternalLink } from 'lucide-react';

export default function ApiKeyModal({ onClose, onSave }) {
  const [key, setKey] = useState(localStorage.getItem('groq_api_key') || '');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  function handleSave() {
    const trimmed = key.trim();
    if (!trimmed.startsWith('gsk_')) {
      setError('La clave de Groq debe empezar con "gsk_"');
      return;
    }
    localStorage.setItem('groq_api_key', trimmed);
    onSave(trimmed);
    onClose();
  }

  function handleClear() {
    localStorage.removeItem('groq_api_key');
    setKey('');
    onSave('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl border border-purple-800/50 p-6 animate-fade-in"
        style={{ background: '#1a1a2e' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key size={20} className="text-purple-400" />
            <h2 className="text-lg font-bold text-white">Clave API de Groq (GRATIS)</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="rounded-xl border border-green-800/40 bg-green-900/15 px-4 py-3 mb-4">
          <p className="text-sm text-green-300 font-semibold mb-1">✅ 100% Gratis</p>
          <p className="text-xs text-gray-400">
            Groq ofrece acceso gratuito a <span className="text-white font-medium">llama-3.3-70b-versatile</span>,
            un modelo muy inteligente para matemáticas. Sin tarjeta de crédito requerida.
          </p>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Tu clave se guarda <span className="text-yellow-400 font-medium">solo en tu navegador</span> (localStorage).
          Nunca se envía a ningún servidor que no sea Groq.
        </p>

        <a
          href="https://console.groq.com/keys"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 mb-4 transition-colors"
        >
          <ExternalLink size={12} /> Obtener clave GRATIS en console.groq.com/keys
        </a>

        <div className="relative mb-3">
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={e => { setKey(e.target.value); setError(''); }}
            placeholder="gsk_..."
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 pr-12 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
          />
          <button
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
          >
            Guardar y activar IA
          </button>
          {localStorage.getItem('groq_api_key') && (
            <button
              onClick={handleClear}
              className="rounded-lg border border-red-800 px-4 py-2.5 text-xs text-red-400 hover:bg-red-900/20 transition-colors"
            >
              Borrar
            </button>
          )}
        </div>

        <p className="mt-4 text-xs text-gray-500 text-center">
          Sin API key: se usan los ejercicios del banco local incluido en la app.
        </p>
      </div>
    </div>
  );
}
