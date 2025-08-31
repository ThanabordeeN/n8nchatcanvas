import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Bot, User, Plus, Trash2, ChevronLeft, ChevronRight, MessageSquare, Clock, Check, Volume2, VolumeX } from 'lucide-react'
import { Canvas } from './Canvas'
import TypingIndicator from './TypingIndicator'

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
  status?: 'sending' | 'sent' | 'delivered'
}

interface Session {
  id: string
  created_at: string
  last_activity: string
  message_count: number
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ChatProps {}

interface ApiMessage {
  id: string;
  content: string;
  is_user: number;
  created_at: string;
  html_content?: string;
}

const MessageStatus = ({ status }: { status: Message['status'] }) => {
  if (status === 'sending') {
    return <Clock size={12} className="opacity-80" />;
  }
  if (status === 'delivered') {
    return <Check size={12} className="opacity-80" />;
  }
  return null;
};

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize Audio object
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3')
  }, [])

  // Play sound on new bot message
  useEffect(() => {
    if (!isMuted && messages.length > 0 && !messages[messages.length - 1].isUser) {
      audioRef.current?.play().catch(e => console.error("Error playing sound:", e));
    }
  }, [messages, isMuted])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [inputValue])

  // Generate session ID on mount
  useEffect(() => {
    const newSessionId = 'sess-' + Math.random().toString(36).substring(2, 10)
    setSessionId(newSessionId)
    loadSessions()
  }, [])

  // Load chat history when session changes
  useEffect(() => {
    if (sessionId) {
      loadChatHistory()
    }
  }, [sessionId, loadChatHistory])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadChatHistory = useCallback(async () => {
    if (!sessionId) return
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/messages`)
      if (response.ok) {
        const historyMessages: ApiMessage[] = await response.json()
        const formattedMessages: Message[] = historyMessages.map((msg) => ({
          id: msg.id,
          content: msg.content,
          isUser: msg.is_user === 1,
          timestamp: new Date(msg.created_at)
        }))
        setMessages(formattedMessages)

        // Load HTML content if exists
        const latestHtmlMessage = historyMessages
          .filter((msg) => msg.html_content)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

        if (latestHtmlMessage) {
          setHtmlContent(latestHtmlMessage.html_content)
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
    }
  }, [sessionId])

  const loadSessions = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/sessions')
      if (response.ok) {
        const sessionsData = await response.json()
        setSessions(sessionsData)
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }

  const switchSession = (newSessionId: string) => {
    setSessionId(newSessionId)
  }

  const createNewSession = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/sessions', {
        method: 'POST'
      })
      if (response.ok) {
        const { sessionId: newSessionId } = await response.json()
        setSessionId(newSessionId)
        loadSessions()
        setMessages([])
        setHtmlContent(null)
      }
    } catch (error) {
      console.error('Error creating new session:', error)
    }
  }

  const deleteSession = async (sessionIdToDelete: string) => {
    if (sessionIdToDelete === sessionId) {
      alert('Cannot delete the current active session')
      return
    }

    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionIdToDelete}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        loadSessions()
      }
    } catch (error) {
      console.error('Error deleting session:', error)
    }
  }

  const addMessage = (content: string, isUser: boolean, status?: Message['status']) => {
    const newMessage: Message = {
      id: Math.random().toString(36).substring(2, 10),
      content,
      isUser,
      timestamp: new Date(),
      status: isUser ? status : undefined,
    }
    setMessages(prev => [...prev, newMessage])
    return newMessage.id
  }

  const updateCanvas = (html: string | null) => {
    setHtmlContent(html)
  }

  const sendMessage = async () => {
    const message = inputValue.trim()
    if (!message || isLoading) return

    // Clear input and disable
    setInputValue('')
    setIsLoading(true)

    // Add user message with 'sending' status
    const tempId = addMessage(message, true, 'sending')

    try {
      const payload = {
        chatInput: message,
        sessionId: sessionId
      }

      // Call our backend API instead of n8n directly
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()
      console.log('Backend response:', result)

      // Process response
      let botResponse = ''
      let htmlContentResponse = null

      if (result.output) {
        botResponse = result.output
        htmlContentResponse = result.html_code
      } else if (result.error) {
        botResponse = result.output || result.error
      }

      // Ensure botResponse is a string
      if (typeof botResponse === 'object' && botResponse !== null) {
        botResponse = JSON.stringify(botResponse, null, 2)
      } else if (botResponse === null || botResponse === undefined) {
        botResponse = 'ขออภัย ฉันไม่สามารถตอบคำถามนี้ได้ในขณะนี้'
      }

      // Update user message status to 'delivered'
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'delivered' } : m))

      // Add bot response
      if (htmlContentResponse && typeof htmlContentResponse === 'string') {
        updateCanvas(htmlContentResponse)
        addMessage(botResponse, false)
      } else {
        addMessage(botResponse, false)
        updateCanvas(null)
      }

    } catch (error) {
      console.error('Error:', error)
      addMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง', false)
      updateCanvas(null)
    } finally {
      setIsLoading(false)
      textareaRef.current?.focus()
      // Reload sessions to update message counts
      loadSessions()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Sidebar */}
      <div className={`flex flex-col transition-all duration-500 ease-in-out ${
        sidebarCollapsed ? 'w-16' : 'w-80'
      } backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-r border-slate-200/50 dark:border-slate-700/50`}>
        
        {/* Sidebar Header */}
        <div className="p-6 flex items-center justify-between">
          {!sidebarCollapsed && (
            <h2 className="text-lg font-light text-slate-700 dark:text-slate-300 tracking-wide">Sessions</h2>
          )}
          <Button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors duration-200"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="px-6 pb-4">
          <Button
            onClick={createNewSession}
            className={`w-full flex items-center justify-center space-x-3 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-xl py-3 transition-all duration-200 shadow-sm hover:shadow-md ${
              sidebarCollapsed ? 'px-3' : ''
            }`}
            size="sm"
          >
            <Plus size={18} />
            {!sidebarCollapsed && <span className="font-medium">New Chat</span>}
          </Button>
        </div>

        {/* Sessions List */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-sm ${
                  session.id === sessionId 
                    ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-md' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                } ${sidebarCollapsed ? 'justify-center px-3' : ''}`}
                onClick={() => switchSession(session.id)}
                title={sidebarCollapsed ? `Session ${session.id.slice(-6)}` : undefined}
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg ${
                    session.id === sessionId 
                      ? 'bg-white/20' 
                      : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                  }`}>
                    <MessageSquare size={16} className={session.id === sessionId ? 'text-white' : 'text-slate-600 dark:text-slate-400'} />
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        session.id === sessionId ? 'text-white' : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {session.id === sessionId ? 'Current' : `Session ${session.id.slice(-6)}`}
                      </p>
                      <p className={`text-xs mt-1 ${
                        session.id === sessionId ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {session.message_count} messages
                      </p>
                    </div>
                  )}
                </div>
                {!sidebarCollapsed && session.id !== sessionId && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteSession(session.id)
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className={`flex flex-col flex-1 ${htmlContent ? 'max-w-1/2' : 'flex-1'}`}>
        {/* Header */}
        <div className="px-8 py-6 backdrop-blur-sm bg-white/60 dark:bg-slate-900/60 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-light text-slate-800 dark:text-slate-200 tracking-tight">Chat</h1>
              {sessionId && (
                <p className="text-sm mt-2 text-slate-500 dark:text-slate-400 font-light">
                  Session: {sessionId.slice(-6)}
                </p>
              )}
            </div>
            <Button
              onClick={() => setIsMuted(!isMuted)}
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors duration-200"
              title={isMuted ? "Unmute Notifications" : "Mute Notifications"}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-8 py-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {messages.map((message, index) => {
              const prevMessage = messages[index - 1]
              const nextMessage = messages[index + 1]

              const isFirstInGroup = !prevMessage || prevMessage.isUser !== message.isUser
              const isLastInGroup = !nextMessage || nextMessage.isUser !== message.isUser

              let bubbleClass = ''
              if (message.isUser) {
                if (isFirstInGroup && isLastInGroup) bubbleClass = 'rounded-2xl'
                else if (isFirstInGroup) bubbleClass = 'rounded-t-2xl rounded-l-2xl'
                else if (isLastInGroup) bubbleClass = 'rounded-b-2xl rounded-l-2xl'
                else bubbleClass = 'rounded-l-2xl'
              } else {
                if (isFirstInGroup && isLastInGroup) bubbleClass = 'rounded-2xl'
                else if (isFirstInGroup) bubbleClass = 'rounded-t-2xl rounded-r-2xl'
                else if (isLastInGroup) bubbleClass = 'rounded-b-2xl rounded-r-2xl'
                else bubbleClass = 'rounded-r-2xl'
              }

              const showAvatar = isLastInGroup;

              return (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-4' : 'mt-1'} animate-accordion-down`}
                >
                  <div className={`flex items-end space-x-4 max-w-[85%] ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm transition-opacity duration-200 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                      {message.isUser ? (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-600">
                          <User size={18} className="text-white" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600">
                          <Bot size={18} className="text-slate-600 dark:text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className={`${bubbleClass} px-6 py-4 backdrop-blur-sm ${
                      message.isUser
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md'
                        : 'bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50 shadow-md'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap font-light">{message.content}</p>
                      {message.isUser && message.status && (
                        <div className="flex items-center justify-end mt-2 text-xs text-white/70">
                          <MessageStatus status={message.status} />
                          <span className="ml-1">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-4 max-w-[85%]">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600">
                    <Bot size={18} className="text-slate-600 dark:text-slate-300" />
                  </div>
                  <div className="rounded-2xl px-6 py-4 shadow-sm backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50">
                    <TypingIndicator />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="px-8 py-6 backdrop-blur-sm bg-white/60 dark:bg-slate-900/60 border-t border-slate-200/50 dark:border-slate-700/50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-4">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message here..."
                  className="w-full px-6 py-3 min-h-[50px] max-h-48 resize-none rounded-xl border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm focus:shadow-md transition-all duration-200 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  disabled={isLoading}
                  rows={1}
                />
              </div>
              <Button
                onClick={sendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="h-12 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl shadow-sm hover:shadow-md transition-transform duration-200 active:scale-95 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Section - Only show when there's HTML content */}
      <Canvas htmlContent={htmlContent} />
    </div>
  )
}
