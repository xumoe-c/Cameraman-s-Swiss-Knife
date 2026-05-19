import { create } from 'zustand'
import type { ExposureSolveTarget } from '../domain/exposure'

export interface ExposureStoreState {
  aperture: number
  shutterSeconds: number
  iso: number
  compensationEv: number
  ndPreset: string
  customNdFactor: number
  solveFor: ExposureSolveTarget
  setAperture: (aperture: number) => void
  setShutterSeconds: (shutterSeconds: number) => void
  setIso: (iso: number) => void
  setCompensationEv: (compensationEv: number) => void
  setNdPreset: (ndPreset: string) => void
  setCustomNdFactor: (customNdFactor: number) => void
  setSolveFor: (solveFor: ExposureSolveTarget) => void
}

export const useExposureStore = create<ExposureStoreState>((set) => ({
  aperture: 8,
  shutterSeconds: 2.5,
  iso: 100,
  compensationEv: 0,
  ndPreset: 'ND512000',
  customNdFactor: 1000,
  solveFor: 'shutter',
  setAperture: (aperture) => set({ aperture }),
  setShutterSeconds: (shutterSeconds) => set({ shutterSeconds }),
  setIso: (iso) => set({ iso }),
  setCompensationEv: (compensationEv) => set({ compensationEv }),
  setNdPreset: (ndPreset) => set({ ndPreset }),
  setCustomNdFactor: (customNdFactor) => set({ customNdFactor }),
  setSolveFor: (solveFor) => set({ solveFor }),
}))
