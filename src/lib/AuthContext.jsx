import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [dogs, setDogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Controlla sessione attiva
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        fetchDogs(session.user.id)
      }
      setLoading(false)
    })

    // Ascolta cambiamenti auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        fetchDogs(session.user.id)
      } else {
        setProfile(null)
        setDogs([])
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  const fetchDogs = async (userId) => {
    const { data } = await supabase
      .from('dogs')
      .select('*')
      .eq('owner_id', userId)
    setDogs(data || [])
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const refreshDogs = () => {
    if (user) fetchDogs(user.id)
  }

  return (
    <AuthContext.Provider value={{ user, profile, dogs, loading, signOut, refreshDogs, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
