export type ExposureSolveTarget = 'shutter' | 'aperture' | 'iso'

export interface NdPreset {
  label: string
  stops: number
}

export interface ExposurePlanInput {
  aperture: number
  shutterSeconds: number
  iso: number
  compensationEv: number
  ndPreset: string
  solveFor: ExposureSolveTarget
  customNdFactor?: number
}

export interface ExposurePlan {
  baseEvIso: number
  targetEvIso: number
  ndStops: number
  ndMultiplier: number
  compensatedShutterSeconds: number
  ndAdjustedShutterSeconds: number
  solvedShutterSeconds: number
  solvedAperture: number
  solvedIso: number
  isBulbMode: boolean
}

export const ND_PRESETS: Record<string, NdPreset> = {
  ND2: { label: 'ND2', stops: 1 },
  ND4: { label: 'ND4', stops: 2 },
  ND8: { label: 'ND8', stops: 3 },
  ND16: { label: 'ND16', stops: 4 },
  ND32: { label: 'ND32', stops: 5 },
  ND64: { label: 'ND64', stops: 6 },
  ND128: { label: 'ND128', stops: 7 },
  ND256: { label: 'ND256', stops: 8 },
  ND512: { label: 'ND512', stops: 9 },
  ND1000: { label: 'ND1000', stops: 10 },
  ND2000: { label: 'ND2000', stops: 11 },
  ND4000: { label: 'ND4000', stops: 12 },
  ND8000: { label: 'ND8000', stops: 13 },
  ND16000: { label: 'ND16000', stops: 14 },
  ND32000: { label: 'ND32000', stops: 15 },
  ND64000: { label: 'ND64000', stops: 16 },
  ND128000: { label: 'ND128000', stops: 17 },
  ND256000: { label: 'ND256000', stops: 18 },
  ND512000: { label: 'ND512000', stops: 19 },
  ND1000K: { label: 'ND1000K', stops: 20 },
}

export const ND_PRESET_OPTIONS = Object.entries(ND_PRESETS).map(([value, preset]) => ({
  value,
  label: preset.label,
}))

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function computeEv100(aperture: number, shutterSeconds: number): number {
  return Math.log2((aperture * aperture) / shutterSeconds)
}

export function computeEvIso(aperture: number, shutterSeconds: number, iso: number): number {
  return Math.log2((100 * aperture * aperture) / (shutterSeconds * iso))
}

export function computeShutterFromEvIso(evIso: number, aperture: number, iso: number): number {
  return (100 * aperture * aperture) / (Math.pow(2, evIso) * iso)
}

export function computeApertureFromEvIso(evIso: number, shutterSeconds: number, iso: number): number {
  return Math.sqrt((Math.pow(2, evIso) * shutterSeconds * iso) / 100)
}

export function computeIsoFromEvIso(evIso: number, aperture: number, shutterSeconds: number): number {
  return (100 * aperture * aperture) / (shutterSeconds * Math.pow(2, evIso))
}

export function resolveNdStops(ndPreset: string, customNdFactor?: number): number {
  const preset = ND_PRESETS[ndPreset]
  if (preset) {
    return preset.stops
  }

  if (customNdFactor && customNdFactor > 0) {
    return Math.log2(customNdFactor)
  }

  return 0
}

export function computeNdMultiplier(ndStops: number): number {
  return Math.pow(2, ndStops)
}

export function computeExposureTolerance(value: number, percent: number): [number, number] {
  const ratio = clamp(percent, 0, 100) / 100
  return [value * (1 - ratio), value * (1 + ratio)]
}

export function isBulbMode(shutterSeconds: number): boolean {
  return shutterSeconds >= 4
}

export function formatExposureSeconds(seconds: number): string {
  if (!isFinite(seconds)) {
    return '∞'
  }

  if (seconds < 1) {
    const denominator = Math.round(1 / seconds)
    return `1/${denominator}s`
  }

  return `${seconds.toFixed(1)}s`
}

export function computeExposurePlan(input: ExposurePlanInput): ExposurePlan {
  const baseEvIso = computeEvIso(input.aperture, input.shutterSeconds, input.iso)
  const targetEvIso = baseEvIso - input.compensationEv
  const ndStops = resolveNdStops(input.ndPreset, input.customNdFactor)
  const ndMultiplier = computeNdMultiplier(ndStops)
  const compensatedShutterSeconds = computeShutterFromEvIso(targetEvIso, input.aperture, input.iso)
  const ndAdjustedShutterSeconds = compensatedShutterSeconds * ndMultiplier

  return {
    baseEvIso,
    targetEvIso,
    ndStops,
    ndMultiplier,
    compensatedShutterSeconds,
    ndAdjustedShutterSeconds,
    solvedShutterSeconds: computeShutterFromEvIso(targetEvIso, input.aperture, input.iso),
    solvedAperture: computeApertureFromEvIso(targetEvIso, input.shutterSeconds, input.iso),
    solvedIso: computeIsoFromEvIso(targetEvIso, input.aperture, input.shutterSeconds),
    isBulbMode: isBulbMode(ndAdjustedShutterSeconds),
  }
}
