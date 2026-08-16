import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Center, PerspectiveCamera, useGLTF } from '@react-three/drei'
import { ACESFilmicToneMapping, MathUtils } from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const CHAIR_MODEL_PATH = '/models/studio-noir-chair.glb'
const CHAMPAGNE_GOLD = '#dac769'
const CHARCOAL = '#131313'

// Camera framing as the section enters the viewport: pulled-back establishing
// angle at progress 0, tight product-shot framing by progress 1.
const CAMERA_START = { x: 1.8, y: 1.2, z: 6.5 }
const CAMERA_END = { x: 0.6, y: 0.75, z: 3 }
const LOOK_TARGET = [0, 0.4, 0]

/**
 * Dollies the camera in as the section's own scroll progress advances from
 * 0 (entering the bottom of the viewport) to 1 (settled at the top). No idle
 * motion here — the scroll-tied move is the only camera animation.
 */
function CameraRig({ scrollProgress }) {
  const cameraRef = useRef(null)

  useFrame(() => {
    const camera = cameraRef.current
    if (!camera) return
    const progress = scrollProgress.current

    camera.position.x = MathUtils.lerp(CAMERA_START.x, CAMERA_END.x, progress)
    camera.position.y = MathUtils.lerp(CAMERA_START.y, CAMERA_END.y, progress)
    camera.position.z = MathUtils.lerp(CAMERA_START.z, CAMERA_END.z, progress)
    camera.lookAt(...LOOK_TARGET)
  })

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={32}
      near={0.1}
      far={50}
      position={[CAMERA_START.x, CAMERA_START.y, CAMERA_START.z]}
    />
  )
}

function ChairModel() {
  const { scene } = useGLTF(CHAIR_MODEL_PATH)

  return (
    <Center position={[0, 0, 0]}>
      <primitive object={scene} />
    </Center>
  )
}

function ChairFallback() {
  return (
    <mesh position={[0, 0.4, 0]}>
      <boxGeometry args={[1, 1.2, 1]} />
      <meshBasicMaterial color={CHAMPAGNE_GOLD} wireframe transparent opacity={0.3} />
    </mesh>
  )
}

function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[30, 30]} />
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
      <ambientLight intensity={0.25} color="#ffffff" />
      <directionalLight position={[2.5, 3, 3]} intensity={0.9} color="#fdfaf5" />
      <directionalLight position={[-2, 1.5, -3]} intensity={0.5} color={CHAMPAGNE_GOLD} />
    </>
  )
}

export default function HeroChairDetail() {
  const wrapperRef = useRef(null)
  const scrollProgress = useRef(0)

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: wrapperRef.current,
      start: 'top bottom',
      end: 'top top',
      scrub: true,
      onUpdate: (self) => {
        scrollProgress.current = self.progress
      },
    })

    return () => {
      trigger.kill()
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
        <CameraRig scrollProgress={scrollProgress} />
        <SceneLights />
        <GroundPlane />
        <Suspense fallback={<ChairFallback />}>
          <ChairModel />
        </Suspense>
      </Canvas>
    </div>
  )
}

useGLTF.preload(CHAIR_MODEL_PATH)
