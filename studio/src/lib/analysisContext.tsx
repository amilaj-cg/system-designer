import { createContext, useContext } from 'react'
import type { NodeAnalysis, SystemAnalysis } from '../capacity'

export const AnalysisContext = createContext<SystemAnalysis | null>(null)

export function useAnalysis(): SystemAnalysis | null {
  return useContext(AnalysisContext)
}

export function useNodeAnalysis(id: string): NodeAnalysis | undefined {
  const a = useContext(AnalysisContext)
  return a?.nodes.find((n) => n.id === id)
}
