# MateProfeJosh — Entrenador de Pre-Cálculo con IA

Aplicación web que corre **100% en local** para practicar Pre-Cálculo con problemas generados por IA **gratuita**.

## 🚀 Instalar y correr

```bash
git clone https://github.com/OsakaThx/MateProfeJosh.git
cd MateProfeJosh
npm install
npm run dev
```

Abre **http://localhost:5173**

---

## 🤖 Activar IA (GRATIS, sin tarjeta)

1. Ve a **https://console.groq.com/keys** → crea cuenta gratis → genera una API key
2. En la app, clic en **"Activar IA Gratis"** (esquina superior derecha)
3. Pega tu clave (empieza con `gsk_`)
4. ¡Listo! La IA genera problemas infinitos y evalúa tus respuestas

> La clave se guarda **solo en tu navegador** (localStorage). Nunca sale de tu máquina.

**Modelo:** `llama-3.3-70b-versatile` de Groq — muy inteligente para matemáticas, respuesta ultra-rápida.

**Sin API key:** la app igual funciona con el banco de ejercicios local incluido.

---

## ✨ Características

- **5 temas** de Pre-Cálculo: Funciones, Dominio/Rango, Fórmulas Notables, Factorización, Fórmula General
- **Generación infinita** de problemas con IA (Groq, 100% gratis)
- **Banco local** de 25+ ejercicios — funciona offline
- **Verificación matemática** con Nerdamer (simbólica + numérica)
- **Evaluación inteligente** de respuestas con retroalimentación en español
- **Solución paso a paso** explicada por la IA
- **Marcador + racha** (streak) por sesión
- **Renderizado LaTeX** profesional con KaTeX
- **Documentación completa** con tablas de reglas y ejemplos fácil/medio/difícil
- **100% local** — sin backend, sin base de datos

---

## 📚 Sección Documentación

La pestaña **Documentación** incluye para cada tema:
- Explicación del concepto
- Tabla de reglas y fórmulas
- 3 ejemplos resueltos (fácil / medio / difícil) con pasos detallados

---

## 🛠 Stack técnico

| Librería | Uso |
|---|---|
| React + Vite | Framework web |
| TailwindCSS v4 | Estilos |
| KaTeX | Renderizado LaTeX |
| Nerdamer | Verificación simbólica/numérica |
| Groq API (llama-3.3-70b) | IA — **100% gratis** |
| Lucide React | Iconos |

---

## 📁 Estructura

```
src/
  App.jsx                    # Raíz con navegación por tabs
  components/
    MathRenderer.jsx         # KaTeX wrapper (MathText, MathDisplay)
    TopicSelector.jsx        # Selector de 5 temas
    BatchSession.jsx         # Sesión: genera y muestra problemas
    ProblemCard.jsx          # Tarjeta de problema individual
    ScoreBoard.jsx           # Marcador de sesión + racha
    ApiKeyModal.jsx          # Modal para ingresar clave Groq
    DocsPage.jsx             # Documentación con ejemplos
  lib/
    aiService.js             # Groq API (generación + evaluación)
    mathChecker.js           # Verificación con Nerdamer
    staticProblems.js        # Banco local de 25+ ejercicios
