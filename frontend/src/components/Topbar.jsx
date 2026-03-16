import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Sun, Moon, Bell } from 'lucide-react'
import { useTheme } from '../hooks/useTheme.jsx'

const pageTitles = {
  '/app/dashboard':  { title: 'Dashboard', subtitle: 'Research overview and recent activity' },
  '/app/upload':     { title: 'Upload Paper', subtitle: 'Add new research papers to your library' },
  '/app/search':     { title: 'Semantic Search', subtitle: 'Discover papers by topic or concept' },
  '/app/graph':      { title: 'Knowledge Graph', subtitle: 'Visualize research connections' },
  '/app/assistant':  { title: 'AI Assistant', subtitle: 'Ask questions about your research' },
}

export default function Topbar() {
  const { dark, toggle } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchVal, setSearchVal] = useState('')

  const page = pageTitles[location.pathname] || { title: 'ARID Platform', subtitle: '' }

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      navigate(`/app/search?q=${encodeURIComponent(searchVal.trim())}`)
      setSearchVal('')
    }
  }

  return (
    <header className="h-16 bg-surface-900 border-b border-surface-700/50 flex items-center px-6 gap-4 flex-shrink-0">
      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-white truncate">{page.title}</h1>
        <p className="text-xs text-slate-500 truncate">{page.subtitle}</p>
      </div>

      {/* Global search */}
      <div className="relative hidden md:block w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          onKeyDown={handleSearch}
          placeholder="Quick search… (↵ to search)"
          className="input pl-9 text-xs py-2 h-9"
        />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="btn-ghost p-2 rounded-lg"
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {dark
          ? <Sun className="w-4 h-4 text-amber-400" />
          : <Moon className="w-4 h-4 text-arid-400" />
        }
      </button>

      {/* Notification bell (decorative) */}
      <button className="btn-ghost p-2 rounded-lg relative">
        <Bell className="w-4 h-4" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-arid-500 rounded-full" />
      </button>
    </header>
  )
}
