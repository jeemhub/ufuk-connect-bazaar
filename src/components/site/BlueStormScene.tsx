import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

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
    renderer.toneMappingExposure = 1.18;
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%";
    renderer.domElement.setAttribute("aria-hidden", "true");
    element.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const studioReflection = pmrem.fromScene(room);
    room.dispose();
    scene.environment = studioReflection.texture;
    scene.environmentIntensity = 0.45;
    scene.add(new THREE.HemisphereLight(0xe9f2ff, 0x645247, 1.8));
    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(-3, 5, 8);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7eafff, 1.7);
    rim.position.set(5, 3, -4);
    scene.add(rim);
    const plugLight = new THREE.DirectionalLight(0xffffff, 1.4);
    plugLight.position.set(8, 2, 2);
    scene.add(plugLight);

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    const look = new THREE.Vector3();
    const desiredLook = new THREE.Vector3();
    const desiredPosition = new THREE.Vector3();
    const connectorPosition = new THREE.Vector3();
    const plugFace = new THREE.Vector3();
    const plugForward = new THREE.Vector3();
    const plugRotation = new THREE.Quaternion();
    const sidePosition = new THREE.Vector3();
    const frontPosition = new THREE.Vector3();
    const cableEnd = new THREE.Vector3();
    const ringVertex = new THREE.Vector3();
    const bootInset = new THREE.Vector3();
    let model: THREE.Group | null = null;
    let cable: THREE.Mesh | null = null;
    let connector: THREE.Object3D | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    let frame = 0;
    let disposed = false;
    let readyNotified = false;
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
        const cableObject = model.getObjectByName("PullableOuterCable");
        cable = cableObject instanceof THREE.Mesh ? cableObject : null;
        connector = model.getObjectByName("RJ45Connector") ?? null;
        model.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) {
            if (!(material instanceof THREE.MeshPhysicalMaterial)) continue;
            if (material.name.includes("Clear RJ45 polycarbonate shell")) {
              material.transmission = 0;
              material.transparent = true;
              material.opacity = 0.17;
              material.depthWrite = false;
              material.roughness = 0.08;
              material.side = THREE.DoubleSide;
              material.needsUpdate = true;
            } else if (material.name.includes("RJ45 clear edge refraction")) {
              material.transmission = 0;
              material.transparent = true;
              material.opacity = 0.31;
              material.depthWrite = false;
              material.roughness = 0.12;
              material.side = THREE.DoubleSide;
              material.needsUpdate = true;
            }
          }
        });
        scene.add(model);
        if (gltf.animations[0]) {
          mixer = new THREE.AnimationMixer(model);
          mixer.clipAction(gltf.animations[0]).play();
        }
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

      if (cable && connector?.parent) {
        // The cable uses morph targets, while the plug has a separate position track.
        // Follow the actual last ring of the morphed cable so interpolation cannot open a gap.
        const lastVertex = cable.geometry.attributes.position.count - 1;
        cableEnd.set(0, 0, 0);
        for (let index = lastVertex - 8; index <= lastVertex; index++) {
          cable.getVertexPosition(index, ringVertex);
          cableEnd.add(ringVertex);
        }
        cableEnd.multiplyScalar(1 / 9);
        cable.localToWorld(cableEnd);
        connector.parent.worldToLocal(cableEnd);
        bootInset.set(0.17, 0, 0).applyQuaternion(connector.quaternion);
        connector.position.copy(cableEnd).add(bootInset);
        connector.updateMatrixWorld(true);
      }

      const detail = smooth((value - 0.60) / 0.28);
      const frontView = smooth((value - 0.78) / 0.22);
      const isMobile = width < 768;
      const showCable = smooth((value - 0.2) / 0.45);
      const baseLook = new THREE.Vector3(showCable * (isMobile ? 1.2 : 1.6), 0, 0);
      const basePosition = new THREE.Vector3(
        isMobile ? 4.1 : 4.5,
        isMobile ? 1.8 : 1.9,
        isMobile ? 9.0 : 7.8,
      );
      basePosition.x += showCable * 0.5;
      basePosition.z += showCable * (isMobile ? 2.6 : 3.0);

      if (connector) {
        connector.getWorldPosition(connectorPosition);
        connector.getWorldQuaternion(plugRotation);
        plugForward.set(1, 0, 0).applyQuaternion(plugRotation).normalize();
        plugFace.set(0.62, 0, 0).applyMatrix4(connector.matrixWorld);
      } else {
        connectorPosition.set(4.5, -1, 0.5);
        plugForward.set(1, 0, 0);
        plugFace.copy(connectorPosition).addScaledVector(plugForward, 0.62);
      }
      desiredLook.copy(baseLook).lerp(connectorPosition, detail);
      sidePosition.copy(connectorPosition).add(new THREE.Vector3(isMobile ? 1.0 : 0.8, 0.65, isMobile ? 4.4 : 3.0));
      desiredPosition.copy(basePosition).lerp(sidePosition, detail);

      // Orbit around the tip so the last scroll beat shows the eight-contact face head-on.
      frontPosition.copy(plugFace).addScaledVector(plugForward, isMobile ? 1.7 : 1.45);
      frontPosition.y += 0.14;
      frontPosition.z += 0.10;
      desiredLook.lerp(plugFace, frontView);
      desiredPosition.lerp(frontPosition, frontView);

      if (camera.position.lengthSq() === 0) {
        camera.position.copy(desiredPosition);
        look.copy(desiredLook);
      } else {
        camera.position.lerp(desiredPosition, 0.13);
        look.lerp(desiredLook, 0.13);
      }
      camera.lookAt(look);
      renderer.render(scene, camera);
      if (model && !readyNotified) {
        readyNotified = true;
        onReady();
      }
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
      studioReflection.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [progress, onReady, onError]);

  return <div ref={host} className="absolute inset-0 h-full w-full overflow-hidden" />;
}
