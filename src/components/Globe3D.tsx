import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Globe3D = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Scene, Camera, and Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);

    // Globe with Texture
    const geometry = new THREE.SphereGeometry(2, 64, 64);
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/earth_atmos_2048.jpg', (texture) => {
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const globe = new THREE.Mesh(geometry, material);
      scene.add(globe);
    });

    // Animation Loop (static, just for rendering)
    const animate = () => {
      renderer.render(scene, camera);
      animationFrameId.current = requestAnimationFrame(animate);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      if (currentMount) {
        const { clientWidth, clientHeight } = currentMount;
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(clientWidth, clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (currentMount && renderer.domElement) currentMount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-[400px] relative"
      style={{
        aspectRatio: '1 / 1',
        maxWidth: '100%',
        clipPath: 'circle(50% at 50% 50%)',
      }}
    />
  );
};

export default Globe3D;
