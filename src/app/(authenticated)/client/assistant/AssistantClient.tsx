"use client"

import React, { useState, useEffect, useRef, useTransition } from "react"
import { getOrCreateAIConversation, sendMessageToAssistant } from "./actions"

type AIMessage = {
  id: string
  sender: "CLIENT" | "ASSISTANT"
  body: string
  createdAt: Date
}

type AIConversation = {
  id: string
  messages: AIMessage[]
}

export function AssistantClient({ initialConversation }: { initialConversation: AIConversation }) {
  const [messages, setMessages] = useState<AIMessage[]>(initialConversation.messages)
  const [inputValue, setInputValue] = useState("")
  const [isPending, startTransition] = useTransition()
  
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom on load or new message
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    const trimmed = inputValue.trim()
    if (!trimmed || isPending) return

    setInputValue("")

    // Optimistically add client message
    const tempClientMsg: AIMessage = {
      id: "temp-" + Date.now(),
      sender: "CLIENT",
      body: trimmed,
      createdAt: new Date()
    }
    setMessages(prev => [...prev, tempClientMsg])

    startTransition(async () => {
      const result = await sendMessageToAssistant(trimmed)
      
      if (result.success && result.assistantMessage && result.clientMessage) {
        setMessages(prev => {
          // Replace temp message with actual, and append assistant message
          const withoutTemp = prev.filter(m => m.id !== tempClientMsg.id)
          return [...withoutTemp, result.clientMessage, result.assistantMessage]
        })
      } else {
        alert(result.error || "Failed to send message")
        // Remove temp message on failure
        setMessages(prev => prev.filter(m => m.id !== tempClientMsg.id))
        setInputValue(trimmed) // restore input
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[800px] max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-[var(--color-neutral-200)] overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center text-[var(--color-primary-600)] shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/></svg>
          </div>
          <div>
            <h2 className="font-bold text-[var(--text-h4-size)] text-[var(--color-neutral-800)]">Nutrition Assistant</h2>
            <p className="text-xs text-[var(--color-neutral-500)]">AI-powered guidance based on your daily food log</p>
          </div>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--color-neutral-500)] space-y-4">
            <div className="w-16 h-16 rounded-full bg-[var(--color-neutral-100)] flex items-center justify-center text-[var(--color-neutral-400)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/></svg>
            </div>
            <div>
              <p className="font-medium text-[var(--color-neutral-700)] mb-1">Welcome to your Nutrition Assistant!</p>
              <p className="text-sm">I can help answer questions about your food log, macros, and diet plan. How can I help you today?</p>
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === "CLIENT" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.sender === "CLIENT" 
                  ? "bg-[var(--color-primary-600)] text-white rounded-br-sm" 
                  : "bg-[var(--color-neutral-100)] text-[var(--color-neutral-800)] rounded-bl-sm"
              }`}>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.body}</div>
              </div>
            </div>
          ))
        )}
        
        {isPending && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-[var(--color-neutral-100)] text-[var(--color-neutral-800)] rounded-bl-sm">
              <div className="flex space-x-1.5 items-center h-5">
                <div className="w-2 h-2 bg-[var(--color-neutral-400)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 bg-[var(--color-neutral-400)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 bg-[var(--color-neutral-400)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[var(--color-neutral-200)] bg-white shrink-0">
        <form onSubmit={handleSend} className="relative flex items-end gap-2">
          <textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your nutrition..."
            className="w-full bg-[var(--color-neutral-50)] border border-[var(--color-neutral-200)] rounded-xl px-4 py-3 pr-12 resize-none focus:outline-none focus:border-[var(--color-primary-500)] min-h-[52px] max-h-[120px]"
            rows={1}
            disabled={isPending}
            style={{ 
              height: "auto",
              // Basic auto-resize based on scrollHeight would need a ref, keeping it simple
            }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isPending}
            className="absolute right-2 bottom-2 w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--color-primary-600)] text-white disabled:bg-[var(--color-neutral-300)] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
        <p className="text-[11px] text-center text-[var(--color-neutral-400)] mt-2">
          The Nutrition Assistant provides informational guidance only. Always consult your coach or a doctor for medical advice.
        </p>
      </div>
    </div>
  )
}
