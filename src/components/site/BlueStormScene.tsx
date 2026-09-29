import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type Props = {
  progress: React.MutableRefObject<number>;
  onReady: () => void;
  onError: () => void;
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

export default function BlueStormScene({ progress, onReady, onError }: Props) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = host.current;
    if (!element) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      onError();
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.55;
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%";
    renderer.domElement.setAttribute("aria-hidden", "true");
    element.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xe9f2ff, 0x645247, 3));
    const key = new THREE.DirectionalLight(0xffffff, 4.2);
    key.position.set(-3, 5, 8);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7eafff, 3);
    rim.position.set(5, 3, -4);
    scene.add(rim);

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    const look = new THREE.Vector3();
    const desiredLook = new THREE.Vector3();
    const desiredPosition = new THREE.Vector3();
    const connectorPosition = new THREE.Vector3();
    let model: THREE.Group | null = null;
    let connector: THREE.Object3D | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    let frame = 0;
    let disposed = false;
    let width = 0;
    let height = 0;

    const resize = () => {
      const nextWidth = element.clientWidth;
      const nextHeight = element.clientHeight;
      if (!nextWidth || !nextHeight || (nextWidth === width && nextHeight === height)) return;
      width = nextWidth;
      height = nextHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.fov = width < 640 ? 44 : width < 1000 ? 40 : 36;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();

    new GLTFLoader().load(
      "/models/bluestorm-lan-reel.glb",
      (gltf) => {
        if (disposed) return;
        model = gltf.scene;
        connector = model.getObjectByName("RJ45Connector") ?? null;
        scene.add(model);
        if (gltf.animations[0]) {
          mixer = new THREE.AnimationMixer(model);
          mixer.clipAction(gltf.animations[0]).play();
        }
        onReady();
      },
      undefined,
      () => { if (!disposed) onError(); },
    );

    const render = () => {
      frame = requestAnimationFrame(render);
      if (!model || !width || !height || document.hidden) return;

      const value = clamp(progress.current);
      // The final animation frames retract the cable. Scrolling down ends on its connector detail.
      const animationFrame = value < 0.56
        ? 1 + smooth(value / 0.56) * 63
        : value < 0.83
          ? 64 + smooth((value - 0.56) / 0.27) * 48
          : 112 + smooth((value - 0.83) / 0.17) * 24;
      mixer?.setTime(animationFrame / 30);
      model.updateMatrixWorld(true);

      const detail = smooth((value - 0.65) / 0.35);
      const isMobile = width < 768;
      const showCable = smooth((value - 0.2) / 0.45);
      const baseLook = new THREE.Vector3(showCable * (isMobile ? 0.55 : 0.9), 0, 0);
      const basePosition = new THREE.Vector3(
        isMobile ? 4.1 : 4.5,
        isMobile ? 1.8 : 1.9,
        isMobile ? 9.0 : 7.8,
      );
      basePosition.x += showCable * 0.5;
      basePosition.z += showCable * (isMobile ? 2.6 : 3.0);

      if (connector) connector.getWorldPosition(connectorPosition);
      else connectorPosition.set(4.5, -1, 0.5);
      desiredLook.copy(baseLook).lerp(connectorPosition, detail);
      desiredPosition.copy(basePosition).lerp(
        connectorPosition.clone().add(new THREE.Vector3(isMobile ? 1.0 : 0.8, 0.65, isMobile ? 4.4 : 3.0)),
        detail,
      );

      if (camera.position.lengthSq() === 0) {
        camera.position.copy(desiredPosition);
        look.copy(desiredLook);
      } else {
        camera.position.lerp(desiredPosition, 0.13);
        look.lerp(desiredLook, 0.13);
      }
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
      mixer?.stopAllAction();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [progress, onReady, onError]);

  return <div ref={host} className="absolute inset-0 h-full w-full overflow-hidden" />;
}
