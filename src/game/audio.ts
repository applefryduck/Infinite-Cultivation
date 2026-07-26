/**
 * 程序化音效引擎（Web Audio API）。
 * 不依賴任何音檔：以振盪器合成鐘磬、清脆、悶響等修仙風格音效。
 * 瀏覽器要求使用者互動後才能播放，故 AudioContext 延後建立。
 */

export type SfxName =
  | 'click' // 一般點擊
  | 'breakthrough' // 突破成功（鐘磬）
  | 'fail' // 突破失敗（悶響）
  | 'discover' // 新發現（清脆上行）
  | 'craft' // 一般煉製
  | 'gather' // 採集收成
  | 'hit' // 戰鬥打擊
  | 'levelup' // 升級/購買
  | 'defeat' // 重傷撤退

const SETTINGS_KEY = 'infinite-cultivation-audio'

interface AudioSettings {
  muted: boolean
  volume: number // 0..1
}

function loadSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AudioSettings>
      return {
        muted: parsed.muted ?? false,
        volume: typeof parsed.volume === 'number' ? Math.min(1, Math.max(0, parsed.volume)) : 0.6,
      }
    }
  } catch {
    // ignore
  }
  return { muted: false, volume: 0.6 }
}

let settings = loadSettings()
let ctx: AudioContext | null = null
let masterGain: GainNode | null = null

function saveSettings(): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // ignore
  }
}

/** 建立/取得 AudioContext（必須在使用者互動後呼叫） */
function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
    masterGain = ctx.createGain()
    masterGain.gain.value = settings.muted ? 0 : settings.volume
    masterGain.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** 在第一次使用者互動時解鎖音訊 */
export function initAudioUnlock(): void {
  if (typeof window === 'undefined') return
  const unlock = () => {
    ensureCtx()
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }
  window.addEventListener('pointerdown', unlock, { once: true })
  window.addEventListener('keydown', unlock, { once: true })
}

export function getAudioSettings(): AudioSettings {
  return { ...settings }
}

export function setMuted(muted: boolean): void {
  settings = { ...settings, muted }
  saveSettings()
  if (masterGain && ctx) {
    masterGain.gain.setTargetAtTime(muted ? 0 : settings.volume, ctx.currentTime, 0.01)
  }
}

export function setVolume(volume: number): void {
  const v = Math.min(1, Math.max(0, volume))
  settings = { ...settings, volume: v }
  saveSettings()
  if (masterGain && ctx && !settings.muted) {
    masterGain.gain.setTargetAtTime(v, ctx.currentTime, 0.01)
  }
}

interface ToneOptions {
  freq: number
  type?: OscillatorType
  duration: number
  gain?: number
  delay?: number
  sweepTo?: number // 頻率滑向
  decay?: number // 指數衰減時間常數
}

/** 播放單一振盪音，含指數衰減包絡（模擬敲擊） */
function tone(c: AudioContext, dest: AudioNode, o: ToneOptions): void {
  const start = c.currentTime + (o.delay ?? 0)
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(o.freq, start)
  if (o.sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.sweepTo), start + o.duration)

  const peak = o.gain ?? 0.3
  g.gain.setValueAtTime(0, start)
  g.gain.linearRampToValueAtTime(peak, start + 0.008) // 快速起音
  g.gain.setTargetAtTime(0, start + 0.01, o.decay ?? o.duration / 3)

  osc.connect(g)
  g.connect(dest)
  osc.start(start)
  osc.stop(start + o.duration + 0.15)
}

/** 短促雜訊（模擬撞擊/沙沙聲） */
function noise(c: AudioContext, dest: AudioNode, duration: number, gain = 0.15, filterFreq = 1200, delay = 0): void {
  const start = c.currentTime + delay
  const frames = Math.floor(c.sampleRate * duration)
  const buffer = c.createBuffer(1, frames, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames) // 衰減雜訊
  }
  const src = c.createBufferSource()
  src.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = filterFreq
  const g = c.createGain()
  g.gain.value = gain
  src.connect(filter)
  filter.connect(g)
  g.connect(dest)
  src.start(start)
}

/**
 * 播放音效。靜音或尚未解鎖時安全略過。
 */
export function playSfx(name: SfxName): void {
  if (settings.muted) return
  const c = ensureCtx()
  if (!c || !masterGain) return
  const out = masterGain

  switch (name) {
    case 'click':
      tone(c, out, { freq: 880, type: 'triangle', duration: 0.08, gain: 0.12, decay: 0.03 })
      break

    case 'breakthrough':
      // 鐘磬：基頻 + 泛音，長餘韻
      tone(c, out, { freq: 523.25, type: 'sine', duration: 1.8, gain: 0.32, decay: 0.55 })
      tone(c, out, { freq: 1046.5, type: 'sine', duration: 1.4, gain: 0.16, decay: 0.4 })
      tone(c, out, { freq: 1567.98, type: 'sine', duration: 1.0, gain: 0.08, decay: 0.3 })
      tone(c, out, { freq: 783.99, type: 'sine', duration: 1.6, gain: 0.14, decay: 0.5, delay: 0.12 })
      break

    case 'fail':
      // 悶響：低頻下沉 + 濁噪
      tone(c, out, { freq: 180, type: 'sine', duration: 0.7, gain: 0.3, sweepTo: 70, decay: 0.22 })
      noise(c, out, 0.35, 0.1, 500)
      break

    case 'discover':
      // 清脆上行三音（發現新物）
      tone(c, out, { freq: 659.25, type: 'triangle', duration: 0.35, gain: 0.22, decay: 0.12 })
      tone(c, out, { freq: 987.77, type: 'triangle', duration: 0.35, gain: 0.2, decay: 0.12, delay: 0.1 })
      tone(c, out, { freq: 1318.51, type: 'sine', duration: 0.9, gain: 0.22, decay: 0.3, delay: 0.2 })
      break

    case 'craft':
      // 丹爐：悶沉起 + 清響收
      tone(c, out, { freq: 300, type: 'sine', duration: 0.25, gain: 0.18, decay: 0.09 })
      tone(c, out, { freq: 740, type: 'triangle', duration: 0.4, gain: 0.14, decay: 0.14, delay: 0.09 })
      break

    case 'gather':
      // 採集：短促沙沙 + 輕音
      noise(c, out, 0.16, 0.08, 2600)
      tone(c, out, { freq: 1174.66, type: 'sine', duration: 0.18, gain: 0.1, decay: 0.06, delay: 0.03 })
      break

    case 'hit':
      // 打擊：低頻衝擊 + 高頻脆響
      tone(c, out, { freq: 150, type: 'square', duration: 0.14, gain: 0.16, sweepTo: 60, decay: 0.05 })
      noise(c, out, 0.12, 0.13, 3000)
      break

    case 'levelup':
      // 升級：明亮上行
      tone(c, out, { freq: 587.33, type: 'triangle', duration: 0.28, gain: 0.18, decay: 0.1 })
      tone(c, out, { freq: 880, type: 'triangle', duration: 0.5, gain: 0.18, decay: 0.18, delay: 0.11 })
      break

    case 'defeat':
      // 重傷：下沉雙音
      tone(c, out, { freq: 320, type: 'sine', duration: 0.5, gain: 0.22, sweepTo: 120, decay: 0.18 })
      tone(c, out, { freq: 160, type: 'sine', duration: 0.8, gain: 0.18, sweepTo: 70, decay: 0.28, delay: 0.14 })
      break
  }
}
