import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ref, onValue, off } from "firebase/database";
import { database } from "../services/firebase";

export default function ThreeGlobe() {

  const mountRef = useRef(null);

  useEffect(() => {

    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    /* ---------- Scene ---------- */

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      60,
      width / height,
      0.1,
      1000
    );

    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });

    renderer.setPixelRatio(window.devicePixelRatio * 0.7);
    renderer.setSize(width, height);

    container.appendChild(renderer.domElement);

    /* ---------- Texture Loader ---------- */

    const loader = new THREE.TextureLoader();

    /* ---------- Earth ---------- */

    const earthTexture = loader.load(
      "https://unpkg.com/three-globe/example/img/earth-dark.jpg"
    );

    const globeGeometry = new THREE.SphereGeometry(5, 64, 64);

    const globeMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture
    });

    const globe = new THREE.Mesh(globeGeometry, globeMaterial);

    scene.add(globe);

    /* ---------- Atmosphere ---------- */

    const atmosphereGeometry = new THREE.SphereGeometry(5.2, 64, 64);

    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.12
    });

    const atmosphere = new THREE.Mesh(
      atmosphereGeometry,
      atmosphereMaterial
    );

    scene.add(atmosphere);

    /* ---------- Lights ---------- */

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 3, 5);
    scene.add(light);

    /* ---------- Sensor Markers ---------- */

    const sensorGroup = new THREE.Group();
    scene.add(sensorGroup);

    const addSensorPoint = (lat, lon, probability) => {

      const color =
        probability > 0.75
          ? 0xff0000
          : probability > 0.5
          ? 0xffaa00
          : 0x00ff88;

      const geometry = new THREE.SphereGeometry(0.08, 16, 16);

      const material = new THREE.MeshBasicMaterial({ color });

      const point = new THREE.Mesh(geometry, material);

      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);

      const r = 5;

      point.position.set(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );

      sensorGroup.add(point);

    };

    /* ---------- Firebase Sensors ---------- */

    const sensorRef = ref(database, "sensor_data");

    const unsubscribe = onValue(sensorRef, (snap) => {

      const data = snap.val();

      sensorGroup.clear();

      if (!data) return;

      Object.values(data).forEach((d) => {

        addSensorPoint(
          d?.lat || 28,
          d?.lon || 77,
          d?.prediction?.probability || 0
        );

      });

    });

    /* ---------- Storm Clouds ---------- */

    const cloudTexture = loader.load(
      "https://threejs.org/examples/textures/planets/earth_clouds_1024.png"
    );

    const cloudGeometry = new THREE.SphereGeometry(5.05, 64, 64);

    const cloudMaterial = new THREE.MeshLambertMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.3
    });

    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);

    scene.add(clouds);

    /* ---------- Animation ---------- */

    let animationId;

    const animate = () => {

      globe.rotation.y += 0.0015;
      clouds.rotation.y += 0.0017;

      renderer.render(scene, camera);

      animationId = requestAnimationFrame(animate);

    };

    animate();

    /* ---------- Resize Handling ---------- */

    const handleResize = () => {

      const w = container.clientWidth;
      const h = container.clientHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);

    };

    window.addEventListener("resize", handleResize);

    /* ---------- Cleanup ---------- */

    return () => {

      cancelAnimationFrame(animationId);

      off(sensorRef); // remove firebase listener

      window.removeEventListener("resize", handleResize);

      globeGeometry.dispose();
      globeMaterial.dispose();

      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();

      cloudGeometry.dispose();
      cloudMaterial.dispose();

      renderer.dispose();

      if (renderer.domElement && container) {
        container.removeChild(renderer.domElement);
      }

    };

  }, []);

  return (
    <div
      ref={mountRef}
    />
  );

}