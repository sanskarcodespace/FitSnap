"use client"

import * as React from "react"
import { getMessages, sendMessage, markMessagesAsRead } from "@/app/(authenticated)/messages/actions"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Send, Loader2 } from "lucide-react"

export function ClientMessages({ 
  conversationId, 
  currentUserId 
}: { 
  conversationId: string, 
  currentUserId: string 
}) {
  const [messages, setMessages] = React.useState<any[]>([])
  const [newMessage, setNewMessage] = React.useState("")
  const [sending, setSending] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchMessages = React.useCallback(async () => {
    try {
      const msgs = await getMessages(conversationId)
      setMessages(msgs)
      await markMessagesAsRead(conversationId)
    } catch (e) {
      console.error(e)
    }
  }, [conversationId])

  React.useEffect(() => {
    fetchMessages()
    // Poll every 5 seconds
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return
    setSending(true)
    try {
      await sendMessage(conversationId, newMessage)
      setNewMessage("")
      await fetchMessages()
    } catch (e) {
      console.error(e)
      alert("Failed to send message.")
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--color-neutral-50)] overflow-hidden">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-10 text-[var(--color-neutral-400)] text-sm">
            No messages yet. Send a message to start the conversation!
          </div>
        )}
        
        {messages.map((msg, i) => {
          const isMine = msg.senderId === currentUserId
          const showDate = i === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[i-1].createdAt).toDateString()
          
          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="text-[10px] font-medium text-[var(--color-neutral-400)] bg-[var(--color-neutral-100)] px-2 py-1 rounded-full uppercase tracking-wider">
                    {new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}
              <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    isMine 
                      ? 'bg-[var(--color-primary-500)] text-white rounded-br-sm' 
                      : 'bg-white border border-[var(--color-neutral-200)] text-[var(--color-neutral-800)] rounded-bl-sm shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed break-words">{msg.body}</p>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-[var(--color-neutral-400)]">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </React.Fragment>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Compose Area */}
      <div className="p-3 bg-white border-t border-[var(--color-neutral-200)] pb-safe">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <Textarea 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[44px] max-h-32 resize-none rounded-2xl py-3 px-4 border-[var(--color-neutral-300)] focus-visible:ring-[var(--color-primary-500)]"
            rows={1}
          />
          <Button 
            onClick={handleSend} 
            disabled={!newMessage.trim() || sending}
            className="rounded-full w-11 h-11 p-0 shrink-0 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white transition-colors"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
