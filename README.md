<div align="center">

<!-- Animated banner -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0ea5e9,50:6366f1,100:a855f7&height=200&section=header&text=ResumeForge&fontSize=60&fontColor=ffffff&fontAlignY=38&desc=Build%20a%20polished%2C%20ATS-friendly%20resume%20in%20minutes&descAlignY=58&descSize=16&animation=fadeIn" width="100%"/>

<br/>

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-resumeforge--henna.vercel.app-6366f1?style=for-the-badge&logoColor=white)](https://resumeforge-henna.vercel.app/)
[![Built with React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

<br/>

[![Report Bug](https://img.shields.io/badge/🐛_Report_a_Bug-ef4444?style=for-the-badge)](https://github.com/kaivalyathombare-5107/Hackdevengers-1.0/issues/new)
[![Request Feature](https://img.shields.io/badge/✨_Request_Feature-10b981?style=for-the-badge)](https://github.com/kaivalyathombare-5107/Hackdevengers-1.0/pulls)

</div>

<br/>

---

## ✦ What is ResumeForge?

ResumeForge is a **step-by-step, AI-powered resume builder** that takes you from blank page to a print-ready, ATS-friendly PDF in minutes. Fill in your details through a guided 6-step flow, watch your resume render live in real time, pick from four professional templates, and let built-in AI review your resume and tailor it to any job description — all in one place, no sign-up required.

---

## ✦ Features at a Glance

<br/>

<div align="center">

```
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║    📝  Guided 6-step form      🎨  4 pro templates                   ║
║    👁️  Live A4 preview         🤖  AI resume review                  ║
║    🎯  Tailor to job desc      ✍️  AI bullet rewriter                 ║
║    📄  One-click PDF export    📝  Export to DOCX                    ║
║    🔗  Shareable resume link   💾  Autosave to localStorage           ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

</div>

<br/>

### 📝 Guided 6-Step Form Flow
A clean, progress-tracked wizard walks you through every section — Personal Info, Education, Experience, Skills, Projects, and Template selection. Each step resets independently so you never lose work in other sections.

### 👁️ Live A4 Preview
Your resume renders in real time as you type, pixel-accurate to A4 paper dimensions. No surprises when you export.

### 🎨 Four Professional Templates

| Template | Style |
|---|---|
| **Modern** | Dark sidebar with cyan accent colors — great for tech roles |
| **Classic** | Traditional serif layout — timeless and recruiter-trusted |
| **Minimal** | Clean, spacious, white — lets your content breathe |
| **Creative** | Bold violet gradient header — stands out in creative fields |

Switch between templates anytime without losing a single character of your data.

### 🤖 AI Resume Review
Get a strict, honest **score out of 10** with 3–5 concise bullet points covering strengths, weaknesses, and actionable improvements. Powered by **Groq (Llama 3.3 70B)** with **Google Gemini 2.5 Flash** as fallback — fast and reliable.

### 🎯 Tailor to Job Description
Paste any job description and the AI will:
- Give you a **resume-to-job match score**
- Generate a **tailored summary** you can apply in one click
- Suggest **missing skills** to add directly to your resume
- Surface **missing keywords** to weave into your bullets
- List **quick wins** to boost your match score fast

### ✍️ AI Bullet-Point Rewriter
Turn weak, vague bullet points into polished, action-verb-led lines with a single click — without touching the rest of your resume.

### 📄 One-Click PDF Export
Downloads a pixel-accurate, print-ready PDF of your resume exactly as it appears in the live preview.

### 📝 Export to DOCX
Export your resume as an editable Word document for cases where recruiters ask for `.docx`.

### 🔗 Shareable Resume Link
Generate a unique share link and send your resume directly to recruiters. Anyone with the link can view it — no account needed on either end.

### 💾 Autosave
Your progress is saved to local storage automatically. Refreshing the page never costs you your work.

---

## ✦ Tech Stack

<div align="center">

| Layer | Technology |
|:---:|:---|
| 🖼️ **Frontend** | React 18, TypeScript, Vite |
| 🎨 **Styling & Animation** | Tailwind CSS, Framer Motion |
| 📄 **PDF Export** | react-to-print |
| 📝 **DOCX Export** | docx.js |
| ⚡ **Backend** | Vercel Serverless Functions |
| 🤖 **AI (Primary)** | Groq — Llama 3.3 70B |
| 🤖 **AI (Fallback)** | Google Gemini 2.5 Flash |
| 🗄️ **Data Layer** | Supabase |
| 🔣 **Icons** | Lucide React |

</div>

---

## ✦ Project Structure

```
ResumeForge/
│
├── 📁 api/                        # Vercel serverless functions
│   ├── ai-feedback.ts             # Scores & reviews the full resume
│   ├── improve-line.ts            # Rewrites a single bullet point
│   ├── tailor-resume.ts           # Matches resume to a job description
│   ├── share-resume.ts            # Saves a resume and returns a share ID
│   └── load-resume.ts             # Loads a resume from a share ID
│
├── 📁 src/
│   ├── 📁 components/
│   │   ├── AiFeedback.tsx         # AI review panel (score + bullet feedback)
│   │   ├── BulletEditor.tsx       # Per-bullet AI rewrite button
│   │   ├── TailorModal.tsx        # Tailor-to-JD modal
│   │   ├── ShareButton.tsx        # Share link generator
│   │   ├── DownloadPdf.tsx        # PDF export button
│   │   ├── ExportDocx.tsx         # DOCX export button
│   │   ├── FormSteps.tsx          # All 6 form steps
│   │   ├── ResumePreview.tsx      # Live preview router
│   │   └── StepIndicator.tsx      # Progress bar + step icons
│   │
│   ├── 📁 resume/                 # Resume templates
│   │   ├── ModernTemplate.tsx
│   │   ├── ClassicTemplate.tsx
│   │   ├── MinimalTemplate.tsx
│   │   └── CreativeTemplate.tsx
│   │
│   ├── 📁 hooks/
│   │   └── useCompletion.ts       # Resume completion % calculator
│   │
│   ├── TemplatePicker.tsx         # Template switcher UI
│   ├── types.ts                   # Shared TypeScript types & defaults
│   ├── app.tsx                    # Root app component
│   └── main.tsx                   # Entry point
│
├── vercel.json                    # Vercel routing config
└── vite.config.ts                 # Vite + path alias config
```

---

## ✦ Deployment

This project is configured for **zero-config deployment on [Vercel](https://vercel.com)**:

- Static frontend is built via `@vercel/static-build`
- All `/api/**/*.ts` routes are deployed as individual serverless functions via `@vercel/node`

**To deploy your own instance:**

```
1. Push this repo to GitHub
2. Import it into Vercel at vercel.com/new
3. Add your environment variables in Vercel → Project Settings → Environment Variables:
      GROQ_API_KEY      →  from console.groq.com
      GEMINI_API_KEY    →  from aistudio.google.com
4. Deploy — Vercel handles the rest ✓
```

---

## ✦ Environment Variables

| Variable | Where to get it | Required |
|---|---|:---:|
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com/) | ✅ |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com/) | Fallback |

> If only one key is provided, ResumeForge will use whichever is available. Both are recommended for maximum reliability.

---

## ✦ Roadmap

- [x] Modern, Classic, Minimal templates
- [x] AI resume review (score + feedback)
- [x] AI bullet-point rewriter
- [x] Tailor to job description
- [x] PDF export
- [x] DOCX export
- [x] Shareable resume links
- [x] Creative template
- [ ] Cover letter generator
- [ ] Multi-resume management (save multiple versions)
- [ ] LinkedIn profile import

---

## ✦ Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change, then submit a pull request.

```bash
# 1. Fork the repo and clone it
git clone https://github.com/<your-username>/Hackdevengers-1.0.git

# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Make your changes and commit
git commit -m "feat: describe your change"

# 4. Push and open a Pull Request
git push origin feature/your-feature-name
```

---

## ✦ Acknowledgments

- [Groq](https://groq.com/) — blazing-fast LLM inference
- [Google Gemini](https://ai.google.dev/) — reliable AI fallback
- [Lucide](https://lucide.dev/) — clean, consistent icons
- [Tailwind CSS](https://tailwindcss.com/) — utility-first styling
- [Framer Motion](https://www.framer.com/motion/) — smooth animations
- [Supabase](https://supabase.com/) — resume sharing backend

---

## ✦ License

Distributed under the **MIT License**. See `LICENSE` for more information.

<br/>

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:a855f7,50:6366f1,100:0ea5e9&height=100&section=footer&animation=fadeIn" width="100%"/>

*Built with ❤️ for HackDevengers 1.0*

</div>
