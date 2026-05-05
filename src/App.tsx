import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, BrainCircuit, Code2, Cpu, Mail, Orbit, Sparkles, Terminal, Waves } from 'lucide-react'
import { useEffect, useRef } from 'react'
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
