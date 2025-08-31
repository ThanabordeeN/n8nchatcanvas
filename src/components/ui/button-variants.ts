import { cva } from "class-variance-authority"

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm hover:shadow-md rounded-lg",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 shadow-sm hover:shadow-md rounded-lg",
        outline:
          "border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-sm rounded-lg",
        secondary:
          "bg-slate-100 text-slate-900 hover:bg-slate-200 shadow-sm rounded-lg",
        ghost: "hover:bg-slate-100 hover:text-slate-900 rounded-lg",
        link: "text-slate-600 underline-offset-4 hover:underline hover:text-slate-800",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
