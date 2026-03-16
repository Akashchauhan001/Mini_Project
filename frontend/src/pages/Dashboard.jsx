import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Network, Search, MessageSquare, Upload,
  TrendingUp, Clock, ChevronRight, AlertCircle
} from 'lucide-react'
import { getStats } from '../services/api.js'

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card-hover">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <TrendingUp className="w-4 h-4 text-green-400 opacity-60" />
      </div>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      <p className="text-sm text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
    </div>
  )
}

function RecentPaperRow({ paper, onClick }) {
  const authors = Array.isArray(paper.authors) ? paper.authors : []
  const date = paper.created_at
    ? new Date(paper.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-surface-800 cursor-pointer transition-colors group"
    >
      <div className="w-8 h-8 rounded-lg bg-arid-600/20 flex items-center justify-center flex-shrink-0">
        <FileText className="w-4 h-4 text-arid-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
          {paper.title}
        </p>
        <p className="text-xs text-slate-500 truncate">
          {authors.slice(0,2).join(', ')}{authors.length > 2 ? ` +${authors.length-2}` : ''}
          {paper.year ? ` · ${paper.year}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-slate-600 hidden sm:block">{date}</span>
        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
      </div>
    </div>
  )
}

const quickActions = [
  { icon: Upload,       label: 'Upload Paper',    path: '/app/upload',    color: 'bg-arid-600/20 text-arid-400 hover:bg-arid-600/30' },
  { icon: Search,       label: 'Search Papers',   path: '/app/search',    color: 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30' },
  { icon: Network,      label: 'View Graph',      path: '/app/graph',     color: 'bg-teal-600/20 text-teal-400 hover:bg-teal-600/30' },
  { icon: MessageSquare,label: 'AI Assistant',    path: '/app/assistant', color: 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getStats()
      .then(r => { setStats(r.data.data); setLoading(false) })
      .catch(e => { setError('Backend not reachable'); setLoading(false) })
  }, [])

  const s = stats || {}

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-600/10 border border-amber-600/30 text-amber-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error} — showing demo data. Start the Flask backend on port 5000.</span>
        </div>
      )}

      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Research Overview</h2>
          <p className="text-sm text-slate-500 mt-0.5">Your knowledge base at a glance</p>
        </div>
        <button onClick={() => navigate('/app/upload')} className="btn-primary text-xs">
          <Upload className="w-3.5 h-3.5" /> Upload Paper
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array(4).fill(0).map((_,i) => <div key={i} className="skeleton h-32 rounded-xl" />)
          : <>
              <StatCard icon={FileText}       label="Total Papers"    value={s.total_papers ?? 0}   color="bg-arid-600/30"   sub="in your library" />
              <StatCard icon={Network}        label="Graph Nodes"     value={s.total_nodes ?? 0}    color="bg-purple-600/30" sub="papers + concepts + authors" />
              <StatCard icon={Search}         label="Relationships"   value={s.total_edges ?? 0}    color="bg-teal-600/30"   sub="knowledge connections" />
              <StatCard icon={MessageSquare}  label="Concepts Found"  value={s.concept_nodes ?? 0}  color="bg-amber-600/30"  sub="unique concepts indexed" />
            </>
        }
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent papers */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-title">Recent Papers</h3>
              <p className="section-subtitle">Latest uploads to your library</p>
            </div>
            <button onClick={() => navigate('/app/search')} className="btn-ghost text-xs">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divider" />
          {loading
            ? Array(4).fill(0).map((_,i) => <div key={i} className="skeleton h-12 rounded-lg mb-2" />)
            : (s.recent_papers?.length > 0)
              ? s.recent_papers.map(p => (
                  <RecentPaperRow key={p.id} paper={p} onClick={() => navigate('/app/search')} />
                ))
              : (
                <div className="py-12 text-center">
                  <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No papers yet</p>
                  <button onClick={() => navigate('/app/upload')} className="btn-primary text-xs mt-4">
                    Upload your first paper
                  </button>
                </div>
              )
          }
        </div>

        {/* Quick actions */}
        <div className="card">
          <h3 className="section-title mb-1">Quick Actions</h3>
          <p className="section-subtitle mb-4">Jump to any feature</p>
          <div className="divider" />
          <div className="space-y-2 mt-2">
            {quickActions.map(a => (
              <button
                key={a.path}
                onClick={() => navigate(a.path)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${a.color}`}
              >
                <a.icon className="w-4 h-4" />
                {a.label}
                <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
              </button>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-6 p-3 rounded-lg bg-arid-600/10 border border-arid-600/20">
            <p className="text-xs font-medium text-arid-300 mb-1">💡 Pro Tip</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload 5+ papers to see the knowledge graph light up with rich concept connections.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
