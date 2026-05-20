import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { PawPrint, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

export default function AuthPage() {
  const [mode, setMode] = useState('login') // login | register
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [city, setCity] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message === 'Invalid login credentials' ? 'Email o password non corretti' : error.message)
    setLoading(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (!username.trim()) { setError('Inserisci un username'); setLoading(false); return }
    if (password.length < 6) { setError('La password deve avere almeno 6 caratteri'); setLoading(false); return }

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }

    if (data.user) {
      // Crea profilo
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        username: username.trim(),
        city: city.trim(),
      })
      if (profileError) {
        if (profileError.code === '23505') setError('Username già in uso, scegline un altro')
        else setError(profileError.message)
        setLoading(false)
        return
      }
      setSuccess('Account creato! Controlla la tua email per confermare.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10"
      style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FED7AA 50%, #FECACA 100%)' }}>

      {/* Logo */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-1 mb-2">
          <span className="text-5xl font-black" style={{ color: '#F97316', fontFamily: 'Fredoka, sans-serif' }}>QU</span>
          <span className="text-5xl font-black" style={{ color: '#1E3A8A', fontFamily: 'Fredoka, sans-serif' }}>ilazampa</span>
          <span className="text-5xl font-black" style={{ color: '#F97316' }}>!</span>
        </div>
        <p className="text-sm font-semibold text-gray-700">La community intelligente delle aree cani</p>
        <p className="text-xs text-gray-500 italic mt-1">🐾 Dove i cani socializzano meglio</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-6">
        {/* Tab switcher */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
          <button onClick={() => { setMode('login'); setError(''); setSuccess('') }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
            Accedi
          </button>
          <button onClick={() => { setMode('register'); setError(''); setSuccess('') }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'register' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
            Registrati
          </button>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="es. marco_e_rocky" required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Città</label>
                <div className="relative">
                  <PawPrint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={city} onChange={e => setCity(e.target.value)}
                    placeholder="es. Milano"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="la-tua@email.com" required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Almeno 6 caratteri' : '••••••••'} required
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-sm focus:border-orange-400 focus:outline-none" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2">
                {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <p className="text-xs text-green-700">{success}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-60 mt-2"
            style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}>
            {loading ? '⏳ Attendere...' : mode === 'login' ? '🐾 Accedi' : '🚀 Crea account'}
          </button>
        </form>

        {mode === 'register' && (
          <p className="text-[10px] text-gray-400 text-center mt-4">
            Registrandoti accetti i termini di servizio.<br />Nessuna carta di credito richiesta.
          </p>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-6 text-center">
        🔒 I tuoi dati sono al sicuro.<br />La posizione è condivisa solo durante il check-in.
      </p>
    </div>
  )
}
