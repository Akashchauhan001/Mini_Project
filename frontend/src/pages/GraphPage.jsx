import { useState, useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'
import {
  Network, Loader2, AlertCircle, RefreshCw,
  ZoomIn, ZoomOut, Maximize2, Info
} from 'lucide-react'
import { getGraph } from '../services/api.js'

// Node color by label
const NODE_COLORS = {
  Paper:   '#3b63f8',  // arid blue
  Concept: '#2dd4bf',  // teal
  Author:  '#a78bfa',  // purple
}
const NODE_RADIUS = { Paper: 14, Concept: 9, Author: 11 }

// Edge color by relation
const EDGE_COLORS = {
  PAPER_HAS_CONCEPT:    '#2dd4bf44',
  PAPER_CITES_PAPER:    '#3b63f844',
  AUTHOR_WRITES_PAPER:  '#a78bfa44',
}

function Legend() {
  return (
    <div className="absolute bottom-4 left-4 card py-3 px-4 space-y-2 text-xs">
      <p className="text-slate-500 uppercase tracking-widest text-[10px] mb-2">Legend</p>
      {Object.entries(NODE_COLORS).map(([label, color]) => (
        <div key={label} className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="text-slate-400">{label}</span>
        </div>
      ))}
      <div className="mt-2 border-t border-surface-700 pt-2 space-y-1">
        {[
          { rel:'HAS CONCEPT', color:'#2dd4bf' },
          { rel:'CITES', color:'#3b63f8' },
          { rel:'WRITES', color:'#a78bfa' },
        ].map(e => (
          <div key={e.rel} className="flex items-center gap-2">
            <span className="w-5 h-0.5 flex-shrink-0 rounded" style={{ background: e.color }} />
            <span className="text-slate-500">{e.rel}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Tooltip({ node, pos }) {
  if (!node) return null
  return (
    <div
      className="absolute z-20 card py-2 px-3 text-xs max-w-xs pointer-events-none"
      style={{ left: pos.x + 12, top: pos.y - 10 }}
    >
      <p className="font-semibold text-white mb-0.5">
        {node.title || node.name || node.id}
      </p>
      <div className="flex items-center gap-1.5 mt-1">
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: NODE_COLORS[node.label] || '#64748b' }}
        />
        <span className="text-slate-400">{node.label}</span>
        {node.year && <span className="text-slate-600">· {node.year}</span>}
      </div>
    </div>
  )
}

// ── D3 Graph Component ────────────────────
function D3Graph({ nodes, edges }) {
  const svgRef = useRef(null)
  const simRef = useRef(null)
  const [tooltip, setTooltip] = useState({ node: null, pos: { x: 0, y: 0 } })

  const draw = useCallback(() => {
    if (!svgRef.current || !nodes.length) return

    const container = svgRef.current.parentElement
    const W = container.offsetWidth || 800
    const H = container.offsetHeight || 600

    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', W)
      .attr('height', H)

    // Zoom
    const g = svg.append('g')
    const zoom = d3.zoom()
      .scaleExtent([0.2, 4])
      .on('zoom', (e) => g.attr('transform', e.transform))
    svg.call(zoom)

    // Arrow markers
    const defs = svg.append('defs')
    Object.entries(EDGE_COLORS).forEach(([rel, color]) => {
      defs.append('marker')
        .attr('id', `arrow-${rel}`)
        .attr('viewBox', '0 -4 8 8')
        .attr('refX', 22)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-4L8,0L0,4')
        .attr('fill', color.substring(0, 7))
        .attr('opacity', 0.6)
    })

    // Map node IDs
    const nodeMap = {}
    nodes.forEach(n => { nodeMap[n.id] = n })

    const validEdges = edges.filter(e => nodeMap[e.source] && nodeMap[e.target])

    // Simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(validEdges)
        .id(d => d.id)
        .distance(d => {
          if (d.relation === 'PAPER_HAS_CONCEPT') return 90
          if (d.relation === 'AUTHOR_WRITES_PAPER') return 80
          return 140
        })
        .strength(0.6)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide(d => (NODE_RADIUS[d.label] || 10) + 4))

    simRef.current = simulation

    // Edges
    const link = g.append('g').selectAll('line')
      .data(validEdges)
      .join('line')
      .attr('stroke', d => EDGE_COLORS[d.relation] || '#33415544')
      .attr('stroke-width', 1.5)
      .attr('marker-end', d => `url(#arrow-${d.relation})`)

    // Node groups
    const node = g.append('g').selectAll('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .call(
        d3.drag()
          .on('start', (e, d) => {
            if (!e.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x; d.fy = d.y
          })
          .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y })
          .on('end', (e, d) => {
            if (!e.active) simulation.alphaTarget(0)
            d.fx = null; d.fy = null
          })
      )

    // Circles
    node.append('circle')
      .attr('r', d => NODE_RADIUS[d.label] || 10)
      .attr('fill', d => `${NODE_COLORS[d.label] || '#64748b'}22`)
      .attr('stroke', d => NODE_COLORS[d.label] || '#64748b')
      .attr('stroke-width', 2)
      .on('mouseover', function (e, d) {
        d3.select(this)
          .transition().duration(150)
          .attr('r', (NODE_RADIUS[d.label] || 10) + 4)
          .attr('fill', `${NODE_COLORS[d.label] || '#64748b'}44`)
        const rect = svgRef.current.getBoundingClientRect()
        setTooltip({ node: d, pos: { x: e.clientX - rect.left, y: e.clientY - rect.top } })
      })
      .on('mousemove', function (e) {
        const rect = svgRef.current.getBoundingClientRect()
        setTooltip(t => ({ ...t, pos: { x: e.clientX - rect.left, y: e.clientY - rect.top } }))
      })
      .on('mouseout', function (e, d) {
        d3.select(this)
          .transition().duration(150)
          .attr('r', NODE_RADIUS[d.label] || 10)
          .attr('fill', `${NODE_COLORS[d.label] || '#64748b'}22`)
        setTooltip({ node: null, pos: { x: 0, y: 0 } })
      })

    // Labels
    node.append('text')
      .text(d => {
        const name = d.title || d.name || d.id || ''
        return name.length > 20 ? name.substring(0, 18) + '…' : name
      })
      .attr('dx', d => (NODE_RADIUS[d.label] || 10) + 5)
      .attr('dy', '0.35em')
      .attr('fill', '#94a3b8')
      .attr('font-size', d => d.label === 'Paper' ? '10px' : '9px')
      .attr('pointer-events', 'none')

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)
      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    // Store zoom for controls
    svgRef.current._zoom = zoom
    svgRef.current._svg = svg
  }, [nodes, edges])

  useEffect(() => {
    draw()
    return () => { if (simRef.current) simRef.current.stop() }
  }, [draw])

  const zoomIn = () => {
    if (svgRef.current?._zoom && svgRef.current?._svg) {
      svgRef.current._svg.transition().call(svgRef.current._zoom.scaleBy, 1.4)
    }
  }
  const zoomOut = () => {
    if (svgRef.current?._zoom && svgRef.current?._svg) {
      svgRef.current._svg.transition().call(svgRef.current._zoom.scaleBy, 0.7)
    }
  }
  const resetZoom = () => {
    if (svgRef.current?._zoom && svgRef.current?._svg) {
      svgRef.current._svg.transition().call(svgRef.current._zoom.transform, d3.zoomIdentity)
    }
  }

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
      <Tooltip node={tooltip.node} pos={tooltip.pos} />
      <Legend />
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-1">
        <button onClick={zoomIn} className="btn-secondary p-2 rounded-lg" title="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={zoomOut} className="btn-secondary p-2 rounded-lg" title="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={resetZoom} className="btn-secondary p-2 rounded-lg" title="Reset View">
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────
export default function GraphPage() {
  const [graph, setGraph] = useState({ nodes: [], edges: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    getGraph()
      .then(r => {
        const data = r.data.data || { nodes: [], edges: [] }
        setGraph(data)
        setLoading(false)
      })
      .catch(e => {
        setError('Could not load graph. Is the Flask API running?')
        setLoading(false)
      })
  }

  useEffect(() => { load() }, [])

  const { nodes, edges } = graph
  const papers   = nodes.filter(n => n.label === 'Paper')
  const concepts = nodes.filter(n => n.label === 'Concept')
  const authors  = nodes.filter(n => n.label === 'Author')

  return (
    <div className="h-full flex flex-col gap-4 animate-fade-in" style={{ height: 'calc(100vh - 112px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="section-title">Knowledge Graph</h2>
          <p className="section-subtitle">
            {loading ? 'Loading…' : `${nodes.length} nodes · ${edges.length} edges`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Stats pills */}
          <div className="hidden sm:flex items-center gap-2">
            {[
              { label:`${papers.length} Papers`,   color:'bg-arid-600/20 text-arid-300' },
              { label:`${concepts.length} Concepts`,color:'bg-teal-600/20 text-teal-300' },
              { label:`${authors.length} Authors`,  color:'bg-purple-600/20 text-purple-300' },
            ].map(p => (
              <span key={p.label} className={`badge text-xs ${p.color}`}>{p.label}</span>
            ))}
          </div>
          <button onClick={load} className="btn-secondary text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-600/10 border border-amber-600/30 text-amber-400 text-sm flex-shrink-0">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Graph canvas */}
      <div className="flex-1 card p-0 overflow-hidden relative min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-arid-400 animate-spin mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Building knowledge graph…</p>
            </div>
          </div>
        ) : nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Network className="w-12 h-12 text-slate-700 mx-auto mb-4 float" />
              <p className="text-slate-400 font-medium mb-2">Graph is Empty</p>
              <p className="text-slate-600 text-sm max-w-sm mx-auto">
                Upload research papers to start building your knowledge graph. Each paper adds nodes for concepts, authors, and citations.
              </p>
            </div>
          </div>
        ) : (
          <D3Graph nodes={nodes} edges={edges} />
        )}
      </div>

      {/* Info bar */}
      <div className="flex items-center gap-2 text-xs text-slate-600 flex-shrink-0">
        <Info className="w-3.5 h-3.5" />
        Drag nodes to rearrange · Scroll to zoom · Hover for details
      </div>
    </div>
  )
}
