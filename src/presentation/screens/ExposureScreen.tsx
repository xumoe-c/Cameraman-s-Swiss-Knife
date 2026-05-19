import { useEffect, useRef, useState } from 'react'
import { computeExposurePlan, ND_PRESETS } from '../../domain/exposure'
import { formatShutterDisplay } from '../formatters/exposureFormat'
import { useExposureStore } from '../../stores/exposureStore'
import { useSettingsStore } from '../../stores/settingsStore'

type ExposureScreenProps = {
  onBack?: () => void
}

type PickerItem = {
  main: string
  sub?: string
}

type WheelPickerProps = {
  title: string
  items: PickerItem[]
  currentIndex: number
  valueTestId: string
  prevTestId: string
  nextTestId: string
  onPrev: () => void
  onNext: () => void
}

const shutterOptions: Array<{ label: string; value: number }> = [
  { label: '30s', value: 30 },
  { label: '25s', value: 25 },
  { label: '20s', value: 20 },
  { label: '15s', value: 15 },
  { label: '13s', value: 13 },
  { label: '10s', value: 10 },
  { label: '8s', value: 8 },
  { label: '6s', value: 6 },
  { label: '5s', value: 5 },
  { label: '4s', value: 4 },
  { label: '3.2s', value: 3.2 },
  { label: '2.5s', value: 2.5 },
  { label: '2s', value: 2 },
  { label: '1.6s', value: 1.6 },
  { label: '1.3s', value: 1.3 },
  { label: '1s', value: 1 },
  { label: '0.8s', value: 0.8 },
  { label: '0.6s', value: 0.6 },
  { label: '0.5s', value: 0.5 },
  { label: '0.4s', value: 0.4 },
  { label: '0.3s', value: 0.3 },
  { label: '1/4s', value: 0.25 },
  { label: '1/5s', value: 0.2 },
  { label: '1/6s', value: 1 / 6 },
  { label: '1/8s', value: 1 / 8 },
  { label: '1/10s', value: 1 / 10 },
  { label: '1/13s', value: 1 / 13 },
  { label: '1/15s', value: 1 / 15 },
  { label: '1/20s', value: 1 / 20 },
  { label: '1/25s', value: 1 / 25 },
  { label: '1/30s', value: 1 / 30 },
  { label: '1/40s', value: 1 / 40 },
  { label: '1/50s', value: 1 / 50 },
  { label: '1/60s', value: 1 / 60 },
  { label: '1/80s', value: 1 / 80 },
  { label: '1/100s', value: 1 / 100 },
  { label: '1/125s', value: 1 / 125 },
  { label: '1/160s', value: 1 / 160 },
  { label: '1/200s', value: 1 / 200 },
  { label: '1/250s', value: 1 / 250 },
  { label: '1/320s', value: 1 / 320 },
  { label: '1/400s', value: 1 / 400 },
  { label: '1/500s', value: 1 / 500 },
  { label: '1/640s', value: 1 / 640 },
  { label: '1/800s', value: 1 / 800 },
  { label: '1/1000s', value: 1 / 1000 },
  { label: '1/1250s', value: 1 / 1250 },
  { label: '1/1600s', value: 1 / 1600 },
  { label: '1/2000s', value: 1 / 2000 },
  { label: '1/2500s', value: 1 / 2500 },
  { label: '1/3200s', value: 1 / 3200 },
  { label: '1/4000s', value: 1 / 4000 },
  { label: '1/5000s', value: 1 / 5000 },
  { label: '1/6400s', value: 1 / 6400 },
  { label: '1/8000s', value: 1 / 8000 },
]

const compensationOptions = [
  -3.0,
  -2.7,
  -2.3,
  -2.0,
  -1.7,
  -1.3,
  -1.0,
  -0.7,
  -0.3,
  0.0,
  0.3,
  0.7,
  1.0,
  1.3,
  1.7,
  2.0,
  2.3,
  2.7,
  3.0,
]

function wrappedIndex(index: number, length: number): number {
  return ((index % length) + length) % length
}

function formatStopLabel(stops: number): string {
  const rounded = Number.isInteger(stops) ? stops.toFixed(0) : stops.toFixed(1)
  return `${rounded}-STOP${rounded === '1' ? '' : 'S'}`
}

function formatPickerShutter(label: string): string {
  if (label.endsWith('s') && !label.includes('/')) {
    return label.slice(0, -1)
  }

  return label
}

function formatCompensation(value: number): string {
  if (Object.is(value, -0)) return '0'
  return value > 0 ? `+${value}` : `${value}`
}

function formatTimerDisplay(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) {
    return '00:00:00'
  }

  if (seconds > 60) {
    const totalSeconds = Math.round(seconds)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const remainingSeconds = totalSeconds % 60
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
  }

  return formatShutterDisplay(seconds)
}

function WheelPicker({
  title,
  items,
  currentIndex,
  valueTestId,
  prevTestId,
  nextTestId,
  onPrev,
  onNext,
}: WheelPickerProps) {
  const safeIndex = wrappedIndex(currentIndex < 0 ? 0 : currentIndex, items.length)
  const previous = items[wrappedIndex(safeIndex - 1, items.length)]
  const current = items[safeIndex]
  const next = items[wrappedIndex(safeIndex + 1, items.length)]
  const pickerClassName = title === '滤镜档位' ? 'exposure-picker exposure-picker-nd' : 'exposure-picker'

  return (
    <div className="exposure-field">
      <div className="exposure-field-title">{title}</div>
      <div className="exposure-divider exposure-divider-top" />
      <div className={pickerClassName} aria-label={title}>
        <button
          type="button"
          data-testid={prevTestId}
          className="exposure-picker-option exposure-picker-side"
          onClick={onPrev}
          aria-label={`${title}上一档`}
        >
          <span className="exposure-picker-main">{previous.main}</span>
          {previous.sub && <span className="exposure-picker-sub">{previous.sub}</span>}
        </button>
        <div data-testid={valueTestId} className="exposure-picker-option exposure-picker-current" aria-live="polite">
          <span className="exposure-picker-main">{current.main}</span>
          {current.sub && <span className="exposure-picker-sub">{current.sub}</span>}
        </div>
        <button
          type="button"
          data-testid={nextTestId}
          className="exposure-picker-option exposure-picker-side"
          onClick={onNext}
          aria-label={`${title}下一档`}
        >
          <span className="exposure-picker-main">{next.main}</span>
          {next.sub && <span className="exposure-picker-sub">{next.sub}</span>}
        </button>
      </div>
      <div className="exposure-divider exposure-divider-bottom" />
    </div>
  )
}

function useLongExposureTimer(seconds: number) {
  const [running, setRunning] = useState(false)
  const [remaining, setRemaining] = useState(seconds)
  const [hasStarted, setHasStarted] = useState(false)
  const startedAtRef = useRef<number | null>(null)
  const pausedElapsedRef = useRef(0)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    startedAtRef.current = null
    pausedElapsedRef.current = 0
    setRunning(false)
    setRemaining(seconds)
    setHasStarted(false)
  }, [seconds])

  useEffect(() => {
    if (!running) return undefined

    function tick() {
      const now = Date.now()
      if (startedAtRef.current == null) {
        startedAtRef.current = now
      }

      const elapsed = (now - startedAtRef.current) / 1000 + pausedElapsedRef.current
      const nextRemaining = Math.max(0, seconds - elapsed)
      setRemaining(nextRemaining)

      if (nextRemaining <= 0) {
        setRunning(false)
        startedAtRef.current = null
        pausedElapsedRef.current = 0
      }
    }

    tick()
    intervalRef.current = window.setInterval(tick, 250)

    return () => {
      if (intervalRef.current != null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [running, seconds])

  const toggle = () => {
    if (!isFinite(seconds) || seconds < 4) return

    if (running) {
      if (startedAtRef.current != null) {
        pausedElapsedRef.current += (Date.now() - startedAtRef.current) / 1000
      }
      startedAtRef.current = null
      setRunning(false)
      return
    }

    startedAtRef.current = Date.now()
    setHasStarted(true)
    setRunning(true)
  }

  const reset = () => {
    startedAtRef.current = null
    pausedElapsedRef.current = 0
    setRemaining(seconds)
    setRunning(false)
    setHasStarted(false)
  }

  return {
    running,
    remaining,
    hasStarted,
    hasProgress: hasStarted && remaining < seconds,
    toggle,
    reset,
  }
}

export function ExposureScreen({ onBack }: ExposureScreenProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const aperture = useExposureStore((state) => state.aperture)
  const shutterSeconds = useExposureStore((state) => state.shutterSeconds)
  const iso = useExposureStore((state) => state.iso)
  const compensationEv = useExposureStore((state) => state.compensationEv)
  const ndPreset = useExposureStore((state) => state.ndPreset)
  const customNdFactor = useExposureStore((state) => state.customNdFactor)

  const setShutterSeconds = useExposureStore((state) => state.setShutterSeconds)
  const setCompensationEv = useExposureStore((state) => state.setCompensationEv)
  const setNdPreset = useExposureStore((state) => state.setNdPreset)
  const showNdStops = useSettingsStore((s) => s.showNdStops)
  const setShowNdStops = useSettingsStore((s) => s.setShowNdStops)

  const plan = computeExposurePlan({
    aperture,
    shutterSeconds,
    iso,
    compensationEv,
    ndPreset,
    solveFor: 'shutter',
    customNdFactor,
  })

  const ndKeys = Object.keys(ND_PRESETS)
  const currentNdIndex = Math.max(0, ndKeys.indexOf(ndPreset))
  const ndItems = ndKeys.map((key) => {
    const preset = ND_PRESETS[key]
    return {
      main: preset.label,
      sub: showNdStops ? formatStopLabel(preset.stops) : undefined,
    }
  })

  const currentShutterIndex = shutterOptions.findIndex((option) => Math.abs(option.value - shutterSeconds) < 0.0001)
  const shutterItems = shutterOptions.map((option) => ({
    main: formatPickerShutter(option.label),
  }))

  const currentCompIndex = compensationOptions.findIndex((value) => Math.abs(value - compensationEv) < 0.001)
  const compItems = compensationOptions.map((value) => ({
    main: formatCompensation(value),
  }))

  const setWrappedNdIndex = (index: number) => setNdPreset(ndKeys[wrappedIndex(index, ndKeys.length)])
  const setWrappedShutterIndex = (index: number) => setShutterSeconds(shutterOptions[wrappedIndex(index, shutterOptions.length)].value)
  const setWrappedCompIndex = (index: number) => setCompensationEv(compensationOptions[wrappedIndex(index, compensationOptions.length)])

  const targetSeconds = plan.ndAdjustedShutterSeconds
  const timer = useLongExposureTimer(targetSeconds)
  const displayedSeconds = timer.hasStarted ? timer.remaining : targetSeconds

  return (
    <section className="exposure-screen" data-testid="exposure-page">
      <header className="exposure-topbar">
        <button type="button" className="exposure-icon-button" onClick={onBack} aria-label="返回主页">
          ←
        </button>
        <h1 className="exposure-title">曝光计算器</h1>
        <button
          type="button"
          className="exposure-icon-button"
          aria-label="设置"
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen((open) => !open)}
        >
          ⚙
        </button>
      </header>

      {settingsOpen && (
        <div className="exposure-settings-popover">
          <label className="exposure-setting-row">
            <input
              type="checkbox"
              checked={showNdStops}
              onChange={(event) => setShowNdStops(event.target.checked)}
            />
            显示 ND 档位
          </label>
          <div className="exposure-setting-metric">
            EVISO <strong>{plan.baseEvIso.toFixed(2)}</strong>
          </div>
        </div>
      )}

      <div className="exposure-picker-stack">
        <WheelPicker
          title="滤镜档位"
          items={ndItems}
          currentIndex={currentNdIndex}
          valueTestId="nd-switch-value"
          prevTestId="nd-switch-prev"
          nextTestId="nd-switch-next"
          onPrev={() => setWrappedNdIndex(currentNdIndex - 1)}
          onNext={() => setWrappedNdIndex(currentNdIndex + 1)}
        />

        <WheelPicker
          title="基础快门"
          items={shutterItems}
          currentIndex={currentShutterIndex}
          valueTestId="base-shutter-value"
          prevTestId="base-shutter-prev"
          nextTestId="base-shutter-next"
          onPrev={() => setWrappedShutterIndex(currentShutterIndex - 1)}
          onNext={() => setWrappedShutterIndex(currentShutterIndex + 1)}
        />

        <WheelPicker
          title="曝光补偿"
          items={compItems}
          currentIndex={currentCompIndex}
          valueTestId="comp-value"
          prevTestId="comp-prev"
          nextTestId="comp-next"
          onPrev={() => setWrappedCompIndex(currentCompIndex - 1)}
          onNext={() => setWrappedCompIndex(currentCompIndex + 1)}
        />
      </div>

      <section className="exposure-result">
        <div className="exposure-result-label">装入滤镜后的快门时间</div>
        <div data-testid="nd-shutter-result" className="exposure-result-time">
          {formatTimerDisplay(displayedSeconds)}
        </div>

        {plan.isBulbMode && (
          <div data-testid="exposure-bulb-timer" className="exposure-timer">
            <button
              type="button"
              data-testid="bulb-start-btn"
              className={`exposure-start-button ${timer.running ? 'is-running' : ''}`}
              onClick={timer.toggle}
            >
              {timer.running ? '暂停' : '开始'}
            </button>
            {(timer.hasProgress || timer.running) && (
              <button type="button" data-testid="bulb-reset-btn" className="exposure-reset-button" onClick={timer.reset}>
                重置
              </button>
            )}
          </div>
        )}
      </section>
    </section>
  )
}
