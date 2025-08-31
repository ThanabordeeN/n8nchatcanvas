import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parses a CSS string to extract variable blocks for :root and .dark selectors.
 * @param cssContent The raw CSS content.
 * @returns A string containing the formatted :root and .dark CSS rules.
 */
export function getCssVariableString(cssContent: string): string {
  const rootRegex = /:root\s*\{([^}]+)\}/
  const darkRegex = /\.dark\s*\{([^}]+)\}/

  const rootMatch = cssContent.match(rootRegex)
  const darkMatch = cssContent.match(darkRegex)

  let result = ''

  if (rootMatch?.[1]) {
    result += `:root { ${rootMatch[1].trim()} }`
  }

  if (darkMatch?.[1]) {
    result += ` .dark { ${darkMatch[1].trim()} }`
  }

  return result
}
