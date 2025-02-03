/**
 * @file constants.js
 * @description Configuration constants for the GenAI Chat application
 */

export const CONFIG = {
  // API Configuration
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:11434",
  CLOUDFLARE_API_URL: process.env.NEXT_PUBLIC_CLOUDFLARE_API_URL || "https://gateway.ai.cloudflare.com/v1",
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_BEARER_TOKEN: process.env.CLOUDFLARE_BEARER_TOKEN,

  // Semantic Search Configuration
  CONTEXT_INJECTION: process.env.NEXT_PUBLIC_CONTEXT_INJECTION === "true",
  SEMANTIC_SEARCH_API: process.env.NEXT_PUBLIC_SEMANTIC_SEARCH_API || "http://localhost:8000/search",

  // Default Models
  DEFAULT_MODELS: [
    "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
    "@cf/meta/llama-2-7b-chat-int8",
    "@cf/mistral/mistral-7b-instruct-v0.1",
    "deepseek-r1:latest",
    "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    "mistral:latest",
  ],

  // Default Settings
  DEFAULT_TEMPERATURE: 0.2,
  DEFAULT_CONTEXT_WINDOW: 4096,
  DEFAULT_SYSTEM_PROMPT: "You are a helpful assistant.",

  // API Provider
  DEFAULT_PROVIDER: process.env.NEXT_PUBLIC_DEFAULT_PROVIDER || "ollama", // 'ollama' or 'cloudflare'
}

