import { Canvas } from "@react-three/fiber";
import { OrbitControls, Edges } from "@react-three/drei";
import { Suspense } from "react";

interface Props {
  plotLength: number; // ft
  plotWidth: number;  // ft
  floors: number;
  floorHeight: number; // ft
}

function Building({ plotLength, plotWidth, floors, floorHeight }: Props) {
  // Scale ft → meters (visual)
  const L = plotLength * 0.3048;
  const W = plotWidth * 0.3048;
  const H = floorHeight * 0.3048;

  const slabT = 0.18;

  return (
    <group position={[0, 0, 0]}>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[L * 2.5, W * 2.5]} />
        <meshStandardMaterial color="#dfe6e9" />
      </mesh>

      {Array.from({ length: floors }).map((_, i) => {
        const y = i * H;
        return (
          <group key={i} position={[0, y, 0]}>
            {/* Floor slab */}
            <mesh position={[0, slabT / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[L, slabT, W]} />
              <meshStandardMaterial color="#bdc3c7" />
              <Edges color="#2c3e50" />
            </mesh>
            {/* Walls (4 sides as thin boxes) */}
            <mesh position={[0, H / 2 + slabT, W / 2 - 0.05]} castShadow>
              <boxGeometry args={[L, H - slabT, 0.1]} />
              <meshStandardMaterial color="#ecf0f1" transparent opacity={0.85} />
              <Edges color="#34495e" />
            </mesh>
            <mesh position={[0, H / 2 + slabT, -W / 2 + 0.05]} castShadow>
              <boxGeometry args={[L, H - slabT, 0.1]} />
              <meshStandardMaterial color="#ecf0f1" transparent opacity={0.85} />
              <Edges color="#34495e" />
            </mesh>
            <mesh position={[L / 2 - 0.05, H / 2 + slabT, 0]} castShadow>
              <boxGeometry args={[0.1, H - slabT, W]} />
              <meshStandardMaterial color="#ecf0f1" transparent opacity={0.85} />
              <Edges color="#34495e" />
            </mesh>
            <mesh position={[-L / 2 + 0.05, H / 2 + slabT, 0]} castShadow>
              <boxGeometry args={[0.1, H - slabT, W]} />
              <meshStandardMaterial color="#ecf0f1" transparent opacity={0.85} />
              <Edges color="#34495e" />
            </mesh>
            {/* Corner columns */}
            {[
              [L / 2 - 0.15, W / 2 - 0.15],
              [-L / 2 + 0.15, W / 2 - 0.15],
              [L / 2 - 0.15, -W / 2 + 0.15],
              [-L / 2 + 0.15, -W / 2 + 0.15],
            ].map(([cx, cz], k) => (
              <mesh key={k} position={[cx, H / 2 + slabT, cz]} castShadow>
                <boxGeometry args={[0.3, H, 0.3]} />
                <meshStandardMaterial color="#7f8c8d" />
                <Edges color="#2c3e50" />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Roof slab */}
      <mesh position={[0, floors * H + slabT / 2, 0]} castShadow>
        <boxGeometry args={[L + 0.3, slabT, W + 0.3]} />
        <meshStandardMaterial color="#e67e22" />
        <Edges color="#2c3e50" />
      </mesh>
    </group>
  );
}

export default function Building3D(props: Props) {
  const total = Math.max(props.plotLength, props.plotWidth) * 0.3048;
  const camDist = total * 1.6;
  return (
    <div className="w-full h-[420px] rounded-xl overflow-hidden bg-gradient-to-b from-sky-100 to-slate-200">
      <Canvas shadows camera={{ position: [camDist, camDist * 0.8, camDist], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
        <Suspense fallback={null}>
          <Building {...props} />
        </Suspense>
        <OrbitControls enablePan enableZoom enableRotate />
      </Canvas>
    </div>
  );
}
