# templrjs-llm-chat-webui

templrjs-llm-chat-webui is a simple LLM chat web interface built with Next.js that connects to both local Ollama and Cloudflare AI models. This application provides an intuitive interface for interacting with various AI models through a generic chat completions API, featuring customizable settings and real-time streaming responses.

## Technology Stack

- **Frontend**: Next.js 14, React 18
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **AI Integration**: AI SDK (Vercel)
- **Markdown Rendering**: react-markdown with remark-gfm
- **Icons**: Lucide React


## Getting Started

### Pre-requisites

1. Nodejs Version 20.x
2. Bun (latest version)
3. A Cloudflare account with access to the AI gateway
4. (Optional) Ollama set up locally for additional model support


### Environment Setup

1. Clone the repository:

```shellscript
git clone https://github.com/senthilsweb/templrjs-llm-chat-webui.git
cd templrjs-llm-chat-webui
```


2. Install dependencies:

```shellscript
bun install
```


3. Create a `.env.local` file in the root directory with the following content:


```plaintext
NEXT_PUBLIC_API_BASE_URL=http://localhost:11434
NEXT_PUBLIC_CLOUDFLARE_API_URL=https://gateway.ai.cloudflare.com/v1
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_BEARER_TOKEN=your_bearer_token
NEXT_PUBLIC_DEFAULT_PROVIDER=cloudflare
NEXT_PUBLIC_CONTEXT_INJECTION=false
NEXT_PUBLIC_SEMANTIC_SEARCH_API=http://localhost:8000/search
```

Replace `your_account_id` and `your_bearer_token` with your Cloudflare credentials.

If you have local ollama server then replace `cloudflare` with `ollama`


### Development Environment

1. Start the development server:

```shellscript
bun dev
```


2. Open `http://localhost:3000` in your browser to view the application.


## Deployment

This project can be deployed on Vercel or any platform supporting Next.js applications.

1. Push your code to GitHub
2. Set up deployment on your preferred platform
3. Configure environment variables
4. Deploy the application

## Features

- Dual integration with Cloudflare AI and local Ollama models
- Real-time streaming responses
- Customizable chat parameters:
- Temperature control
- Context window size
- System prompt configuration
- Markdown support in chat messages
- Responsive design
- Dark mode support


### Advanced Streaming Implementation

The application features a sophisticated streaming system with the following improvements:

1. **Unified Parser Function**

    1. Single parser handling both Cloudflare and Ollama streaming formats
    2. Enhanced code maintainability and reduced duplication


2. **Robust Buffer Management**

    1. Smart buffer system for partial data chunks
    2. Prevention of "Unterminated string in JSON" errors
    3. Complete JSON object parsing guarantee

3. **Error Handling & Stability**

    1. Comprehensive try-catch implementation for JSON parsing
    2. Non-breaking error logging during streaming
    3. Enhanced streaming stability

4. **Optimized Stream Processing**

    1. TransformStream implementation for both providers
    2. Efficient raw API response transformation
    3. Seamless content delivery

5. **Advanced Content Handling**

    1. Multi-format content extraction support
    2. Compatible with both Cloudflare and Ollama responses
    3. Flexible response structure adaptation

6. **SSE (Server-Sent Events) Support**

    1. Proper handling of "data: " prefixed lines
    2. Accurate stream end detection ("[DONE]" message)
    3. Reliable event stream processing

7. **Text Processing**

    1. Integrated TextEncoder and TextDecoder usage
    2. Consistent streaming data interpretation
    3. Reliable character encoding handling





