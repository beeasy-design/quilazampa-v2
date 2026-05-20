import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { ChevronLeft, PawPrint, MapPin, Star, Eye, EyeOff, ChevronRight } from 'lucide-react'

function calcCompatibility(myDog, otherDog) {
  if (!myDog || !otherDog) return 50
  let score = 50
  // Stessa taglia +10
  if (myDog.size === otherDog.size) score += 10
  // Energia simile +15
  const energyMap = { Bassa: 1, Media: 2, Alta: 3 }
  const diff = Math.abs((energyMap[myDog.energy] || 2) - (energyMap[otherDog.energy] || 2))
  if (diff === 0) score += 15
  else if (diff === 1) score += 7
  // Trait in comune +5 per ogni trait condiviso (max 25)
  const commonTraits = (myDog.traits || []).filter(t => (otherDog.traits || []).includes(t))
  score += Math.min(commonTraits.length * 5, 25)
  return Math.min(score, 99)
}

const DOG_EMOJIS = ['🐕', '🐶', '🦮', '🐕‍🦺', '🐩', '🦴']

export default function AreaPage({ area, onBack }) {
  const { user, dogs } = useAuth()
  const myDog = dogs[0] || null

  const [dogsPresent, setDogsPresent] = useState([])
  const [checkinId, setCheckinId] = useState(null)
  const [invisible, setInvisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)

  useEffect(() => {
    fetchDogsPresent()
    checkIfAlreadyCheckedIn()

    // Realtime: ascolta nuovi check-in in quest'area
    const channel = supabase
      .channel(`area-${area.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'checkins',
        filter: `area_id=eq.${area.id}`
      }, () => fetchDogsPresent())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [area.id])

  const fetchDogsPresent = async () => {
    const { data } = await supabase
      .from('checkins')
      .select(`
        id, dog_id, checked_in_at,
        dogs ( id, name, breed, age, gender, size, energy, traits, owner_id )
      `)
      .eq('area_id', area.id)
      .eq('active', true)

    setDogsPresent(data || [])
    setLoading(false)
  }

  const checkIfAlreadyCheckedIn = async () => {
    if (!myDog) return
    const { data } = await supabase
      .from('checkins')
      .select('id')
      .eq('dog_id', myDog.id)
      .eq('area_id', area.id)
      .eq('active', true)
      .single()
    if (data) setCheckinId(data.id)
  }

  const handleCheckin = async () => {
    if (!myDog) return
    setCheckingIn(true)

    if (checkinId) {
      // Check-out
      await supabase.from('checkins').update({ active: false, checked_out_at: new Date().toISOString() }).eq('id', checkinId)
      setCheckinId(null)
    } else {
      // Prima fai checkout da altre aree
      await supabase.from('checkins')
        .update({ active: false, checked_out_at: new Date().toISOString() })
        .eq('dog_id', myDog.id)
        .eq('active', true)

      // Check-in qui
      const { data } = await supabase.from('checkins').insert({
        dog_id: myDog.id,
        area_id: area.id,
        active: true,
      }).select().single()
      if (data) setCheckinId(data.id)
    }

    await fetchDogsPresent()
    setCheckingIn(false)
  }

  const getTimePresent = (checkedInAt) => {
    const mins = Math.floor((Date.now() - new Date(checkedInAt)) / 60000)
    if (mins < 60) return `${mins}m fa`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  const visibleDogs = invisible
    ? dogsPresent.filter(c => c.dogs?.owner_id !== user?.id)
    : dogsPresent

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 pt-3 pb-3 flex items-center justify-between border-b border-gray-100">
        <button onClick={onBack}><ChevronLeft className="w-6 h-6 text-gray-700" /></button>
        <div className="text-center flex-1 mx-2">
          <div className="flex items-center justify-center gap-1.5">
            <h2 className="font-bold text-gray-900 text-sm truncate">{area.name}</h2>
            {area.fenced && (
              <span className="text-[9px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full flex-shrink-0">RECINTATA</span>
            )}
          </div>
          <p className="text-[10px] text-gray-500 flex items-center justify-center gap-2">
            <span><PawPrint className="w-2.5 h-2.5 inline" /> {dogsPresent.length} cani</span>
            <span>•</span>
            <span><MapPin className="w-2.5 h-2.5 inline" /> {area.city}</span>
          </p>
        </div>
        <Star className="w-6 h-6 text-gray-400" />
      </div>

      {/* Tabs */}
      <div className="bg-white flex border-b border-gray-200">
        <button className="flex-1 py-3 text-sm font-bold border-b-2 border-orange-500 text-orange-600">
          CANI PRESENTI ({dogsPresent.length})
        </button>
        <button className="flex-1 py-3 text-sm font-medium text-gray-500">ATTIVITÀ AREA</button>
      </div>

      {/* Modalità invisibile */}
      <div className="bg-amber-50 px-4 py-2 flex items-center justify-between border-b border-amber-100">
        <div className="flex items-center gap-2 text-xs text-amber-900">
          {invisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>Modalità invisibile</span>
        </div>
        <button onClick={() => setInvisible(!invisible)}
          className={`w-10 h-5 rounded-full transition-colors relative ${invisible ? 'bg-green-500' : 'bg-gray-300'}`}>
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${invisible ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* Lista cani */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading && (
          <div className="text-center py-10 text-gray-500 text-sm">Caricamento...</div>
        )}

        {!loading && visibleDogs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🐾</div>
            <p className="font-semibold text-gray-700">Nessun cane presente</p>
            <p className="text-xs text-gray-500 mt-1">Sii il primo a fare check-in!</p>
          </div>
        )}

        {visibleDogs.map((checkin, i) => {
          const dog = checkin.dogs
          if (!dog) return null
          const compat = calcCompatibility(myDog, dog)
          const isMe = dog.owner_id === user?.id
          const compatColor = compat >= 75 ? '#10B981' : compat >= 60 ? '#F97316' : '#EF4444'

          return (
            <div key={checkin.id}
              className={`bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm ${isMe ? 'border-2 border-orange-200' : ''}`}>
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-2xl">
                  {DOG_EMOJIS[i % DOG_EMOJIS.length]}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-gray-900">{dog.name}</h3>
                  <span className="text-xs text-gray-500">{dog.gender === 'M' ? '♂' : '♀'}</span>
                  {isMe && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 rounded-full font-bold">TU</span>}
                </div>
                <p className="text-xs text-gray-600">{dog.breed || 'Razza sconosciuta'} • {dog.age ? dog.age + ' anni' : ''}</p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {(dog.traits || []).slice(0, 2).map((t, j) => (
                    <span key={j} className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">{t}</span>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">Qui da {getTimePresent(checkin.checked_in_at)}</p>
              </div>
              {!isMe && (
                <div className="text-right">
                  <div className="text-xl font-black" style={{ color: compatColor }}>{compat}%</div>
                  <p className="text-[10px] text-gray-500">Compat.</p>
                </div>
              )}
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
          )
        })}
      </div>

      {/* Bottone check-in */}
      <div className="bg-white px-4 py-3 border-t border-gray-100">
        {!myDog ? (
          <div className="text-center py-2">
            <p className="text-sm text-gray-600">⚠️ Aggiungi un cane dal profilo per fare check-in</p>
          </div>
        ) : (
          <button onClick={handleCheckin} disabled={checkingIn}
            className="w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-60"
            style={{ background: checkinId ? 'linear-gradient(135deg, #6B7280, #4B5563)' : 'linear-gradient(135deg, #84CC16, #65A30D)' }}>
            <PawPrint className="w-5 h-5" fill="white" />
            {checkingIn ? 'Attendere...' : checkinId ? `${myDog.name} è qui ✓ (tap per uscire)` : `SONO QUI con ${myDog.name}`}
          </button>
        )}
      </div>
    </div>
  )
}
