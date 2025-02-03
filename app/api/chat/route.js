/**
 * @file route.js
 * @description API route handler for chat completions with support for Ollama and Cloudflare AI
 *
 * Streaming Fixes for AI Chat Application
 *
 * Key Improvements:
 * 1. Unified Parser Function: Handles both Cloudflare and Ollama formats
 * 2. Buffer Management: Accumulates partial chunks, ensures complete JSON objects
 * 3. Robust Error Handling: Logs parsing errors without breaking the stream
 * 4. Simplified Stream Transformation: Uses TransformStream for consistent handling
 * 5. Flexible Content Extraction: Accommodates various response formats
 * 6. Server-Sent Events (SSE) Handling: Processes SSE format correctly
 * 7. Proper Encoding and Decoding: Uses TextEncoder and TextDecoder
 *
 * Benefits:
 * - Resolves "Unterminated string in JSON" errors
 * - Ensures correct streaming for both providers
 * - Increases resilience to different response formats and partial data
 * - Improves overall stability and performance of streaming functionality
 *
 * For full details on the streaming improvements, refer to the project documentation.
 */

import { StreamingTextResponse } from "ai"
import { NextResponse } from "next/server"
import { CONFIG } from "@/config/constants"

export const runtime = "nodejs"

function createParser(textDecoder, controller) {
  let buffer = ""

  return function parse(chunk) {
    buffer += textDecoder.decode(chunk, { stream: true })
    const lines = buffer.split("\n")

    // Keep the last partial line in the buffer
    buffer = lines.pop() || ""

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine) continue
      if (trimmedLine === "data: [DONE]") return

      if (trimmedLine.startsWith("data: ")) {
        try {
          const data = JSON.parse(trimmedLine.slice(6))
          // Handle both Cloudflare and Ollama response formats
          const content = data.choices?.[0]?.delta?.content || data.message?.content || data.response || ""
          if (content) {
            controller.enqueue(new TextEncoder().encode(content))
          }
        } catch (error) {
          console.error("Error parsing SSE message:", trimmedLine)
          console.error("Parse error:", error)
        }
      }
    }
  }
}

/**
 * Transform Cloudflare's SSE stream into a format compatible with AI SDK
 * @param {ReadableStream} stream - The original response stream
 * @returns {ReadableStream} - Transformed stream with properly formatted content
 */
function transformCloudflareStream(stream) {
  const textDecoder = new TextDecoder()
  const textEncoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      const reader = stream.getReader()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          // Decode the stream chunk
          const chunk = textDecoder.decode(value, { stream: true })
          // Split into lines and process each SSE event
          const lines = chunk.split("\n").filter((line) => line.trim())

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6) // Remove 'data: ' prefix
              if (data === "[DONE]") continue

              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content || ""
                if (content) {
                  // Encode and enqueue just the content
                  controller.enqueue(textEncoder.encode(content))
                }
              } catch (error) {
                console.error("Error parsing SSE data:", error)
                continue
              }
            }
          }
        }
      } catch (error) {
        console.error("Error processing stream:", error)
        controller.error(error)
      } finally {
        controller.close()
      }
    },
  })
}

/**
 * Perform semantic search to get relevant context
 * @param {string} query - The user's input query
 * @returns {Promise<string>} - The relevant context found from semantic search
 */
async function performSemanticSearch(query) {
  try {
    const response = await fetch(CONFIG.SEMANTIC_SEARCH_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })

    if (!response.ok) {
      throw new Error("Semantic search failed")
    }

    const data = await response.json()
    return data.context || ""
  } catch (error) {
    console.error("Semantic search error:", error)
    return ""
  }
}

export async function POST(req) {
  try {
    const { messages, model, temperature, contextWindow, systemPrompt, stream } = await req.json()
    const provider = process.env.NEXT_PUBLIC_DEFAULT_PROVIDER || "ollama"

    // Perform semantic search if context injection is enabled
    let additionalContext = ""
    if (CONFIG.CONTEXT_INJECTION) {
      const lastUserMessage = messages[messages.length - 1].content
      additionalContext = await performSemanticSearch(lastUserMessage)
    }

    // Prepare the messages array with additional context if available
    const contextEnhancedMessages = additionalContext
      ? [
          ...messages.slice(0, -1),
          { role: "system", content: `Additional context: ${additionalContext}` },
          messages[messages.length - 1],
        ]
      : messages

    // Add system prompt to messages if provided
    const finalMessages = systemPrompt
      ? [{ role: "system", content: systemPrompt }, ...contextEnhancedMessages]
      : contextEnhancedMessages

    if (provider === "ollama") {
      const response = await fetch(`${CONFIG.API_BASE_URL}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: finalMessages,
          stream,
          temperature,
          max_tokens: contextWindow,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Ollama API error: ${errorData}`)
      }

      // Handle streaming response
      if (stream) {
        const transformStream = new TransformStream({
          start(controller) {
            this.parser = createParser(new TextDecoder(), controller)
          },
          transform(chunk, controller) {
            this.parser(chunk)
          },
        })

        return new StreamingTextResponse(response.body.pipeThrough(transformStream))
      }

      // Handle regular response
      const data = await response.json()
      return NextResponse.json({ content: data.message.content })
    } else {
      const cf_url = `https://gateway.ai.cloudflare.com/v1/${process.env.CLOUDFLARE_ACCOUNT_ID}/openai-compatability/workers-ai/v1/chat/completions`
      const cloudflareUrl = `https://gateway.ai.cloudflare.com/v1/1db381e9de1cb51102053d378890beb6/openai-compatability/workers-ai/v1/chat/completions`
      //const cloudflareUrl = `https://gateway.ai.cloudflare.com/v1/1db381e9de1cb51102053d378890beb6/openai-compatability/workers-ai/v1/chat/completions`
      console.log(`Dynamic CF URL = [${cf_url}]`)
      const response = await fetch(cf_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CLOUDFLARE_BEARER_TOKEN}`,
        },
        body: JSON.stringify({
          model,
          messages: finalMessages,
          stream,
          temperature,
          max_tokens: contextWindow,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Cloudflare API error: ${errorData}`)
      }

      // Handle streaming response
      if (stream) {
        const transformStream = new TransformStream({
          start(controller) {
            this.parser = createParser(new TextDecoder(), controller)
          },
          transform(chunk, controller) {
            this.parser(chunk)
          },
        })

        return new StreamingTextResponse(response.body.pipeThrough(transformStream))
      }

      // Handle regular response
      const data = await response.json()
      return NextResponse.json({ content: data.choices[0].message.content })
    }
  } catch (error) {
    console.error("Chat API Error:", error)
    return NextResponse.json(
      {
        error: error.message || "An unexpected error occurred",
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}

