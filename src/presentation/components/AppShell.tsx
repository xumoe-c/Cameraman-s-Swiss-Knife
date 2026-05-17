import { App } from '@capacitor/app'
import { type CSSProperties, useEffect, useState } from 'react'
import { kelvinToRgb } from '../../domain/temperature'
import { useAppStore } from '../../stores/useAppStore'
import { ExposureScreen } from '../screens/ExposureScreen'
import { DofScreen } from '../screens/DofScreen'

function rgbToCss([red, green, blue]: [number, number, number]): string {
  return `rgb(${red}, ${green}, ${blue})`
}

type AppRoute = 'home' | 'temperature' | 'exposure' | 'dof'

export function AppShell() {
  const [route, setRoute] = useState<AppRoute>('home')
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const temperature = useAppStore((state) => state.temperature)
  const setTemperature = useAppStore((state) => state.setTemperature)
  const rgb = kelvinToRgb(temperature)
  const previewBgStyle = { '--preview-bg': rgbToCss(rgb) } as CSSProperties

  useEffect(() => {
    let active = true
    let removeListener: (() => void) | undefined

    void App.addListener('backButton', () => {
      if (fullscreenOpen) {
        setFullscreenOpen(false)
        return
      }

      if (route !== 'home') {
        setRoute('home')
        return
      }

      void App.exitApp()
    }).then((handle) => {
      if (!active) {
        void handle.remove()
        return
      }

      removeListener = () => {
        void handle.remove()
      }
    })

    return () => {
      active = false
      removeListener?.()
    }
  }, [fullscreenOpen, route])

  return (
    <main className="app-main">
      {route === 'home' && (
        <section className="page-container home-center">
          <div className="card-panel">
            <h1 className="app-title">摄影小助手</h1>
            <div className="menu-list">
              <button onClick={() => setRoute('exposure')} className="menu-btn">曝光计算器</button>
              <button onClick={() => setRoute('dof')} className="menu-btn">景深计算器</button>
              <button onClick={() => setRoute('temperature')} className="menu-btn">色温与色相预览</button>
              <div className="menu-info">斗转辅助（待开放）</div>
              <div className="menu-info-last">摄影小知识（待开放）</div>
            </div>
          </div>
        </section>
      )}

      {route === 'temperature' && (
        <section className="page-container section-panel">
          <button onClick={() => setRoute('home')} className="back-btn">返回主页</button>
          <h1 className="temp-title">色温与色相预览</h1>
          <label className="temp-label-box">
            <div className="temp-label-title">色温参数</div>
            色温：{temperature}K
            <input
              data-testid="temp-input"
              type="range"
              min={2000}
              max={10000}
              step={100}
              value={temperature}
              onChange={(event) => setTemperature(Number(event.target.value))}
              className="temp-input"
            />
          </label>

          <div className="temp-grid">
            <div className="temp-card">
              <h2 className="temp-card-title">色温预览</h2>
              <div
                data-testid="temp-preview"
                role="button"
                tabIndex={0}
                onClick={() => setFullscreenOpen(true)}
                className="temp-preview"
                style={previewBgStyle}
              />
              <div className="temp-help">点击色块进入全屏预览，再次点击退出。</div>
            </div>
          </div>

          <div
            data-testid="fullscreen-overlay"
            onClick={() => setFullscreenOpen(false)}
            className={`fullscreen-overlay ${fullscreenOpen ? 'open' : ''}`}
            style={previewBgStyle}
          />
        </section>
      )}

      {route === 'exposure' && (
        <section className="page-container section-panel">
          <button onClick={() => setRoute('home')} className="back-btn">返回主页</button>
          <ExposureScreen />
        </section>
      )}

      {route === 'dof' && (
        <section className="page-container section-panel">
          <button onClick={() => setRoute('home')} className="back-btn">返回主页</button>
          <DofScreen />
        </section>
      )}
    </main>
  )
}
