"use client"

import * as React from "react"
import { getMessages, sendMessage, markMessagesAsRead, getConversation } from "@/app/(authenticated)/messages/actions"
import { getInboxThreads } from "./actions"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Send, Loader2, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export function CoachMessagesClient({ 
  initialThreads, 
  currentUserId 
}: { 
  initialThreads: any[], 
  currentUserId: string 
}) {
  const [threads, setThreads] = React.useState(initialThreads)
  const [activeThreadId, setActiveThreadId] = React.useState<string | null>(null)
  const [activeConversationId, setActiveConversationId] = React.useState<string | null>(null)
  
  const [messages, setMessages] = React.useState<any[]>([])
  const [newMessage, setNewMessage] = React.useState("")
  const [sending, setSending] = React.useState(false)
  
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  
  // Update active conversation ID when thread changes
  React.useEffect(() => {
    async function initConversation() {
      if (!activeThreadId) return
      
      const thread = threads.find(t => t.connectionId === activeThreadId)
      if (thread && thread.conversationId) {
        setActiveConversationId(thread.conversationId)
      } else if (activeThreadId) {
        // If thread doesn't have a conversation yet (no messages sent), try to get it
        try {
          const conv = await getConversation(activeThreadId)
          setActiveConversationId(conv.id)
        } catch (e) {
          console.error(e)
        }
      }
    }
    
    initConversation()
  }, [activeThreadId, threads])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Poll Inbox
  const fetchInbox = React.useCallback(async () => {
    try {
      const inbox = await getInboxThreads()
      setThreads(inbox)
    } catch (e) {
      console.error(e)
    }
  }, [])

  // Poll Messages
  const fetchMessages = React.useCallback(async () => {
    if (!activeConversationId) return
    try {
      const msgs = await getMessages(activeConversationId)
      setMessages(msgs)
      await markMessagesAsRead(activeConversationId)
    } catch (e) {
      console.error(e)
    }
  }, [activeConversationId])

  // Inbox polling (every 15s)
  React.useEffect(() => {
    const interval = setInterval(fetchInbox, 15000)
    return () => clearInterval(interval)
  }, [fetchInbox])

  // Thread polling (every 5s)
  React.useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [fetchMessages, activeConversationId])

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || sending || !activeConversationId) return
    setSending(true)
    try {
      await sendMessage(activeConversationId, newMessage)
      setNewMessage("")
      await fetchMessages()
      await fetchInbox() // refresh inbox to update "last message" snippet
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

  const activeThread = threads.find(t => t.connectionId === activeThreadId)

  return (
    <div className="flex-1 flex bg-white rounded-lg shadow-sm border border-[var(--color-neutral-200)] overflow-hidden h-full">
      {/* Inbox List Pane */}
      <div className={cn(
        "w-full md:w-80 border-r border-[var(--color-neutral-200)] flex flex-col h-full bg-[var(--color-neutral-50)] shrink-0",
        activeThreadId ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-[var(--color-neutral-200)] bg-white sticky top-0">
          <h2 className="font-bold text-lg text-[var(--color-neutral-800)]">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="p-4 text-center text-[var(--color-neutral-500)] text-sm">
              No active clients.
            </div>
          ) : (
            threads.map(thread => (
              <button
                key={thread.connectionId}
                onClick={() => setActiveThreadId(thread.connectionId)}
                className={cn(
                  "w-full text-left p-4 border-b border-[var(--color-neutral-100)] hover:bg-[var(--color-neutral-100)] transition-colors flex items-start gap-3 relative",
                  activeThreadId === thread.connectionId ? "bg-white border-l-4 border-l-[var(--color-primary-500)]" : "border-l-4 border-l-transparent"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary-100)] shrink-0 flex items-center justify-center text-[var(--color-primary-700)] font-bold text-sm overflow-hidden">
                  {thread.clientAvatar ? (
                    <img src={thread.clientAvatar} alt={thread.clientName} className="w-full h-full object-cover" />
                  ) : (
                    thread.clientName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={cn(
                      "font-semibold truncate text-sm",
                      thread.unreadCount > 0 ? "text-black" : "text-[var(--color-neutral-700)]"
                    )}>
                      {thread.clientName}
                    </h3>
                    <span className="text-[10px] text-[var(--color-neutral-400)] shrink-0 pl-2">
                      {new Date(thread.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className={cn(
                    "text-xs truncate",
                    thread.unreadCount > 0 ? "font-medium text-black" : "text-[var(--color-neutral-500)]"
                  )}>
                    {thread.lastMessageBody || "Start a conversation"}
                  </p>
                </div>
                {thread.unreadCount > 0 && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-[var(--color-primary-600)] rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                    {thread.unreadCount > 99 ? '99+' : thread.unreadCount}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Thread Pane */}
      <div className={cn(
        "flex-1 flex flex-col bg-white h-full overflow-hidden",
        !activeThreadId ? "hidden md:flex" : "flex"
      )}>
        {!activeThreadId ? (
          <div className="flex-1 flex items-center justify-center text-[var(--color-neutral-400)] bg-[var(--color-neutral-50)]">
            <p>Select a conversation to start messaging</p>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="h-16 border-b border-[var(--color-neutral-200)] flex items-center px-4 gap-3 bg-white shrink-0">
              <button 
                onClick={() => setActiveThreadId(null)}
                className="md:hidden p-2 -ml-2 text-[var(--color-neutral-500)] hover:text-black"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="w-10 h-10 rounded-full bg-[var(--color-primary-100)] shrink-0 flex items-center justify-center text-[var(--color-primary-700)] font-bold text-sm overflow-hidden">
                {activeThread?.clientAvatar ? (
                  <img src={activeThread.clientAvatar} alt={activeThread.clientName} className="w-full h-full object-cover" />
                ) : (
                  activeThread?.clientName.charAt(0).toUpperCase()
                )}
              </div>
              <h2 className="font-bold text-[var(--color-neutral-800)]">{activeThread?.clientName}</h2>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--color-neutral-50)]" role="log" aria-live="polite" aria-atomic="false" aria-relevant="additions">
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
                        className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2 ${
                          isMine 
                            ? 'bg-[var(--color-primary-500)] text-white rounded-br-sm' 
                            : 'bg-white border border-[var(--color-neutral-200)] text-[var(--color-neutral-800)] rounded-bl-sm shadow-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm leading-relaxed break-words">
                          <span className="sr-only">{isMine ? "You: " : `${activeThread?.clientName || "Client"}: `}</span>
                          {msg.body}
                        </p>
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

            {/* Compose Box */}
            <div className="p-4 bg-white border-t border-[var(--color-neutral-200)] shrink-0">
              <div className="flex items-end gap-2">
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
                  disabled={!newMessage.trim() || sending || !activeConversationId}
                  className="rounded-full w-11 h-11 p-0 shrink-0 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white transition-colors"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
