import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, BrainCircuit, Code2, Cpu, Mail, Music2, Orbit, Pause, Play, Sparkles, Terminal, Volume2, Waves } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Renderer, Program, Mesh, Triangle, Vec2 } from 'ogl'

const pillars = [
  {
    icon: BrainCircuit,
    title: 'AI systems',
    text: 'Building practical agent workflows, evaluation loops, and tools that turn research into leverage.',
  },
  {
    icon: Terminal,
    title: 'Linux craft',
    text: 'Comfortable close to the metal: automation, self-hosting, debugging, and resilient developer environments.',
  },
  {
    icon: Orbit,
    title: 'Physics mindset',
    text: 'Model first, measure carefully, then simplify until the system becomes legible.',
  },
]

const projects = [
  'Agent infrastructure experiments',
  'Personal knowledge and automation systems',
  'Physics-informed technical notes',
  'Linux-first development workflows',
]

function RibbonsBackground() {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const container = ref.current
    if (!container || prefersReducedMotion) return

    const renderer = new Renderer({ alpha: true, dpr: Math.min(window.devicePixelRatio, 2) })
    const gl = renderer.gl
    container.appendChild(gl.canvas)

    const geometry = new Triangle(gl)
    const program = new Program(gl, {
      vertex: `
        attribute vec2 position;
        void main() {
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform float uTime;
        uniform vec2 uResolution;

        mat2 rotate(float a) {
          float s = sin(a), c = cos(a);
          return mat2(c, -s, s, c);
        }

        float ribbon(vec2 uv, float offset, float width) {
          uv *= rotate(-0.42);
          float wave = sin(uv.x * 3.0 + uTime * 0.42 + offset) * 0.12;
          wave += sin(uv.x * 7.0 - uTime * 0.24 + offset) * 0.035;
          float line = abs(uv.y + wave + offset * 0.18);
          return smoothstep(width, 0.0, line);
        }

        void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
          vec3 base = vec3(0.025, 0.03, 0.085);
          float r1 = ribbon(uv + vec2(-0.16, 0.03), 0.2, 0.034);
          float r2 = ribbon(uv + vec2(0.18, -0.18), 2.1, 0.026);
          float r3 = ribbon(uv + vec2(0.06, 0.22), 4.0, 0.018);
          vec3 color = base;
          color += r1 * vec3(0.55, 0.28, 1.0);
          color += r2 * vec3(0.08, 0.78, 1.0);
          color += r3 * vec3(1.0, 0.62, 0.24);
          float glow = smoothstep(0.85, 0.05, length(uv - vec2(0.22, 0.06)));
          color += glow * vec3(0.10, 0.06, 0.20);
          gl_FragColor = vec4(color, 0.92);
        }
      `,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vec2(1, 1) },
      },
    })

    const mesh = new Mesh(gl, { geometry, program })
    let raf = 0

    const resize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      renderer.setSize(width, height)
      program.uniforms.uResolution.value.set(width, height)
    }

    const animate = (time: number) => {
      program.uniforms.uTime.value = time * 0.001
      renderer.render({ scene: mesh })
      raf = requestAnimationFrame(animate)
    }

    resize()
    window.addEventListener('resize', resize)
    raf = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      gl.canvas.remove()
    }
  }, [prefersReducedMotion])

  return <div ref={ref} className="ribbons" aria-hidden="true" />
}


const musicStyles = {
  dark: {
    label: 'Dark techno',
    tempo: '148 BPM · syncopated',
    description: 'Fast, shadowy pulse with off-grid hats, minor bass movement, and a bright FM stab line.',
    accent: 'from-fuchsia-400 via-cyan-300 to-orange-300',
  },
  peace: {
    label: 'Peaceful harmony',
    tempo: '58 BPM · long-form',
    description: 'Slow suspended chords, soft bell tones, and drawn-out notes inspired by calm elemental balance.',
    accent: 'from-sky-200 via-violet-200 to-amber-100',
  },
} as const

type MusicStyle = keyof typeof musicStyles

function MusicLab() {
  const [selectedStyle, setSelectedStyle] = useState<MusicStyle>('dark')
  const [activeStyle, setActiveStyle] = useState<MusicStyle | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  const stopMusic = () => {
    cleanupRef.current?.()
    cleanupRef.current = null
    setActiveStyle(null)
  }

  useEffect(() => stopMusic, [])

  const playStyle = async (style: MusicStyle) => {
    if (activeStyle === style) {
      stopMusic()
      return
    }

    setIsLoading(true)
    cleanupRef.current?.()

    const Tone = await import('tone')
    await Tone.start()
    Tone.Transport.stop()
    Tone.Transport.cancel(0)
    Tone.Transport.position = 0
    Tone.Transport.swing = style === 'dark' ? 0.16 : 0.04
    Tone.Transport.bpm.value = style === 'dark' ? 148 : 58

    const disposables: { dispose: () => void }[] = []
    const add = <T extends { dispose: () => void }>(node: T) => {
      disposables.push(node)
      return node
    }

    const limiter = add(new Tone.Limiter(-1).toDestination())
    const master = add(new Tone.Volume(style === 'dark' ? -10 : -8).connect(limiter))

    if (style === 'dark') {
      const kick = add(new Tone.MembraneSynth({
        pitchDecay: 0.028,
        octaves: 7,
        envelope: { attack: 0.001, decay: 0.28, sustain: 0.01, release: 0.4 },
      }).connect(master))
      const hats = add(new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.045, sustain: 0, release: 0.03 },
      }).connect(master))
      const bass = add(new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        filter: { Q: 4, type: 'lowpass', rolloff: -24, frequency: 420 },
        envelope: { attack: 0.003, decay: 0.12, sustain: 0.18, release: 0.08 },
        filterEnvelope: { attack: 0.002, decay: 0.11, sustain: 0.2, release: 0.08, baseFrequency: 80, octaves: 3.2 },
      }).connect(master))
      const stabDelay = add(new Tone.FeedbackDelay('8n.', 0.22).connect(master))
      const stab = add(new Tone.FMSynth({
        harmonicity: 1.5,
        modulationIndex: 5,
        envelope: { attack: 0.002, decay: 0.12, sustain: 0.02, release: 0.08 },
        modulationEnvelope: { attack: 0.002, decay: 0.08, sustain: 0, release: 0.06 },
      }).connect(stabDelay))

      add(new Tone.Sequence((time, step) => {
        if ([0, 4, 8, 12, 14].includes(step)) kick.triggerAttackRelease('C1', '16n', time, step === 14 ? 0.68 : 0.95)
        if ([2, 5, 7, 10, 13, 15].includes(step)) hats.triggerAttackRelease('32n', time, step % 5 === 0 ? 0.34 : 0.22)
        const bassNotes = ['C2', null, 'C2', 'Eb2', null, 'G1', null, 'Bb1', 'C2', null, 'Db2', null, 'G1', 'Bb1', null, 'Eb2']
        const note = bassNotes[step]
        if (note) bass.triggerAttackRelease(note, '16n', time, [3, 10, 15].includes(step) ? 0.72 : 0.58)
        if ([3, 11, 15].includes(step)) stab.triggerAttackRelease(step === 11 ? 'Bb4' : 'G4', '32n', time, 0.28)
      }, [...Array(16).keys()], '16n').start(0))
    } else {
      const reverb = add(new Tone.Reverb({ decay: 9, wet: 0.42 }).connect(master))
      const delay = add(new Tone.FeedbackDelay('2n', 0.2).connect(reverb))
      const pad = add(new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 1.8, decay: 0.8, sustain: 0.72, release: 4.8 },
      }).connect(reverb))
      const bell = add(new Tone.FMSynth({
        harmonicity: 2,
        modulationIndex: 2.5,
        envelope: { attack: 0.02, decay: 1.5, sustain: 0.08, release: 3.5 },
        modulationEnvelope: { attack: 0.2, decay: 0.9, sustain: 0.2, release: 2.2 },
      }).connect(delay))

      add(new Tone.Part((time, value) => {
        const chord = value as { notes: string[]; duration: string }
        pad.triggerAttackRelease(chord.notes, chord.duration, time, 0.45)
      }, [
        ['0:0', { notes: ['D3', 'A3', 'E4'], duration: '1m' }],
        ['1:0', { notes: ['F3', 'C4', 'G4'], duration: '1m' }],
        ['2:0', { notes: ['Bb2', 'F3', 'C4'], duration: '1m' }],
        ['3:0', { notes: ['C3', 'G3', 'D4'], duration: '1m' }],
      ]).start(0))
      add(new Tone.Sequence((time, note) => {
        if (note) bell.triggerAttackRelease(note, '2n', time, 0.22)
      }, ['A4', null, 'G4', 'D5', null, 'E5', 'C5', null], '2n').start('0:2'))
    }

    Tone.Transport.loop = true
    Tone.Transport.loopStart = 0
    Tone.Transport.loopEnd = style === 'dark' ? '2m' : '4m'
    Tone.Transport.start('+0.04')

    cleanupRef.current = () => {
      Tone.Transport.stop()
      Tone.Transport.cancel(0)
      disposables.forEach((node) => node.dispose())
    }
    setActiveStyle(style)
    setIsLoading(false)
  }

  return (
    <section id="music" className="relative z-10 mx-auto w-full max-w-6xl px-6 py-20">
      <div className="grid gap-8 rounded-[2.2rem] border border-white/10 bg-slate-950/50 p-5 shadow-2xl shadow-black/35 backdrop-blur-2xl lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
        <div className="glass-card p-7">
          <p className="eyebrow">Generative audio</p>
          <h2 className="section-title text-4xl sm:text-5xl">A tiny AI-music lab for the site.</h2>
          <p className="mt-5 leading-8 text-slate-300">
            This uses Tone.js to synthesize the music in-browser after a click: no copyrighted audio file, no autoplay surprise, and no server required. Later we can swap the procedural engine for Magenta.js or a hosted music-generation API.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 text-sm text-slate-300">
            <span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1">Tone.js</span>
            <span className="rounded-full border border-violet-200/20 bg-violet-200/10 px-3 py-1">Web Audio</span>
            <span className="rounded-full border border-orange-200/20 bg-orange-200/10 px-3 py-1">Click-to-play safe</span>
          </div>
        </div>

        <div className="space-y-4">
          {(Object.keys(musicStyles) as MusicStyle[]).map((style) => {
            const item = musicStyles[style]
            const isSelected = selectedStyle === style
            const isActive = activeStyle === style
            return (
              <button
                key={style}
                type="button"
                onClick={() => setSelectedStyle(style)}
                className={`group w-full rounded-[1.7rem] border p-5 text-left transition ${isSelected ? 'border-cyan-200/40 bg-white/[0.09]' : 'border-white/10 bg-white/[0.045] hover:border-white/20 hover:bg-white/[0.07]'}`}
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className={`grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br ${item.accent} text-slate-950 shadow-lg shadow-cyan-950/20`}>
                        <Music2 size={18} />
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{item.label}</h3>
                        <p className="text-sm text-cyan-100/70">{item.tempo}</p>
                      </div>
                    </div>
                    <p className="mt-4 leading-7 text-slate-300">{item.description}</p>
                  </div>
                  {isActive && <Volume2 className="mt-2 shrink-0 text-cyan-200" size={20} />}
                </div>
              </button>
            )
          })}

          <div className="rounded-[1.7rem] border border-white/10 bg-black/25 p-5">
            <div className="mb-5 flex items-center gap-2" aria-hidden="true">
              {[...Array(18)].map((_, index) => (
                <span
                  key={index}
                  className={`music-bar ${activeStyle ? 'is-playing' : ''}`}
                  style={{ animationDelay: `${index * 70}ms`, height: `${18 + ((index * 17) % 42)}px` }}
                />
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="button-primary" type="button" onClick={() => playStyle(selectedStyle)} disabled={isLoading}>
                {activeStyle === selectedStyle ? <Pause size={18} /> : <Play size={18} />}
                {activeStyle === selectedStyle ? 'Pause music' : `Play ${musicStyles[selectedStyle].label}`}
              </button>
              <button className="button-secondary" type="button" onClick={stopMusic} disabled={!activeStyle}>
                Stop audio
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function App() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#060711] text-slate-100 selection:bg-cyan-300 selection:text-slate-950">
      <RibbonsBackground />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,92,255,.28),transparent_34%),linear-gradient(180deg,transparent,rgba(6,7,17,.78)_68%,#060711)]" />
      <nav className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <a href="#top" className="group flex items-center gap-3 text-sm font-medium tracking-wide text-white/80">
          <span className="grid h-9 w-9 place-items-center rounded-2xl border border-white/15 bg-white/10 shadow-2xl shadow-cyan-500/10 backdrop-blur">
            <Sparkles size={16} />
          </span>
          <span>Cole Shafe</span>
        </a>
        <div className="hidden items-center gap-6 text-sm text-white/62 sm:flex">
          <a className="transition hover:text-white" href="#work">Work</a>
          <a className="transition hover:text-white" href="#approach">Approach</a>
          <a className="transition hover:text-white" href="#music">Music</a>
          <a className="transition hover:text-white" href="#contact">Contact</a>
        </div>
      </nav>

      <section id="top" className="relative z-10 mx-auto grid min-h-[78vh] w-full max-w-6xl items-center px-6 py-16">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-sm text-cyan-100 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl"
          >
            <Waves size={15} /> AI · Linux · Physics · Systems
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08 }}
            className="text-balance text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-white sm:text-7xl lg:text-8xl"
          >
            I build tools that make complex systems feel usable.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.16 }}
            className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-slate-300 sm:text-xl"
          >
            I’m Cole — a technical builder working across AI, Linux, and physics-shaped problem solving. This site is being rebuilt as a crisp, static-but-alive portfolio for experiments, writing, and work worth sharing.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.24 }}
            className="mt-10 flex flex-col gap-3 sm:flex-row"
          >
            <a className="button-primary" href="#work">
              Explore the work <ArrowUpRight size={18} />
            </a>
            <a className="button-secondary" href="https://github.com/scshafe">
              <Code2 size={18} /> GitHub
            </a>
          </motion.div>
        </div>
      </section>

      <section id="approach" className="relative z-10 mx-auto w-full max-w-6xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Operating mode</p>
            <h2 className="section-title">Tasteful systems engineering.</h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {pillars.map((pillar, index) => (
            <motion.article
              key={pillar.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: index * 0.08 }}
              className="glass-card"
            >
              <pillar.icon className="mb-8 text-cyan-200" size={28} />
              <h3 className="text-xl font-semibold text-white">{pillar.title}</h3>
              <p className="mt-4 leading-7 text-slate-300">{pillar.text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="work" className="relative z-10 mx-auto w-full max-w-6xl px-6 py-20">
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div>
            <p className="eyebrow">Selected directions</p>
            <h2 className="section-title">A portfolio shell ready for real artifacts.</h2>
            <p className="mt-5 max-w-xl leading-8 text-slate-300">
              The first pass establishes the visual language and static architecture. Next we can plug in polished project cards, writing, talks, publications, notebooks, or whatever best represents you.
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
            {projects.map((project, index) => (
              <motion.div
                key={project}
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="group flex items-center justify-between gap-4 rounded-[1.4rem] border border-white/0 px-5 py-5 transition hover:border-white/10 hover:bg-white/[0.06]"
              >
                <div>
                  <p className="font-medium text-white">{project}</p>
                  <p className="mt-1 text-sm text-slate-400">Case-study slot · static content driven</p>
                </div>
                <Cpu className="text-white/35 transition group-hover:text-cyan-200" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <MusicLab />

      <section id="contact" className="relative z-10 mx-auto w-full max-w-6xl px-6 py-20 pb-28">
        <div className="glass-card overflow-hidden p-8 sm:p-10">
          <p className="eyebrow">Next step</p>
          <h2 className="section-title max-w-3xl">Let’s turn this into the best public version of Cole.</h2>
          <p className="mt-5 max-w-2xl leading-8 text-slate-300">
            We can layer in a stronger biography, concrete project proof, writing, social links, and dynamic-but-static touches like generated OpenGraph images and searchable local content.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a className="button-primary" href="mailto:hello@example.com"><Mail size={18} /> Add preferred email</a>
            <a className="button-secondary" href="https://github.com/scshafe"><Code2 size={18} /> github.com/scshafe</a>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
