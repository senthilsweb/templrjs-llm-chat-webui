import { NextResponse } from "next/server"
import { CONFIG } from "@/config/constants"

export async function GET() {
  const provider = process.env.NEXT_PUBLIC_DEFAULT_PROVIDER || "ollama"
  console.log(`Provider=[${provider}]`)
  try {
    if (provider === "ollama") {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/tags`)
      if (!response.ok) throw new Error("Failed to fetch models from Ollama")
      const data = await response.json()
      const models = data.models.map((model) => model.name)
      console.log(JSON.stringify(models))
      return NextResponse.json(models)
    } else {
      // For Cloudflare, return the default models since they don't have a list models endpoint
      return NextResponse.json(CONFIG.DEFAULT_MODELS)
    }
  } catch (error) {
    console.error("Error fetching models:", error)
    // Return default models if API call fails
    return NextResponse.json(CONFIG.DEFAULT_MODELS)
  }
}

