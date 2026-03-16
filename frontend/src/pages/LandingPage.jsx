import { useNavigate } from 'react-router-dom'
import {
  Cpu, Search, Network, Upload, MessageSquare,
  ArrowRight, BookOpen, Zap, Globe, Shield
} from 'lucide-react'

const features = [
  {
    icon: Upload,
    color: 'from-arid-500 to-arid-700',
    title: 'Smart Paper Upload',
    desc: 'Upload PDF research papers and automatically extract text, metadata, authors, and citations using advanced parsing.',
  },
  {
    icon: Zap,
    color: 'from-purple-500 to-purple-700',
    title: 'NLP Concept Extraction',
    desc: 'spaCy-powered pipeline extracts key concepts, research methods, findings, and named entities from every paper.',
  },
  {
    icon: Search,
    color: 'from-teal-500 to-teal-700',
    title: 'Semantic Search',
    desc: 'Find relevant papers using meaning-based similarity powered by SentenceTransformers and FAISS vector search.',
  },
  {
    icon: Network,
    color: 'from-amber-500 to-amber-700',
    title: 'Knowledge Graph',
    desc: 'Interactive D3.js visualization maps connections between papers, concepts, and authors in a dynamic network.',
  },
  {
    icon: MessageSquare,
    color: 'from-rose-500 to-rose-700',
    title: 'AI Research Assistant',
    desc: 'Ask natural language questions: summarize papers, identify key ideas, or find related research instantly.',
  },
  {
    icon: Globe,
    color: 'from-green-500 to-green-700',
    title: 'Neo4j Knowledge Store',
    desc: 'Graph-native storage with Neo4j captures complex research relationships that relational databases miss.',
  },
]

const stats = [
  { label: 'Papers Analyzed', value: '100+' },
  { label: 'Concepts Extracted', value: '5K+' },
  { label: 'Graph Relations', value: '20K+' },
  { label: 'Search Accuracy', value: '94%' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-surface-950 text-slate-100 overflow-x-hidden">
      {/* ── Nav ───────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-surface-800 bg-surface-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-arid-500 to-purple-600 rounded-lg flex items-center justify-center shadow-glow-sm">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight">
              <span className="gradient-text">ARID</span>
              <span className="text-slate-400 font-normal text-sm ml-2">Platform</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/app/dashboard')}
              className="btn-secondary text-xs px-4 py-2"
            >
              Documentation
            </button>
            <button
              onClick={() => navigate('/app/dashboard')}
              className="btn-primary text-xs px-5 py-2"
            >
              Launch App <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background blobs */}
        <div className="blob w-96 h-96 bg-arid-600 top-0 left-1/4" style={{filter:'blur(120px)',opacity:0.12}} />
        <div className="blob w-80 h-80 bg-purple-600 top-20 right-1/4" style={{filter:'blur(100px)',opacity:0.10}} />
        <div className="blob w-64 h-64 bg-teal-500 bottom-0 left-1/2" style={{filter:'blur(80px)',opacity:0.08}} />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-arid-600/30 bg-arid-600/10 text-arid-300 text-xs font-medium mb-8">
            <Shield className="w-3 h-3" />
            AI-Powered Research Intelligence Platform
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
            <span className="text-white">Autonomous Research</span>
            <br />
            <span className="gradient-text">Literature Intelligence</span>
            <br />
            <span className="text-white text-4xl md:text-5xl font-light font-serif">&amp; Discovery</span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Upload scientific papers, extract deep insights with NLP, navigate knowledge
            through an interactive graph, and ask AI anything about your research corpus.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/app/dashboard')}
              className="btn-primary px-8 py-3 text-base"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/app/upload')}
              className="btn-secondary px-8 py-3 text-base"
            >
              <Upload className="w-4 h-4" />
              Upload a Paper
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="max-w-3xl mx-auto mt-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-surface-800 rounded-xl overflow-hidden border border-surface-700/50">
            {stats.map((s) => (
              <div key={s.label} className="bg-surface-900 px-6 py-5 text-center">
                <p className="text-2xl font-bold gradient-text">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────── */}
      <section className="py-24 px-6 bg-surface-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Everything You Need for Research Intelligence
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              A complete pipeline from raw PDFs to structured knowledge — powered by state-of-the-art AI.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="card-hover group cursor-default"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-card group-hover:scale-110 transition-transform duration-200`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Architecture ──────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-slate-400">A 5-stage pipeline from PDF to insight</p>
          </div>
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-8 top-8 bottom-8 w-px bg-gradient-to-b from-arid-600 via-purple-600 to-transparent hidden md:block" />
            <div className="space-y-6">
              {[
                { n:'01', t:'Upload PDF',       d:'Drag-and-drop PDF → PyPDF2 extracts full text and metadata',          c:'text-arid-400' },
                { n:'02', t:'NLP Analysis',     d:'spaCy pipeline extracts concepts, entities, methods, and findings',    c:'text-purple-400' },
                { n:'03', t:'Semantic Indexing',d:'SentenceTransformers encode abstracts → FAISS vector index built',     c:'text-teal-400' },
                { n:'04', t:'Graph Building',   d:'Paper/Author/Concept nodes and edges stored in Neo4j',                 c:'text-amber-400' },
                { n:'05', t:'AI Insights',      d:'Ask questions in natural language → GPT or fallback generates answers', c:'text-rose-400' },
              ].map((step) => (
                <div key={step.n} className="card flex gap-5 items-start">
                  <div className={`text-2xl font-bold font-mono w-12 flex-shrink-0 ${step.c}`}>
                    {step.n}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white mb-1">{step.t}</h3>
                    <p className="text-sm text-slate-400">{step.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card border-arid-600/30 bg-gradient-to-br from-arid-600/10 to-purple-600/10">
            <BookOpen className="w-12 h-12 text-arid-400 mx-auto mb-5 float" />
            <h2 className="text-2xl font-bold text-white mb-3">Ready to Transform Your Research?</h2>
            <p className="text-slate-400 mb-8">
              Start by uploading your first paper and watch ARID automatically build your research intelligence graph.
            </p>
            <button
              onClick={() => navigate('/app/dashboard')}
              className="btn-primary px-10 py-3 text-base"
            >
              Open Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────── */}
      <footer className="border-t border-surface-800 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gradient-to-br from-arid-500 to-purple-600 rounded flex items-center justify-center">
              <Cpu className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm text-slate-400">ARID Platform — Autonomous Research Literature Intelligence &amp; Discovery</span>
          </div>
          <p className="text-xs text-slate-600">Built with Flask · React · spaCy · FAISS · Neo4j · D3.js</p>
        </div>
      </footer>
    </div>
  )
}
