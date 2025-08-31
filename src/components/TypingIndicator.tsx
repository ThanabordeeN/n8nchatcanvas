import React from 'react'

const TypingIndicator = () => {
  return (
    <div className="flex items-center space-x-2">
      <style>
        {`
          @keyframes wave {
            0%, 60%, 100% {
              transform: initial;
            }
            30% {
              transform: translateY(-8px);
            }
          }
          .wave-dot {
            animation: wave 1.3s ease-in-out infinite;
          }
        `}
      </style>
      <span className="wave-dot inline-block w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" style={{ animationDelay: '0.0s' }} />
      <span className="wave-dot inline-block w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" style={{ animationDelay: '0.2s' }} />
      <span className="wave-dot inline-block w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" style={{ animationDelay: '0.4s' }} />
    </div>
  )
}

export default TypingIndicator
