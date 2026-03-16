import { useState, useRef, useEffect } from 'react'
import {
  MessageSquare, Send, Loader2, Bot, User,
  Lightbulb, FileText, BookOpen, HelpCircle, Trash2
} from 'lucide-react'
import { askAssistant, getPapers } from '../services/api.js'

// Markdown-lite renderer for the assistant's responses
function MessageContent({ text }) {
  // Convert **bold**, *italic*, bullet points, line breaks
  const lines = text.split('\n')
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />

        // Bold: **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/)
        return (
          <p key={i} className="leading-relaxed">
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j} className="text-white font-semibold">{part.slice(2,-2)}</strong>
              }
              // Bullet point
              if (part.startsWith('• ') || part.startsWith('- ')) {
                return <span key={j} className="block pl-3 before:content-['•'] before:mr-2 before:text-arid-400">{part.slice(2)}</span>
              }
              return <span key={j}>{part}</span>
            })}
          </p>
        )
      })}
    </div>
  )
}

const STARTER_PROMPTS = [
  { icon: BookOpen,  label: 'Summarize paper',   text: 'Summarize this paper for me' },
  { icon: Lightbulb, label: 'Key ideas',          text: 'What are the key ideas in this paper?' },
  { icon: FileText,  label: 'Methods used',       text: 'What methods and techniques does this paper use?' },
  { icon: HelpCircle,label: 'Related research',   text: 'What papers are related to this one?' },
]

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-slide-up`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
        isUser ? 'bg-arid-600' : 'bg-surface-700 border border-surface-600'
      }`}>
        {isUser
          ? <User className="w-4 h-4 text-white" />
          : <Bot className="w-4 h-4 text-arid-400" />
        }
      </div>
      {/* Bubble */}
      <div className={isUser ? 'chat-message-user' : 'chat-message-assistant'}>
        {isUser
          ? <p className="text-sm">{msg.content}</p>
          : <div className="text-sm"><MessageContent text={msg.content} /></div>
        }
        <p className="text-[10px] text-slate-600 mt-1.5 text-right">
          {new Date(msg.ts).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}
        </p>
      </div>
    </div>
  )
}

export default function AssistantPage() {
  const [messages, setMessages] = useState([
    {
      id: 0,
      role: 'assistant',
      content: "Hello! I'm **ARID**, your AI research assistant. Select a paper from your library and ask me to summarize it, explain key concepts, or find related research. How can I help?",
      ts: Date.now(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [papers, setPapers] = useState([])
  const [selectedPaper, setSelectedPaper] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    getPapers()
      .then(r => setPapers(r.data.data?.papers || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text = input) => {
    const q = text.trim()
    if (!q || loading) return

    const userMsg = { id: Date.now(), role: 'user', content: q, ts: Date.now() }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await askAssistant(q, selectedPaper?.id || null)
      const reply = res.data.data?.response || 'Sorry, I could not generate a response.'
      setMessages(m => [...m, { id: Date.now()+1, role: 'assistant', content: reply, ts: Date.now() }])
    } catch (e) {
      const errMsg = e.response?.status === 0
        ? 'Could not reach the backend. Make sure Flask is running on port 5000.'
        : e.response?.data?.message || 'An error occurred.'
      setMessages(m => [...m, { id: Date.now()+1, role: 'assistant', content: `⚠️ ${errMsg}`, ts: Date.now() }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const clearChat = () => {
    setMessages([{
      id: 0,
      role: 'assistant',
      content: "Chat cleared. I'm ready to help with your research!",
      ts: Date.now(),
    }])
  }

  return (
    <div className="h-full flex gap-4 animate-fade-in" style={{ height: 'calc(100vh - 112px)' }}>
      {/* Left: Paper selector */}
      <aside className="w-64 flex-shrink-0 flex flex-col gap-3">
        <div className="card flex-1 flex flex-col min-h-0">
          <h3 className="section-title mb-1">Select Paper</h3>
          <p className="section-subtitle mb-3">Focus on a specific paper</p>
          <div className="divider" />
          <div className="flex-1 overflow-y-auto space-y-1 mt-2">
            {/* None option */}
            <button
              onClick={() => setSelectedPaper(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                !selectedPaper
                  ? 'bg-arid-600/20 text-arid-300 border border-arid-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-surface-800'
              }`}
            >
              <Bot className="w-3.5 h-3.5 inline mr-2" />
              General Assistant
            </button>
            {papers.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPaper(p)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors ${
                  selectedPaper?.id === p.id
                    ? 'bg-arid-600/20 text-arid-300 border border-arid-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-surface-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5 inline mr-2 flex-shrink-0" />
                <span className="line-clamp-2 leading-snug">{p.title}</span>
              </button>
            ))}
            {papers.length === 0 && (
              <p className="text-xs text-slate-600 text-center py-4 px-2">
                No papers yet. Upload papers to enable paper-specific Q&amp;A.
              </p>
            )}
          </div>
        </div>

        {/* Starter prompts */}
        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Suggested</p>
          <div className="space-y-1">
            {STARTER_PROMPTS.map(p => (
              <button
                key={p.label}
                onClick={() => send(p.text)}
                className="w-full flex items-center gap-2 text-xs px-2 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-800 transition-colors text-left"
              >
                <p.icon className="w-3.5 h-3.5 text-arid-500 flex-shrink-0" />
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Right: Chat */}
      <div className="flex-1 flex flex-col card p-0 overflow-hidden min-h-0">
        {/* Chat header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-surface-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-arid-500 to-purple-600 flex items-center justify-center shadow-glow-sm">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">ARID Assistant</p>
              <p className="text-[10px] text-slate-500">
                {selectedPaper ? `On: ${selectedPaper.title.substring(0,40)}…` : 'General mode'}
              </p>
            </div>
          </div>
          <button onClick={clearChat} className="btn-ghost p-2 rounded-lg" title="Clear chat">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
          {messages.map(msg => (
            <ChatMessage key={msg.id} msg={msg} />
          ))}
          {loading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-surface-700 border border-surface-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-arid-400" />
              </div>
              <div className="chat-message-assistant flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-arid-400" />
                <span className="text-xs text-slate-500">Thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-surface-800 flex-shrink-0">
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={
                selectedPaper
                  ? `Ask about "${selectedPaper.title.substring(0,30)}…"`
                  : 'Ask anything about your research…'
              }
              className="input resize-none flex-1 py-2.5 text-sm"
              style={{ maxHeight: '120px' }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="btn-primary px-4 self-end"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-700 mt-2">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  )
}
