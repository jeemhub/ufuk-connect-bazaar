import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type Props = {
  progress: React.MutableRefObject<number>;
  lang: "ar" | "en";
  onReady: () => void;
  onError: () => void;
};

const ease = (value: number) => {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
};

const segment = (progress: number, start: number, end: number) =>
  ease((progress - start) / (end - start));

export default function BlueStormScene({ progress, lang, onReady, onError }: Props) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = host.current;
    if (!element) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      onError();
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    element.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight(0xd9e8ff, 0x8c5a3a, 3));

    const key = new THREE.DirectionalLight(0xffffff, 4);
    key.position.set(-3, 5, 7);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x86b9ff, 3.5);
    rim.position.set(4, 4, -3);
    scene.add(rim);

    let model: THREE.Group | null = null;
    let front: THREE.Object3D | undefined;
    let connector: THREE.Object3D | undefined;
    let frame = 0;
    let disposed = false;
    let width = 0;
    let height = 0;
    const look = new THREE.Vector3();
    const wantedLook = new THREE.Vector3();
    const startLook = new THREE.Vector3(lang === "ar" ? 0.66 : -0.66, 0, 0);
    const detailLook = new THREE.Vector3(2.58, -0.85, 0.55);

    const resize = () => {
      width = element.clientWidth;
      height = element.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.fov = width < 900 ? 46 : 32;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();

    const loader = new GLTFLoader();
    loader.load(
      "/models/bluestorm-lan-reel.glb",
      (gltf) => {
        if (disposed) {
          gltf.scene.traverse((object) => {
            if (object instanceof THREE.Mesh) object.geometry.dispose();
          });
          return;
        }
        model = gltf.scene;
        front = model.getObjectByName("FrontFlange");
        connector = model.getObjectByName("RJ45Connector");
        model.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.castShadow = false;
            object.receiveShadow = false;
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => {
              if (material instanceof THREE.MeshStandardMaterial) material.side = THREE.DoubleSide;
            });
          }
        });
        scene.add(model);
        onReady();
      },
      undefined,
      () => onError(),
    );

    const render = () => {
      frame = requestAnimationFrame(render);
      if (!model || !width || !height) return;

      const value = Math.min(1, Math.max(0, progress.current));
      const reveal = segment(value, 0.12, 0.55);
      const detail = segment(value, 0.58, 0.95);
      const spin = segment(value, 0, 0.6);

      // The branded front disc slides outward, revealing the wound cable.
      if (front) {
        front.position.x = -1.9 * reveal;
        front.position.z = 1.25 * reveal;
        front.rotation.y = -0.22 * reveal;
      }
      if (connector) {
        connector.rotation.y = 0.22 * detail;
      }
      model.rotation.y = -0.10 - 0.24 * spin;
      model.rotation.x = 0.06 + 0.05 * spin;

      const isSmall = width < 900;
      const initialPosition = isSmall
        ? new THREE.Vector3(3.2, 1.6, 12.2)
        : new THREE.Vector3(3.8, 2.2, 8.0);
      const detailPosition = new THREE.Vector3(3.1, -0.43, isSmall ? 4.1 : 2.75);
      camera.position.copy(initialPosition).lerp(detailPosition, detail);
      wantedLook.copy(startLook).lerp(detailLook, detail);
      look.lerp(wantedLook, 0.14);
      camera.lookAt(look);
      renderer.render(scene, camera);
    };
    render();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [progress, lang, onReady, onError]);

  return <div ref={host} className="absolute inset-0 h-full w-full overflow-hidden" />;
}
