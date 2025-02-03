import "./globals.css"

export const metadata = {
  title: "GenAI Chat Assistant",
  description: "A generic AI chat assistant built with Next.js",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

