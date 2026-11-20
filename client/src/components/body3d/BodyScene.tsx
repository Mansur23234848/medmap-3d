import { Suspense, useEffect, useMemo, useRef, useState, type ElementRef, type ReactNode, type RefObject } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { CameraControls, ContactShadows, Environment, Html, Lightformer, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Focus, Minus, Plus, RotateCcw, Rotate3d } from 'lucide-react';
import { MODEL_URL, REGION_SLUGS, regionIndex, regionOfFace, segmentBody, writeMask, type BodyData, type RegionSlug } from './bodyModel';
import { AREA_NAMES } from './areaNames';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

type Controls = ElementRef<typeof CameraControls>;

const HOME = { pos: new THREE.Vector3(0, 1.0, 4.1), target: new THREE.Vector3(0, 0.86, 0) };
const DEBUG_REGIONS = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debugRegions');

/**
 * Body material: MeshPhysicalMaterial + injected shader code that tints regions by the per-vertex `regionId`.
 * Selected = red with pulsing glow and fresnel rim; hovered = cyan tint; marked (has complaints) = soft rose.
 */
function useBodyMaterial(dark: boolean) {
  const uniforms = useMemo(
    () => ({
      uSelAmt: { value: 0 },
      uHoverAmt: { value: 0 },
      uTime: { value: 0 },
      uSelColor: { value: new THREE.Color('#f0284a') },
      uHoverColor: { value: new THREE.Color('#38bdf8') },
      uMarkColor: { value: new THREE.Color('#fb7185') },
      uDebug: { value: DEBUG_REGIONS ? 1 : 0 },
    }),
    [],
  );
  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: '#e6ebf2',
      roughness: 0.5,
      metalness: 0,
      clearcoat: 0.3,
      clearcoatRoughness: 0.45,
      sheen: 0.6,
      sheenRoughness: 0.55,
      sheenColor: new THREE.Color('#bfdbfe'),
    });
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
          attribute float regionId; attribute float selMask; attribute float hoverMask; attribute float markMask;
          varying float vSel; varying float vHover; varying float vMarked; varying float vRegion;`,
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          vSel = selMask; vHover = hoverMask; vMarked = markMask; vRegion = regionId;`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          uniform float uSelAmt; uniform float uHoverAmt; uniform float uTime; uniform float uDebug;
          uniform vec3 uSelColor; uniform vec3 uHoverColor; uniform vec3 uMarkColor;
          varying float vSel; varying float vHover; varying float vMarked; varying float vRegion;
          vec3 hsl2rgb(vec3 c){ vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0); return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0)); }`,
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          float sel = smoothstep(0.32, 0.62, vSel) * uSelAmt;
          float hov = smoothstep(0.32, 0.62, vHover) * uHoverAmt * (1.0 - sel);
          float mk = smoothstep(0.32, 0.62, vMarked) * (1.0 - sel) * (1.0 - hov);
          diffuseColor.rgb = mix(diffuseColor.rgb, mix(diffuseColor.rgb, uMarkColor, 0.72), mk);
          diffuseColor.rgb = mix(diffuseColor.rgb, mix(diffuseColor.rgb, uHoverColor, 0.5), hov);
          diffuseColor.rgb = mix(diffuseColor.rgb, uSelColor, sel);
          if (uDebug > 0.5) diffuseColor.rgb = hsl2rgb(vec3(fract(floor(vRegion + 0.5) * 0.381966), 0.65, 0.55));`,
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
          float pulse = 0.78 + 0.22 * sin(uTime * 3.2);
          float rim = pow(1.0 - clamp(abs(dot(normalize(vNormal), normalize(vViewPosition))), 0.0, 1.0), 2.2);
          totalEmissiveRadiance += uSelColor * sel * (0.22 + rim * 1.1) * pulse;
          totalEmissiveRadiance += uHoverColor * hov * (0.08 + rim * 0.35);
          totalEmissiveRadiance += uMarkColor * mk * (0.06 + rim * 0.25);`,
        );
    };
    return m;
  }, [uniforms]);

  useEffect(() => {
    material.color.set(dark ? '#c6d1e2' : '#e6ebf2');
  }, [dark, material]);
  useEffect(() => () => material.dispose(), [material]);
  return { material, uniforms };
}

function Platform({ dark }: { dark: boolean }) {
  const ring = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ring.current) ring.current.rotation.z += dt * 0.12;
  });
  const disc = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, dark ? 'rgba(59,130,246,0.28)' : 'rgba(37,99,235,0.14)');
    g.addColorStop(0.55, dark ? 'rgba(34,211,238,0.08)' : 'rgba(6,182,212,0.06)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [dark]);
  const lineColor = dark ? '#38bdf8' : '#2563eb';
  return (
    <group position={[0, 0.001, 0.03]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <circleGeometry args={[1.05, 64]} />
        <meshBasicMaterial map={disc} transparent depthWrite={false} />
      </mesh>
      <mesh>
        <ringGeometry args={[0.52, 0.526, 128]} />
        <meshBasicMaterial color={lineColor} transparent opacity={dark ? 0.45 : 0.3} depthWrite={false} />
      </mesh>
      <group ref={ring}>
        {Array.from({ length: 48 }).map((_, i) => (
          <mesh key={i} rotation={[0, 0, (i / 48) * Math.PI * 2]}>
            <ringGeometry args={[0.6, 0.607, 4, 1, 0, ((Math.PI * 2) / 48) * 0.55]} />
            <meshBasicMaterial color={lineColor} transparent opacity={dark ? 0.35 : 0.22} depthWrite={false} />
          </mesh>
        ))}
      </group>
      <mesh>
        <ringGeometry args={[0.72, 0.723, 128]} />
        <meshBasicMaterial color={lineColor} transparent opacity={dark ? 0.18 : 0.12} depthWrite={false} />
      </mesh>
    </group>
  );
}

interface SceneProps {
  selected: RegionSlug | null;
  marked: Set<string>;
  interactive: boolean;
  autoRotate: boolean;
  dark: boolean;
  controlsRef: RefObject<Controls | null>;
  onHover: (s: RegionSlug | null) => void;
  onSelect: (s: RegionSlug) => void;
  onViewChange: (v: 'front' | 'back') => void;
  onReady: (data: BodyData) => void;
}

function Scene({ selected, marked, interactive, autoRotate, dark, controlsRef, onHover, onSelect, onViewChange, onReady }: SceneProps) {
  const { scene } = useGLTF(MODEL_URL);
  const data = useMemo(() => segmentBody(scene), [scene]);
  const { material, uniforms } = useBodyMaterial(dark);
  const interacting = useRef(false);
  const lastView = useRef<'front' | 'back'>('front');
  const hoverRef = useRef<RegionSlug | null>(null);

  useEffect(() => {
    onReady(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // selection fades in on change
  useEffect(() => {
    if (!selected) return; // keep the old mask while fading out
    writeMask(data, 'selMask', [regionIndex(selected)]);
    uniforms.uSelAmt.value = 0;
  }, [selected, uniforms, data]);
  useEffect(() => {
    writeMask(data, 'markMask', REGION_SLUGS.filter((s) => marked.has(s)).map(regionIndex));
  }, [marked, data]);

  useFrame(({ clock }, dt) => {
    uniforms.uTime.value = clock.elapsedTime;
    const k = 1 - Math.exp(-dt * 8);
    uniforms.uSelAmt.value += ((selected ? 1 : 0) - uniforms.uSelAmt.value) * k;
    uniforms.uHoverAmt.value += ((hoverRef.current ? 1 : 0) - uniforms.uHoverAmt.value) * k;
    const c = controlsRef.current;
    if (!c) return;
    if (autoRotate && !interacting.current && !selected) c.rotate(dt * 0.22, 0, false);
    const view = Math.cos(c.azimuthAngle) >= 0 ? 'front' : 'back';
    if (view !== lastView.current) {
      lastView.current = view;
      onViewChange(view);
    }
  });

  const setHover = (s: RegionSlug | null) => {
    if (hoverRef.current === s) return;
    hoverRef.current = s;
    if (s) {
      writeMask(data, 'hoverMask', [regionIndex(s)]);
      uniforms.uHoverAmt.value = 0;
    }
    onHover(s);
  };

  const handlers = interactive
    ? {
        onPointerMove: (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          if (e.face) setHover(regionOfFace(data, e.face));
        },
        onPointerOut: () => setHover(null),
        onClick: (e: ThreeEvent<MouseEvent>) => {
          if (e.delta > 6 || !e.face) return; // drag (orbit), not a click
          e.stopPropagation();
          onSelect(regionOfFace(data, e.face));
        },
      }
    : {};

  const sel = selected ? data.regions[regionIndex(selected)] : null;

  return (
    <>
      <ambientLight intensity={dark ? 0.35 : 0.5} />
      <directionalLight position={[2.4, 4, 3.2]} intensity={dark ? 1.5 : 1.6} />
      <directionalLight position={[-3, 2.4, -2.6]} intensity={dark ? 1.6 : 0.9} color="#7dd3fc" />
      <directionalLight position={[0, -1, 2]} intensity={0.25} color="#c7d2fe" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 3, 3]} scale={[5, 2, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[-4, 1.5, 0]} rotation-y={Math.PI / 2} scale={[4, 3, 1]} color="#dbeafe" />
        <Lightformer form="rect" intensity={1.6} position={[4, 1.5, -1]} rotation-y={-Math.PI / 2} scale={[3, 3, 1]} color="#a5f3fc" />
        <Lightformer form="ring" intensity={0.8} position={[0, 4, -3]} scale={2} />
      </Environment>

      <mesh geometry={data.geometry} material={material} {...handlers} />

      {sel && (
        <Html position={sel.anchor} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="flex -translate-y-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/20 bg-slate-950/80 py-1 pr-3 pl-2 text-[12px] font-medium text-white shadow-lg backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
            {AREA_NAMES[sel.slug].kk}
          </div>
        </Html>
      )}

      <Platform dark={dark} />
      <ContactShadows position={[0, 0, 0]} opacity={dark ? 0.7 : 0.38} scale={2.2} blur={2.6} far={1.4} resolution={512} color={dark ? '#000000' : '#1e293b'} />

      <CameraControls
        ref={controlsRef}
        makeDefault
        minDistance={1.0}
        maxDistance={5.5}
        minPolarAngle={Math.PI * 0.22}
        maxPolarAngle={Math.PI * 0.6}
        smoothTime={0.32}
        draggingSmoothTime={0.12}
        onStart={() => (interacting.current = true)}
        onEnd={() => (interacting.current = false)}
      />
    </>
  );
}

export interface BodySceneProps {
  selected?: RegionSlug | null;
  onSelect?: (slug: RegionSlug) => void;
  marked?: Iterable<string>;
  interactive?: boolean;
  autoRotate?: boolean;
  toolbar?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export default function BodyScene({ selected = null, onSelect, marked, interactive = true, autoRotate = false, toolbar = true, autoFocus = true, className }: BodySceneProps) {
  const { dark } = useTheme();
  const controlsRef = useRef<Controls | null>(null);
  const [hovered, setHovered] = useState<RegionSlug | null>(null);
  const [view, setView] = useState<'front' | 'back'>('front');
  const [data, setData] = useState<BodyData | null>(null);
  const markedKey = [...(marked ?? [])].sort().join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const markedSet = useMemo(() => new Set(markedKey ? markedKey.split(',') : []), [markedKey]);
  const ready = !!data;

  useEffect(() => {
    document.body.style.cursor = hovered && interactive ? 'pointer' : '';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hovered, interactive]);

  const nearestAzimuth = (target: number) => {
    const cur = controlsRef.current?.azimuthAngle ?? 0;
    return target + Math.round((cur - target) / (Math.PI * 2)) * Math.PI * 2;
  };
  const setSide = (side: 'front' | 'back') => controlsRef.current?.rotateAzimuthTo(nearestAzimuth(side === 'front' ? 0 : Math.PI), true);
  const reset = (animate = true) => {
    const c = controlsRef.current;
    if (!c) return;
    const az = nearestAzimuth(view === 'front' ? 0 : Math.PI);
    const r = Math.hypot(HOME.pos.x, HOME.pos.z);
    c.setLookAt(Math.sin(az) * r, HOME.pos.y, Math.cos(az) * r, HOME.target.x, HOME.target.y, HOME.target.z, animate);
  };
  const focus = (slug: RegionSlug | null) => {
    const c = controlsRef.current;
    if (!c || !data) return;
    if (!slug) return reset();
    const reg = data.regions[regionIndex(slug)];
    const a = reg.anchor;
    if (reg.facing === 'back') c.rotateAzimuthTo(nearestAzimuth(Math.PI), true);
    if (reg.facing === 'front') c.rotateAzimuthTo(nearestAzimuth(0), true);
    c.moveTo(a.x * 0.6, THREE.MathUtils.clamp(a.y, 0.3, 1.55), 0, true);
    c.dollyTo(THREE.MathUtils.clamp(c.distance, 1.8, 2.5), true);
  };

  // CameraControls starts targeting the origin: frame the whole body once the model is ready.
  useEffect(() => {
    if (ready) reset(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Smooth camera animation towards the selected region.
  useEffect(() => {
    if (!ready || !autoFocus) return;
    focus(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, ready]);

  return (
    <div className={cn('relative h-full w-full select-none overflow-hidden', className)}>
      <motion.div className="absolute inset-0" initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: ready ? 1 : 0, scale: ready ? 1 : 0.985 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          camera={{ position: HOME.pos.toArray(), fov: 30, near: 0.05, far: 50 }}
          onCreated={({ camera }) => camera.lookAt(HOME.target)}
          style={{ touchAction: 'none' }}
        >
          <Suspense fallback={null}>
            <Scene
              selected={selected}
              marked={markedSet}
              interactive={interactive}
              autoRotate={autoRotate}
              dark={dark}
              controlsRef={controlsRef}
              onHover={setHovered}
              onSelect={(s) => onSelect?.(s)}
              onViewChange={setView}
              onReady={(d) => requestAnimationFrame(() => setData(d))}
            />
          </Suspense>
        </Canvas>
      </motion.div>

      {!ready && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex flex-col items-center gap-3">
            <div className="skeleton h-72 w-28 rounded-full opacity-70" />
            <p className="text-[12px] text-muted">3D модель жүктелуде…</p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute top-4 left-4 z-10">
        <motion.div
          key={hovered ?? 'none'}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: hovered ? 1 : 0, y: 0 }}
          className="rounded-xl border border-line bg-surface/85 px-3 py-2 shadow-card backdrop-blur-md"
        >
          {hovered && (
            <>
              <p className="text-[13px] font-semibold">{AREA_NAMES[hovered].kk}</p>
              <p className="text-[11px] text-muted">{AREA_NAMES[hovered].en}</p>
            </>
          )}
        </motion.div>
      </div>

      {toolbar && (
        <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center px-4">
          <div className="flex items-center gap-1 rounded-2xl border border-line bg-surface/85 p-1.5 shadow-pop backdrop-blur-xl">
            <div className="flex rounded-xl bg-surface-2 p-0.5">
              {(['front', 'back'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  className={cn('h-9 rounded-[10px] px-3.5 text-[13px] font-medium transition', view === s ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink')}
                >
                  {s === 'front' ? 'Алды' : 'Арты'}
                </button>
              ))}
            </div>
            <div className="mx-1 h-6 w-px bg-line" />
            <ToolBtn label="Жақындату" onClick={() => controlsRef.current?.dolly(0.6, true)}><Plus className="h-4 w-4" /></ToolBtn>
            <ToolBtn label="Алыстату" onClick={() => controlsRef.current?.dolly(-0.6, true)}><Minus className="h-4 w-4" /></ToolBtn>
            <ToolBtn label="Айналдыру" onClick={() => controlsRef.current?.rotate(Math.PI / 4, 0, true)}><Rotate3d className="h-4 w-4" /></ToolBtn>
            {selected && <ToolBtn label="Аймаққа фокус" onClick={() => focus(selected)}><Focus className="h-4 w-4" /></ToolBtn>}
            <ToolBtn label="Бастапқы көрініс" onClick={() => reset()}><RotateCcw className="h-4 w-4" /></ToolBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolBtn({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} title={label} aria-label={label} className="grid h-9 w-9 place-items-center rounded-xl text-ink-2 transition hover:bg-surface-2 hover:text-ink active:scale-95">
      {children}
    </button>
  );
}

useGLTF.preload(MODEL_URL);
