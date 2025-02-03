"use client"

import { useState, useEffect, useRef } from "react"
import { useChat } from "ai/react"
import { CONFIG } from "@/config/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Settings, AlertCircle, User, Bot } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const Message = ({ role, content }) => {
  const isUser = role === "user"
  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? "bg-blue-100" : "bg-green-100"
          }`}
      >
        {isUser ? <User className="h-5 w-5 text-blue-600" /> : <Bot className="h-5 w-5 text-green-600" />}
      </div>
      <div className={`flex-1 ${isUser ? "text-right" : "text-left"}`}>
        <p className="font-semibold mb-1 text-sm text-gray-600">{isUser ? "You" : "Assistant"}</p>
        <div className={`prose prose-sm max-w-none ${isUser ? "ml-auto" : "mr-auto"}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "")
                const language = match ? match[1] : ""
                if (inline) {
                  return (
                    <code className="px-1 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-sm" {...props}>
                      {children}
                    </code>
                  )
                }
                return (
                  <div className="relative">
                    {language && <div className="absolute right-2 top-2 text-xs text-gray-400">{language}</div>}
                    <pre className="!mt-0 !mb-4 overflow-x-auto rounded-lg bg-gray-100 dark:bg-gray-800 p-4">
                      <code className="text-sm" {...props}>
                        {children}
                      </code>
                    </pre>
                  </div>
                )
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  //const [models, setModels] = useState(CONFIG.DEFAULT_MODELS)
  //const [model, setModel] = useState(CONFIG.DEFAULT_MODELS[0])
  const [models, setModels] = useState([])
  const [model, setModel] = useState("")
  const [modelsLoading, setModelsLoading] = useState(true)
  const [modelsError, setModelsError] = useState(null)
  const [temperature, setTemperature] = useState(CONFIG.DEFAULT_TEMPERATURE)
  const [contextWindow, setContextWindow] = useState(CONFIG.DEFAULT_CONTEXT_WINDOW)
  const [isStreaming, setIsStreaming] = useState(true)
  const [systemPrompt, setSystemPrompt] = useState(CONFIG.DEFAULT_SYSTEM_PROMPT)
  const chatContainerRef = useRef(null)

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch("/api/models")
        if (!response.ok) {
          throw new Error("Failed to fetch models")
        }
        const availableModels = await response.json()
        setModels(availableModels)
        // Set the first model as default if we have models and no model is selected
        if (availableModels.length > 0 && !model) {
          setModel(availableModels[0])
        }
        setModelsLoading(false)
      } catch (error) {
        console.error("Error fetching models:", error)
        setModelsError(error.message)
        setModelsLoading(false)
        // Fallback to default models if API fails
        setModels(CONFIG.DEFAULT_MODELS)
        if (!model) {
          setModel(CONFIG.DEFAULT_MODELS[0])
        }
      }
    }

    fetchModels()
  }, [model]) // Include model in dependencies to prevent unnecessary re-fetches when it changes

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    initialMessages: [],
    body: {
      model,
      temperature,
      contextWindow,
      systemPrompt,
      stream: isStreaming,
    },
    onResponse: (response) => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
      }
    },
    onFinish: () => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
      }
    },
  })

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatContainerRef])

  const handleFormSubmit = (e) => {
    e.preventDefault()
    handleSubmit(e)
  }

  return (
    <div className="fixed inset-0 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-84 flex flex-col flex-shrink-0 border-r border-gray-200 bg-white">
        <div className="flex-shrink-0 h-20 px-4 border-b border-gray-200 flex items-center p-2">
          <Settings className="h-5 w-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Model</label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Temperature</label>
            <Slider value={[temperature]} onValueChange={([value]) => setTemperature(value)} max={2} step={0.1} />
            <span className="text-sm text-gray-500">{temperature}</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Context Window</label>
            <Slider
              value={[contextWindow]}
              onValueChange={([value]) => setContextWindow(value)}
              max={8192}
              step={512}
              min={512}
            />
            <span className="text-sm text-gray-500">{contextWindow}</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Stream Responses</label>
            <Switch checked={isStreaming} onCheckedChange={setIsStreaming} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">System Prompt</label>
            <Textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={3} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* This wrapper is key for proper scrolling */}
        <div className="flex-1 relative z-0 flex overflow-hidden">
          <main className="flex-1 flex overflow-hidden">
            {/* Content container with proper scroll */}
            <div className="flex-1 flex flex-col relative">
              {/* Fixed Header */}


              <div className="flex-shrink-0 h-20 px-4 border-b border-gray-200 flex items-center p-2">
                
                <h2 className="text-lg font-semibold text-gray-900">GenAI Chat Assistant</h2>
              </div>

              {/* Scrollable messages area */}
              <div className="relative mb-[62px] max-h-[calc(100vh-120px)] overflow-auto">
                {error && (
                  <Alert variant="destructive" className="m-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error.message}</AlertDescription>
                  </Alert>
                )}

                <div ref={chatContainerRef} className="p-4 space-y-4">
                  {messages.map((message, index) => (
                    <Card key={index} className="shadow-sm">
                      <CardContent className="p-4">
                        <Message role={message.role} content={message.content} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Fixed Input at bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200">
                <div className="px-4 py-3">
                  <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={input}
                      onChange={handleInputChange}
                      placeholder={isLoading ? "Waiting for response..." : "Type your message..."}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={isLoading}>
                      Send
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )





}