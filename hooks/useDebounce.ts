'use client'

import { useEffect, useState } from 'react'

/**
 * Debounce a rapidly-changing value (e.g. a search input).
 * Returns the latest value that has remained stable for `delayMs`.
 * Default delay: 250ms — good for filter/search inputs without hurting perceived responsiveness.
 */
export function useDebounce<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value)
    }, delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}

export default useDebounce