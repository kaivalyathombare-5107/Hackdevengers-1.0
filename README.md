<div align="center">

# ResumeForge

**Build a polished, ATS-friendly resume in minutes — with AI-powered feedback baked in.**

### [Live Demo](https://resumeforge-henna.vercel.app/) · [Report a Bug](https://github.com/kaivalyathombare-5107/Hackdevengers-1.0/issues/new) · [Request a Feature](https://github.com/kaivalyathombare-5107/Hackdevengers-1.0/pulls)

</div>

---

## Overview

ResumeForge is a step-by-step resume builder that lets you fill in your details, pick from multiple professional templates, and export a print-ready PDF — all with a live, real-time preview. Built-in AI review (powered by Groq/Llama with a Gemini fallback) scores your resume out of 10 and suggests concrete improvements, and you can rewrite individual bullet points into stronger, more impactful lines with a single click.

## Features

- **Step-by-step form flow** — Personal info, summary, experience, education, skills, and projects, guided by a progress indicator
- **Live preview** — See your resume render in real time as you type, formatted to A4
- **Multiple templates** — Switch between Modern, Classic, and Minimal layouts without losing your data
- **AI resume review** — Get a strict, honest score out of 10 with actionable feedback on what's missing or weak
- **AI bullet-point rewriting** — Turn a rough line into a polished, action-oriented bullet point instantly
- **One-click PDF export** — Download a pixel-accurate, print-ready PDF of your finished resume
- **Autosave** — Your progress is saved to local storage automatically, so a refresh never costs you your work

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, Framer Motion |
| PDF Export | react-to-print |
| Backend / API | Express (local dev), Vercel Serverless Functions (production) |
| AI Providers | Groq (Llama 3.3 70B) with Google Gemini 2.5 Flash fallback |
| Data Layer | Supabase |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Node.js 24.x
- An API key from [Groq](https://console.groq.com/) and/or [Google AI Studio](https://aistudio.google.com/) (Gemini) for AI-powered feedback

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/<your-username>/Hackdevengers-1.0.git
   cd Hackdevengers-1.0
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure environment variables — copy `.env` to `.env.local` and fill in your keys
   ```bash
   GEMINI_API_KEY=your_gemini_api_key
   GROQ_API_KEY=your_groq_api_key
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite development server |
| `npm run build` | Builds the app for production |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs ESLint across the project |
| `npm run typecheck` | Runs TypeScript in no-emit mode to check for type errors |

## Project Structure

```
├── api/                     # Vercel serverless functions (production AI endpoints)
│   ├── ai-feedback.ts       # Scores and reviews the full resume
│   └── improve-line.ts      # Rewrites a single bullet point
├── src/
│   ├── components/          # UI components (forms, editors, PDF export, AI feedback)
│   ├── resume/               # Resume templates (Modern, Classic, Minimal)
│   ├── hooks/                # Custom React hooks
│   ├── types.ts              # Shared TypeScript types
│   └── app.tsx                # Root application component
├── server.ts                 # Express server for local development (proxies AI calls)
└── vercel.json                # Vercel build & routing configuration
```

## Deployment

This project is configured for zero-config deployment on [Vercel](https://vercel.com):

- Static assets are built via `@vercel/static-build` from `package.json`
- API routes under `/api/**/*.ts` are deployed as individual serverless functions via `@vercel/node`

To deploy your own instance:

1. Push this repository to GitHub
2. Import it into Vercel
3. Add `GROQ_API_KEY` and `GEMINI_API_KEY` as environment variables in your Vercel project settings
4. Deploy — Vercel will handle the rest

## Roadmap

- [ ] Additional resume templates
- [ ] Export to DOCX
- [ ] Cover letter generator
- [ ] Multi-resume management (save multiple versions)

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change, then submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Acknowledgments

- [Groq](https://groq.com/) and [Google Gemini](https://ai.google.dev/) for AI inference
- [Lucide](https://lucide.dev/) for icons
- [Tailwind CSS](https://tailwindcss.com/) for styling
