import { useEffect, useRef } from "react";
import * as THREE from "three";

// A demand-rendered studio scene: no animation loop remains active at rest.
export default function LampScene({ lit }) {
  const host = useRef(null);
  const engine = useRef(null);
  useEffect(() => {
    const container = host.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    container.dataset.ready = "true";
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
    camera.position.set(4, 3.1, 5.5);
    camera.lookAt(0, 1.5, 0);
    const lamp = new THREE.Group();
    scene.add(lamp);
    const wine = new THREE.MeshStandardMaterial({
      color: 0x591d27,
      metalness: 0.7,
      roughness: 0.28,
    });
    const brass = new THREE.MeshStandardMaterial({
      color: 0xb59a6b,
      metalness: 0.78,
      roughness: 0.3,
    });
    const inner = new THREE.MeshStandardMaterial({
      color: 0xf5dfb6,
      side: THREE.DoubleSide,
      roughness: 0.6,
    });
    function mesh(geo, mat, x, y, z) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      lamp.add(m);
      return m;
    }
    mesh(new THREE.CylinderGeometry(0.78, 0.87, 0.13, 64), wine, 0.45, 0.1, 0);
    mesh(
      new THREE.CylinderGeometry(0.66, 0.76, 0.045, 64),
      brass,
      0.45,
      0.03,
      0,
    );
    mesh(new THREE.CylinderGeometry(0.055, 0.07, 2.5, 24), brass, 0.45, 1.4, 0);
    const arm = mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 1.35, 24),
      brass,
      -0.12,
      2.65,
      0,
    );
    arm.rotation.z = -Math.PI / 2;
    mesh(new THREE.SphereGeometry(0.13, 24, 24), brass, 0.45, 2.65, 0);
    const shade = new THREE.Group();
    shade.position.set(-0.8, 2.62, 0);
    lamp.add(shade);
    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.85, 0.65, 64, 1, true),
      wine,
    );
    shade.add(shell);
    shell.castShadow = true;
    const lining = new THREE.Mesh(
      new THREE.CylinderGeometry(0.215, 0.83, 0.64, 64, 1, true),
      inner,
    );
    shade.add(lining);
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.84, 0.025, 12, 64),
      brass,
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = -0.325;
    shade.add(rim);
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xffeac5,
      emissive: 0xffc878,
      emissiveIntensity: 0,
    });
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 24, 24),
      bulbMat,
    );
    bulb.position.y = -0.18;
    shade.add(bulb);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.ShadowMaterial({ opacity: 0.3 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    // A soft pool of reflected light on the same ground plane as the real shadow.
    const poolMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { power: { value: 0 } },
      vertexShader:
        "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader:
        "varying vec2 vUv; uniform float power; void main(){float falloff=pow(max(0.0,1.0-length(vUv-0.5)*2.0),2.0);gl_FragColor=vec4(1.0,0.76,0.35,falloff*power*0.35);}",
    });
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), poolMaterial);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(-0.9, 0.005, 0.5);
    scene.add(pool);
    inner.emissive.setHex(0xffd295);
    const spot = new THREE.SpotLight(0xffd49a, 0, 15, Math.PI / 3, 0.7, 1.3);
    spot.position.set(-0.8, 2.4, 0);
    spot.target.position.set(-1, 0, 0.7);
    spot.castShadow = true;
    spot.shadow.mapSize.set(512, 512);
    scene.add(spot, spot.target);
    scene.add(new THREE.HemisphereLight(0xffe5cf, 0x3b2933, 2));
    const key = new THREE.DirectionalLight(0xffead6, 4);
    key.position.set(-3, 5, 4);
    scene.add(key);
    const edge = new THREE.DirectionalLight(0xc5cde2, 3);
    edge.position.set(3, 3, -2);
    scene.add(edge);
    let frame = 0,
      value = 0,
      target = 0,
      visible = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let last = 0;
    function draw(time = 0) {
      cancelAnimationFrame(frame);
      if (!visible || document.hidden) return;
      const delta = Math.min(time - last || 16, 50);
      last = time;
      value = reduced.matches
        ? target
        : THREE.MathUtils.damp(value, target, 4.8, delta / 1000);
      if (Math.abs(value - target) < 0.002) value = target;
      spot.intensity = value * 32;
      poolMaterial.uniforms.power.value = value;
      inner.emissiveIntensity = value * 0.8;
      bulbMat.emissiveIntensity = value * 5;
      shade.rotation.z = Math.sin(value * Math.PI) * 0.09;
      key.intensity = 3 + value * 2;
      renderer.render(scene, camera);
      if (value !== target) frame = requestAnimationFrame(draw);
    }
    engine.current = {
      set(value) {
        target = value ? 1 : 0;
        last = 0;
        draw();
      },
    };
    const resize = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      draw();
    });
    resize.observe(container);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      draw();
    });
    observer.observe(container);
    const visibility = () => draw();
    document.addEventListener("visibilitychange", visibility);
    const lost = (e) => {
      e.preventDefault();
      container.dataset.ready = "false";
      cancelAnimationFrame(frame);
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      scene.traverse((o) => {
        o.geometry?.dispose();
        if (o.material) o.material.dispose();
      });
      spot.shadow.dispose();
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      renderer.dispose();
      renderer.domElement.remove();
      engine.current = null;
    };
  }, []);
  useEffect(() => {
    engine.current?.set(lit);
  }, [lit]);
  return (
    <div className="lamp-canvas" ref={host} aria-hidden="true">
      <div className="lamp-fallback">
        <i />
        <b />
        <span />
      </div>
    </div>
  );
}
