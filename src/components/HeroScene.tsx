import { Suspense, useEffect, useRef, type RefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, MeshTransmissionMaterial } from '@react-three/drei'
import { ACESFilmicToneMapping, MathUtils } from 'three'
import type { Group, PerspectiveCamera as ThreePerspectiveCamera } from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

const CHAMPAGNE_GOLD = '#dac769'
const CHARCOAL = '#131313'

// Camera distance at the top of the section (full form visible) vs. by the
// time the section has scrolled out of view (tight on the object).
const CAMERA_Z_ESTABLISHING = 5.5
const CAMERA_Z_TIGHT = 2.6

/**
 * Drives a slow, code-controlled camera float around the hero form, dollying
 * in as `scrollProgress` advances from 0 (section top) to 1 (section scrolled out).
 */
function CameraDrift({ scrollProgress }: { scrollProgress: RefObject<number> }) {
  const cameraRef = useRef<ThreePerspectiveCamera>(null!)

  useFrame((state) => {
    const camera = cameraRef.current
    if (!camera) return
    const t = state.clock.elapsedTime
    const progress = scrollProgress.current

    const driftAmpX = MathUtils.lerp(1.4, 0.5, progress)
    const driftAmpY = MathUtils.lerp(0.25, 0.1, progress)
    const dollyZ = MathUtils.lerp(CAMERA_Z_ESTABLISHING, CAMERA_Z_TIGHT, progress)

    camera.position.x = Math.sin(t * 0.06) * driftAmpX
    camera.position.y = 0.6 + Math.sin(t * 0.09) * driftAmpY
    camera.position.z = dollyZ + Math.cos(t * 0.06) * 0.6 * (1 - progress * 0.6)
    camera.lookAt(0, 0.2, 0)
  })

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={35}
      near={0.1}
      far={50}
      position={[0, 0.6, CAMERA_Z_ESTABLISHING]}
    />
  )
}

function HeroForm() {
  const groupRef = useRef<Group>(null!)

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return
    group.rotation.y += delta * 0.05
    group.rotation.x += delta * 0.012
  })

  return (
    <group ref={groupRef} position={[0, 0.4, 0]} rotation={[0.4, 0.3, 0]}>
      <mesh>
        <torusGeometry args={[1.1, 0.38, 64, 128]} />
        <MeshTransmissionMaterial
          color={CHAMPAGNE_GOLD}
          transmission={1}
          thickness={0.6}
          roughness={0.06}
          ior={1.3}
          chromaticAberration={0.04}
          anisotropy={0.3}
          distortion={0.15}
          distortionScale={0.3}
          temporalDistortion={0.1}
          clearcoat={1}
          clearcoatRoughness={0.05}
          attenuationColor={CHAMPAGNE_GOLD}
          attenuationDistance={1.5}
          resolution={256}
          samples={6}
        />
      </mesh>
    </group>
  )
}

function HeroFormFallback() {
  return (
    <mesh position={[0, 0.4, 0]} rotation={[0.4, 0.3, 0]}>
      <torusGeometry args={[1.1, 0.38, 16, 32]} />
      <meshBasicMaterial color={CHAMPAGNE_GOLD} wireframe transparent opacity={0.35} />
    </mesh>
  )
}

function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, 0]}>
      <planeGeometry args={[60, 60]} />
      <meshPhysicalMaterial
        color={CHARCOAL}
        roughness={0.65}
        metalness={0.15}
        reflectivity={0.1}
      />
    </mesh>
  )
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.3} color="#ffffff" />
      <directionalLight position={[3, 4, 4]} intensity={0.8} color="#fff8ec" />
      <directionalLight position={[-1.5, 2.5, -4]} intensity={0.4} color={CHAMPAGNE_GOLD} />
    </>
  )
}

export default function HeroScene() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const scrollProgress = useRef(0)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    const onTick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(onTick)
    gsap.ticker.lagSmoothing(0)
    lenis.on('scroll', ScrollTrigger.update)

    const trigger = ScrollTrigger.create({
      trigger: wrapperRef.current,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        scrollProgress.current = self.progress
      },
    })

    return () => {
      trigger.kill()
      gsap.ticker.remove(onTick)
      lenis.destroy()
    }
  }, [])

  return (
    <div ref={wrapperRef} className="relative h-screen w-full overflow-hidden bg-[#131313]">
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
      >
        <CameraDrift scrollProgress={scrollProgress} />
        <SceneLights />
        <GroundPlane />
        <Suspense fallback={<HeroFormFallback />}>
          <HeroForm />
        </Suspense>
      </Canvas>
    </div>
  )
}
