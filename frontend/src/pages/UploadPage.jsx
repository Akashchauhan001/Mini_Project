import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import {
  Upload, FileText, CheckCircle, AlertCircle,
  X, Loader2, Tag, User, Calendar, BookOpen
} from 'lucide-react'
import { uploadPaper } from '../services/api.js'

function ConceptTag({ label }) {
  return (
    <span className="badge-blue text-[11px] px-2 py-0.5">{label}</span>
  )
}

export default function UploadPage() {
  const navigate = useNavigate()
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length) {
      setError('Only PDF files are supported.')
      return
    }
    setError(null)
    setResult(null)
    setFiles(accepted)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  })

  const handleUpload = async () => {
    if (!files.length) return
    setUploading(true)
    setError(null)
    setProgress(0)

    try {
      const res = await uploadPaper(files[0], setProgress)
      setResult(res.data.data)
      setFiles([])
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Upload failed')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const clearFile = () => {
    setFiles([])
    setResult(null)
    setError(null)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Success result */}
      {result ? (
        <div className="card border-green-600/30 animate-slide-up space-y-5">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <div>
              <h3 className="text-base font-semibold text-white">Paper Processed Successfully!</h3>
              <p className="text-xs text-slate-500">All data extracted and indexed</p>
            </div>
          </div>
          <div className="divider" />

          {/* Metadata */}
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 mb-1 uppercase tracking-widest">Title</p>
              <p className="text-sm font-medium text-white">{result.title}</p>
            </div>
            {result.authors?.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1 uppercase tracking-widest flex items-center gap-1">
                  <User className="w-3 h-3" /> Authors
                </p>
                <p className="text-sm text-slate-300">{result.authors.join(', ')}</p>
              </div>
            )}
            {result.year && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Calendar className="w-3.5 h-3.5" /> {result.year}
              </div>
            )}
            {result.abstract && (
              <div>
                <p className="text-xs text-slate-500 mb-1 uppercase tracking-widest">Abstract</p>
                <p className="text-sm text-slate-400 leading-relaxed line-clamp-4">{result.abstract}</p>
              </div>
            )}
          </div>

          {/* Concepts */}
          {result.concepts?.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-widest flex items-center gap-1">
                <Tag className="w-3 h-3" /> Extracted Concepts ({result.concepts.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.concepts.map(c => <ConceptTag key={c} label={c} />)}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label:'Words', val: result.char_count > 0 ? `${result.word_count?.toLocaleString()}` : '–' },
              { label:'Concepts', val: result.concepts?.length ?? 0 },
              { label:'Keywords', val: result.keywords?.length ?? 0 },
            ].map(s => (
              <div key={s.label} className="bg-surface-800 rounded-lg px-4 py-3 text-center">
                <p className="text-lg font-bold text-arid-400">{s.val}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setResult(null); setFiles([]) }} className="btn-secondary text-xs flex-1">
              Upload Another
            </button>
            <button onClick={() => navigate('/app/graph')} className="btn-primary text-xs flex-1">
              <BookOpen className="w-3.5 h-3.5" /> View in Graph
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Upload zone */}
          <div className="card">
            <h2 className="section-title mb-1">Upload Research Paper</h2>
            <p className="section-subtitle mb-5">
              Drop a PDF to auto-extract text, metadata, concepts, and build the knowledge graph entry.
            </p>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
                isDragActive
                  ? 'border-arid-500 bg-arid-500/5 shadow-glow-sm'
                  : 'border-surface-700 hover:border-surface-600 hover:bg-surface-800/30'
              }`}
            >
              <input {...getInputProps()} />
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-200 ${
                isDragActive ? 'bg-arid-600/20 shadow-glow' : 'bg-surface-800'
              }`}>
                <Upload className={`w-8 h-8 ${isDragActive ? 'text-arid-400' : 'text-slate-500'}`} />
              </div>
              {isDragActive ? (
                <p className="text-arid-300 font-medium">Drop to upload!</p>
              ) : (
                <>
                  <p className="text-slate-300 font-medium mb-1">Drag &amp; drop your PDF here</p>
                  <p className="text-slate-500 text-sm mb-4">or click to browse files</p>
                  <span className="badge-blue text-xs">PDF only · Max 50 MB</span>
                </>
              )}
            </div>

            {/* Selected file */}
            {files.length > 0 && (
              <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-surface-800 border border-surface-700 animate-slide-up">
                <div className="w-8 h-8 rounded-lg bg-arid-600/20 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-arid-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{files[0].name}</p>
                  <p className="text-xs text-slate-500">
                    {(files[0].size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button onClick={clearFile} className="btn-ghost p-1.5 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-rose-600/10 border border-rose-600/30 text-rose-400 text-sm animate-slide-up">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Progress */}
            {uploading && (
              <div className="mt-4 space-y-2 animate-slide-up">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Processing paper…</span>
                  <span>{progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-slate-600 text-center">Extracting text, running NLP pipeline, building graph…</p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!files.length || uploading}
              className="btn-primary w-full mt-5 py-3"
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
              ) : (
                <><Upload className="w-4 h-4" /> Analyze Paper</>
              )}
            </button>
          </div>

          {/* Info cards */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: FileText, color: 'text-arid-400', title: 'Text Extraction', desc: 'PyPDF2 + pdfminer extract full paper text' },
              { icon: Tag, color: 'text-purple-400', title: 'Concept Mining', desc: 'spaCy NLP identifies key research terms' },
              { icon: BookOpen, color: 'text-teal-400', title: 'Graph Indexing', desc: 'Concepts and authors added to Neo4j' },
            ].map(item => (
              <div key={item.title} className="card text-center">
                <item.icon className={`w-6 h-6 ${item.color} mx-auto mb-2`} />
                <p className="text-sm font-medium text-white mb-1">{item.title}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
