import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { ChevronLeft, Send, Plus, Smile, Search, PawPrint } from 'lucide-react'

export default function ChatPage() {
  const { user, profile } = useAuth()
  const [conversations, setConversations] = useState([])
  const [selectedConv, setSelectedConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetchConversations()
  }, [user])

  useEffect(() => {
    if (!selectedConv) return
    fetchMessages(selectedConv.other_id)

    // Realtime messaggi
    const channel = supabase
      .channel(`chat-${user.id}-${selectedConv.other_id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages'
      }, (payload) => {
        const msg = payload.new
        if (
          (msg.sender_id === user.id && msg.receiver_id === selectedConv.other_id) ||
          (msg.sender_id === selectedConv.other_id && msg.receiver_id === user.id)
        ) {
          setMessages(prev => [...prev, msg])
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [selectedConv])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchConversations = async () => {
    if (!user) return
    const { data } = await supabase
      .from('messages')
      .select('sender_id, receiver_id, content, created_at')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (!data) { setLoading(false); return }

    // Raggruppa per conversazione
    const convMap = {}
    data.forEach(msg => {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
      if (!convMap[otherId]) {
        convMap[otherId] = { other_id: otherId, lastMsg: msg.content, lastTime: msg.created_at }
      }
    })

    // Carica profili degli interlocutori
    const otherIds = Object.keys(convMap)
    if (otherIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, city')
        .in('id', otherIds)

      profiles?.forEach(p => {
        if (convMap[p.id]) convMap[p.id].profile = p
      })
    }

    setConversations(Object.values(convMap))
    setLoading(false)
  }

  const fetchMessages = async (otherId) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
    setMessages(data || [])

    // Segna come letti
    await supabase.from('messages')
      .update({ read: true })
      .eq('sender_id', otherId)
      .eq('receiver_id', user.id)
      .eq('read', false)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv) return
    setSending(true)
    const text = newMessage.trim()
    setNewMessage('')

    const { data } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selectedConv.other_id,
      content: text,
    }).select().single()

    if (data) setMessages(prev => [...prev, data])
    setSending(false)
    fetchConversations()
  }

  const formatTime = (ts) => {
    const d = new Date(ts)
    return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  }

  // ---- CHAT DETAIL ----
  if (selectedConv) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white px-4 pt-3 pb-3 flex items-center gap-3 border-b border-gray-100">
          <button onClick={() => setSelectedConv(null)}><ChevronLeft className="w-6 h-6 text-gray-700" /></button>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #FED7AA, #FB923C)' }}>👤</div>
          <div className="flex-1">
            <h2 className="font-bold text-sm text-gray-900">{selectedConv.profile?.username || 'Utente'}</h2>
            <p className="text-[10px] text-gray-500">{selectedConv.profile?.city || ''}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2"
          style={{ background: 'linear-gradient(180deg, #FEF3C7, #FED7AA)' }}>
          <div className="text-center mb-2">
            <span className="text-[10px] bg-white/70 px-3 py-1 rounded-full text-gray-600">Inizio conversazione</span>
          </div>
          {messages.map((msg, i) => {
            const isMe = msg.sender_id === user.id
            return (
              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl shadow-sm ${isMe ? 'text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm'}`}
                  style={isMe ? { background: 'linear-gradient(135deg, #F97316, #EA580C)' } : {}}>
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-[9px] mt-0.5 text-right ${isMe ? 'text-orange-100' : 'text-gray-400'}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            )
          })}
          {messages.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              <PawPrint className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>Inizia la conversazione!</p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="bg-white px-3 py-2 border-t border-gray-100 flex items-center gap-2">
          <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2.5">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Scrivi un messaggio..."
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <button onClick={sendMessage} disabled={!newMessage.trim() || sending}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    )
  }

  // ---- LISTA CHAT ----
  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white px-4 pt-3 pb-3 border-b border-gray-100">
        <h2 className="font-bold text-gray-900 text-base text-center">Chat</h2>
      </div>
      <div className="bg-white px-4 pb-3 pt-2 border-b border-gray-100">
        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input type="text" placeholder="Cerca chat..." className="flex-1 bg-transparent text-sm outline-none" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && <div className="text-center py-10 text-gray-500 text-sm">Caricamento...</div>}

        {!loading && conversations.length === 0 && (
          <div className="text-center py-12 px-6">
            <div className="text-5xl mb-3">💬</div>
            <p className="font-semibold text-gray-700">Nessuna conversazione</p>
            <p className="text-xs text-gray-500 mt-1">Vai in un'area cani e inizia a connetterti con altri proprietari!</p>
          </div>
        )}

        {conversations.map((conv, i) => (
          <button key={i} onClick={() => setSelectedConv(conv)}
            className="w-full bg-white flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 text-left">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #FED7AA, #FB923C)' }}>👤</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900">{conv.profile?.username || 'Utente'}</h3>
                <span className="text-[10px] text-gray-400">{formatTime(conv.lastTime)}</span>
              </div>
              <p className="text-xs text-gray-600 truncate mt-0.5">{conv.lastMsg}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
