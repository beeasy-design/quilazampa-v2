import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { MapPin, PawPrint, Search, SlidersHorizontal, Bell, X } from 'lucide-react'

const AREA_COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444']
const PIN_POSITIONS = [
  { x: 50, y: 40 }, { x: 75, y: 28 }, { x: 22, y: 32 },
  { x: 33, y: 68 }, { x: 65, y: 72 }, { x: 80, y: 58 }
]

export default function HomePage({ onAreaSelect }) {
  const { dogs } = useAuth()
  const [areas, setAreas] = useState([])
  const [areaStats, setAreaStats] = useState({})
  const [nearestArea, setNearestArea] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    const { data: areasData } = await supabase.from('dog_areas').select('*')
    if (!areasData) return

    const { data: checkins } = await supabase
      .from('checkins')
      .select('area_id')
      .eq('active', true)

    const stats = {}
    checkins?.forEach(c => {
      stats[c.area_id] = (stats[c.area_id] || 0) + 1
    })

    setAreas(areasData)
    setAreaStats(stats)
    if (!nearestArea) setNearestArea(areasData[0])
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 pt-3 pb-3 flex items-center justify-between border-b border-gray-100">
        <button className="relative">
          <Bell className="w-6 h-6 text-gray-700" />
        </button>
        <div className="flex items-center gap-0.5">
          <span className="text-2xl font-black" style={{ color: '#F97316', fontFamily: 'Fredoka, sans-serif' }}>QU</span>
          <span className="text-2xl font-black" style={{ color: '#1E3A8A', fontFamily: 'Fredoka, sans-serif' }}>ilazampa</span>
          <span className="text-2xl font-black" style={{ color: '#F97316' }}>!</span>
        </div>
        <SlidersHorizontal className="w-6 h-6 text-gray-700" />
      </div>

      {/* Search */}
      <div className="bg-white px-4 pb-3">
        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2.5">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input type="text" placeholder="Cerca area, città..."
            className="flex-1 bg-transparent text-sm outline-none text-gray-700" />
        </div>
      </div>

      {/* Mappa */}
      <div className="flex-1 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #F1F8E9 50%, #E3F2FD 100%)' }}>
        <svg className="absolute inset-0 w-full h-full opacity-30">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path d="M 0 50 Q 30 45 50 50 T 100 55" stroke="#fff" strokeWidth="3" fill="none" />
          <path d="M 50 0 Q 55 30 50 50 T 45 100" stroke="#fff" strokeWidth="2.5" fill="none" />
          <path d="M 20 0 L 25 100" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.6" />
        </svg>

        {areas.map((area, i) => {
          const pos = PIN_POSITIONS[i % PIN_POSITIONS.length]
          const color = AREA_COLORS[i % AREA_COLORS.length]
          const count = areaStats[area.id] || 0
          return (
            <button key={area.id}
              onClick={() => onAreaSelect(area)}
              className="absolute transform -translate-x-1/2 -translate-y-full transition-transform hover:scale-110 active:scale-95"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
              <div className="relative flex flex-col items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                  style={{ backgroundColor: color }}>
                  <PawPrint className="w-6 h-6 text-white" fill="white" />
                </div>
                <div className="absolute -top-1 -right-1 bg-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2"
                  style={{ borderColor: color, color }}>
                  {count}
                </div>
                <div className="absolute top-14 whitespace-nowrap bg-white px-2 py-0.5 rounded text-[10px] font-semibold text-gray-700 shadow-sm">
                  {area.name.length > 18 ? area.name.substring(0, 16) + '...' : area.name}
                </div>
              </div>
            </button>
          )
        })}

        {/* Posizione utente */}
        <div className="absolute left-1/2 top-[55%] transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
          <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping opacity-50"></div>
        </div>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/40">
            <p className="text-sm text-gray-600 font-medium bg-white px-4 py-2 rounded-full shadow">
              🗺️ Caricamento aree...
            </p>
          </div>
        )}
      </div>

      {/* Card area più vicina */}
      {nearestArea && (
        <div className="bg-white rounded-t-3xl shadow-2xl -mt-4 relative z-10 px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-800">Area più vicina</p>
            <button onClick={() => setNearestArea(null)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="flex gap-3 mb-3">
            <div className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #A7F3D0, #6EE7B7)' }}>🌳</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-gray-900">{nearestArea.name}</h3>
                {nearestArea.fenced && (
                  <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">RECINTATA</span>
                )}
              </div>
              <p className="text-xs text-gray-600 flex items-center gap-2">
                <span><PawPrint className="w-3 h-3 inline" style={{ color: '#F97316' }} /> {areaStats[nearestArea.id] || 0} cani presenti</span>
                <span><MapPin className="w-3 h-3 inline" /> {nearestArea.city}</span>
              </p>
              {dogs.length === 0 && (
                <p className="text-[11px] text-orange-600 font-medium mt-1">⚠️ Aggiungi un cane per fare check-in</p>
              )}
            </div>
          </div>
          <button onClick={() => onAreaSelect(nearestArea)}
            className="w-full text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95"
            style={{ background: 'linear-gradient(135deg, #84CC16, #65A30D)' }}>
            <PawPrint className="w-5 h-5" fill="white" /> SONO QUI
          </button>
        </div>
      )}
    </div>
  )
}
