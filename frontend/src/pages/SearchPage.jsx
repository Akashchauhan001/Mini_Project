import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Search, Loader2, FileText, Tag, Calendar,
  User, ChevronRight, AlertCircle, SlidersHorizontal
} from 'lucide-react'
import { semanticSearch } from '../services/api.js'

function ScoreBar({ score }) {
  const pct = Math.min(100, Math.round((score + 1) / 2 * 100))
  return (
    <div className="flex items-center gap-2">
      <div className="progress-bar flex-1 h-1">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-slate-500 font-mono w-8">{pct}%</span>
    </div>
  )
}

function ResultCard({ paper, rank }) {
  const authors = Array.isArray(paper.authors) ? paper.authors : []
  const concepts = Array.isArray(paper.concepts) ? paper.concepts : []

  return (
    <div className="card-hover animate-slide-up group">
      <div className="flex items-start gap-4">
        {/* Rank */}
        <div className="w-8 h-8 rounded-lg bg-arid-600/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-arid-400 font-mono">
          {rank}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-sm font-semibold text-white mb-1 leading-snug group-hover:text-arid-300 transition-colors">
            {paper.title || 'Untitled Paper'}
          </h3>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 mb-3">
            {authors.length > 0 && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {authors.slice(0,2).join(', ')}{authors.length > 2 ? ` +${authors.length-2}` : ''}
              </span>
            )}
            {paper.year && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {paper.year}
              </span>
            )}
            {paper.word_count > 0 && (
              <span>{paper.word_count?.toLocaleString()} words</span>
            )}
          </div>

          {/* Abstract */}
          {paper.abstract && (
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-3">
              {paper.abstract}
            </p>
          )}

          {/* Concepts */}
          {concepts.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {concepts.slice(0, 6).map(c => (
                <span key={c} className="badge-blue text-[10px]">{c}</span>
              ))}
            </div>
          )}

          {/* Similarity */}
          {paper.score !== undefined && (
            <div>
              <p className="text-[10px] text-slate-600 mb-1 uppercase tracking-widest">Similarity</p>
              <ScoreBar score={paper.score} />
            </div>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-arid-400 transition-colors flex-shrink-0 mt-1" />
      </div>
    </div>
  )
}

const SUGGESTIONS = [
  'deep learning', 'natural language processing', 'transformer architecture',
  'graph neural networks', 'reinforcement learning', 'computer vision',
  'knowledge graphs', 'quantum computing', 'federated learning', 'diffusion models',
]

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const inputRef = useRef(null)

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState(null)
  const [topK, setTopK] = useState(10)

  // Auto-search if query from URL
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) { setQuery(q); doSearch(q) }
    inputRef.current?.focus()
  }, [])

  const doSearch = async (q = query) => {
    if (!q.trim()) return
    setLoading(true)
    setError(null)
    setSearched(false)
    try {
      const res = await semanticSearch(q.trim(), topK)
      setResults(res.data.data?.results || [])
      setSearched(true)
    } catch (e) {
      setError(e.response?.data?.message || 'Search failed. Is the backend running?')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') doSearch()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Search bar */}
      <div className="card">
        <h2 className="section-title mb-1">Semantic Search</h2>
        <p className="section-subtitle mb-5">
          Type a research topic — ARID finds relevant papers using AI-powered vector similarity.
        </p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder="e.g. transformer attention mechanisms, graph neural networks…"
              className="input pl-10"
            />
          </div>
          <button onClick={() => doSearch()} disabled={!query.trim() || loading} className="btn-primary px-6">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>

        {/* Suggestions */}
        <div className="mt-4">
          <p className="text-xs text-slate-600 mb-2 uppercase tracking-widest">Try searching:</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => { setQuery(s); doSearch(s) }}
                className="badge-blue text-xs cursor-pointer hover:bg-arid-600/30 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-rose-600/10 border border-rose-600/30 text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {Array(3).fill(0).map((_,i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      )}

      {!loading && searched && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-400">
              {results.length > 0
                ? <><span className="font-medium text-white">{results.length}</span> results for "<span className="text-arid-300">{query}</span>"</>
                : 'No results found'
              }
            </p>
          </div>

          {results.length > 0
            ? (
              <div className="space-y-3">
                {results.map((r, i) => (
                  <ResultCard key={r.id || r.paper_id || i} paper={r} rank={i + 1} />
                ))}
              </div>
            )
            : (
              <div className="card text-center py-12">
                <Search className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-2">No papers match "<strong className="text-white">{query}</strong>"</p>
                <p className="text-slate-600 text-xs">Try uploading more papers or a different search term</p>
              </div>
            )
          }
        </div>
      )}

      {!loading && !searched && !error && (
        <div className="card text-center py-16">
          <Search className="w-12 h-12 text-slate-700 mx-auto mb-4 float" />
          <p className="text-slate-300 font-medium mb-2">Start with a research topic</p>
          <p className="text-slate-600 text-sm">ARID uses SentenceTransformers + FAISS to find semantically similar papers — not just keyword matching.</p>
        </div>
      )}
    </div>
  )
}
