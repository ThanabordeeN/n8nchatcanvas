import { useEffect, useState } from 'react'
import { getCssVariableString } from '@/lib/utils'
import cssContent from '../index.css?raw'

interface CanvasProps {
  htmlContent: string | null
}

const cssVariableString = getCssVariableString(cssContent)

// This function will be responsible for creating the full HTML document for the iframe
// It will inject CSS variables and the Tailwind CDN script.
const createIframeContent = (htmlContent: string, theme: 'light' | 'dark'): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          ${cssVariableString}
          body {
            background-color: hsl(var(--background));
            color: hsl(var(--foreground));
            padding: 1.5rem; /* Add some padding for better visuals */
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        </style>
      </head>
      <body class="${theme}">
        ${htmlContent}
      </body>
    </html>
  `
}

export function Canvas({ htmlContent }: CanvasProps) {
  const [iframeContent, setIframeContent] = useState('')
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Detect theme from parent document
    const isDark = document.documentElement.classList.contains('dark')
    setCurrentTheme(isDark ? 'dark' : 'light')

    // Optional: Add a MutationObserver to watch for theme changes on the root element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'class') {
          const newIsDark = (mutation.target as HTMLElement).classList.contains('dark')
          setCurrentTheme(newIsDark ? 'dark' : 'light')
        }
      })
    })
    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (htmlContent) {
      const fullHtml = createIframeContent(htmlContent, currentTheme)
      setIframeContent(fullHtml)
    }
  }, [htmlContent, currentTheme])

  if (!htmlContent) return null

  return (
    <div className="flex-1 flex flex-col backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-l border-slate-200/50 dark:border-slate-700/50">
      <div className="px-8 py-6 backdrop-blur-sm bg-white/60 dark:bg-slate-900/60 border-b border-slate-200/50 dark:border-slate-700/50">
        <h2 className="text-xl font-light text-slate-800 dark:text-slate-200 tracking-tight">Canvas</h2>
      </div>
      <div className="flex-1 p-0 overflow-hidden">
        <iframe
          srcDoc={iframeContent}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          title="Canvas"
        />
      </div>
    </div>
  )
}
