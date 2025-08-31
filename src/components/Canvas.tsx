interface CanvasProps {
  htmlContent: string | null
}

export function Canvas({ htmlContent }: CanvasProps) {
  if (!htmlContent) return null

  return (
    <div className="flex-1 flex flex-col backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-l border-slate-200/50 dark:border-slate-700/50">
      <div className="px-8 py-6 backdrop-blur-sm bg-white/60 dark:bg-slate-900/60 border-b border-slate-200/50 dark:border-slate-700/50">
        <h2 className="text-xl font-light text-slate-800 dark:text-slate-200 tracking-tight">Canvas</h2>
      </div>
      <div className="flex-1 p-8 overflow-auto">
        <div
          className="w-full h-full"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          style={{
            // Provide essential CSS variables for Shadcn UI / Tailwind content
            '--background': 'hsl(var(--background))',
            '--foreground': 'hsl(var(--foreground))',
            '--card': 'hsl(var(--card))',
            '--card-foreground': 'hsl(var(--card-foreground))',
            '--primary': 'hsl(var(--primary))',
            '--primary-foreground': 'hsl(var(--primary-foreground))',
            '--secondary': 'hsl(var(--secondary))',
            '--muted': 'hsl(var(--muted))',
            '--muted-foreground': 'hsl(var(--muted-foreground))',
            '--border': 'hsl(var(--border))',
            '--input': 'hsl(var(--input))',
            '--ring': 'hsl(var(--ring))',
            '--radius': 'var(--radius)',
          } as React.CSSProperties}
        />
      </div>
    </div>
  )
}
