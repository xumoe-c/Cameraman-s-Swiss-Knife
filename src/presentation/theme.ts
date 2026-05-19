// Baseline typography tokens tuned for Android mobile
export const baseFontSize = '14px'
export const baseLineHeight = '20px'
export const smallFontSize = '12px'
export const smallLineHeight = '16px'

export const headingLargeSize = '22px'
export const headingLargeLineHeight = '28px'

export const colors = {
  canvas: '#000000',
  surface: '#101010',
  surfaceSubtle: '#f9fafb',
  textPrimary: '#ffffff',
  textStrong: '#111827',
  textSecondary: '#f3f4f6',
  textMuted: '#9ca3af',
  textDisabled: '#414141',
  textDisabledSubtle: '#343434',
  dividerStrong: '#676767',
  dividerSubtle: '#323232',
  accentPrimary: '#f6b700',
  accentPrimaryPressed: '#d99000',
  danger: '#ef4444',
  success: '#10b981',
} as const

export const radii = {
  control: '8px',
  round: '999px',
} as const

export const shadows = {
  accentAction: 'rgba(246, 183, 0, 0.28) 0 16px 36px',
  popover: 'rgba(0, 0, 0, 0.38) 0 16px 36px',
} as const

export default {
  baseFontSize,
  baseLineHeight,
  smallFontSize,
  smallLineHeight,
  headingLargeSize,
  headingLargeLineHeight,
  colors,
  radii,
  shadows,
}
