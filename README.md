# EnglishLab AI 🇺🇸

Laboratorio de inglés conversacional con agente de IA. Practica conversaciones reales con un cliente simulado por Claude.

## Características
- 3 niveles: Easy, Intermediate, Advanced
- 5 escenarios: Hotel, Restaurant, Shopping, Job Interview, Customer Support
- Agente de IA que responde como un cliente real
- Panel con tips de vocabulario y frases útiles

## Setup local

1. Instala dependencias:
   ```bash
   npm install
   ```

2. Crea tu archivo de variables de entorno:
   ```bash
   cp .env.example .env.local
   ```

3. Edita `.env.local` y agrega tu API key de Anthropic:
   - Obtén tu key en: https://console.anthropic.com/settings/keys

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

5. Abre http://localhost:3000

## Deploy en Vercel

1. Sube el proyecto a GitHub (el `.env.local` NO se sube gracias al `.gitignore`)

2. Ve a [vercel.com](https://vercel.com) → New Project → importa tu repositorio

3. En **Environment Variables** agrega:
   - Key: `ANTHROPIC_API_KEY`
   - Value: tu API key de Anthropic

4. Click **Deploy** — en ~2 minutos tienes tu URL pública ✅

## Estructura del proyecto

```
english-lab/
├── pages/
│   ├── index.js        ← Frontend completo (React)
│   └── api/
│       └── chat.js     ← Backend proxy a Anthropic API
├── .env.example        ← Plantilla de variables de entorno
├── .env.local          ← Tu API key (NO subir a GitHub)
├── .gitignore
└── package.json
```
