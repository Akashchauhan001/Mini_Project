import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Upload, Search, Network,
  MessageSquare, BookOpen, Cpu, ChevronRight
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',      path: '/app/dashboard' },
  { icon: Upload,          label: 'Upload Paper',   path: '/app/upload' },
  { icon: Search,          label: 'Semantic Search',path: '/app/search' },
  { icon: Network,         label: 'Knowledge Graph',path: '/app/graph' },
  { icon: MessageSquare,   label: 'AI Assistant',   path: '/app/assistant' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  return (
    <aside className="w-64 flex-shrink-0 bg-surface-900 border-r border-surface-700/50 flex flex-col h-full">
      {/* Logo */}
      <div
        className="px-5 py-5 border-b border-surface-800 cursor-pointer"
        onClick={() => navigate('/')}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-arid-500 to-purple-600 rounded-lg flex items-center justify-center shadow-glow-sm">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">ARID</p>
            <p className="text-[10px] text-slate-500 leading-tight">Research Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 mb-3 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
          Navigation
        </p>
        {navItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-arid-600/20 text-arid-300 border border-arid-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-surface-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-arid-400' : ''}`} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3 h-3 text-arid-500" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-surface-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-slate-500">API Connected</span>
        </div>
        <p className="text-[10px] text-slate-600 mt-1">ARID Platform v1.0.0</p>
      </div>
    </aside>
  )
}
