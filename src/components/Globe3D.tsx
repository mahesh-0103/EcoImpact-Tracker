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
    camera.position.z = 5; // Adjusted for better view

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);

    // Globe Base (transparent sphere)
    const geometry = new THREE.SphereGeometry(2, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x064e3b, // Dark green base
      transparent: true,
      opacity: 0.1,
    });
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // Add Dotted Points
    const dotsGeometry = new THREE.BufferGeometry();
    const dotPositions = [];
    const dotCount = 500; // Number of dots
    for (let i = 0; i < dotCount; i++) {
      const theta = Math.random() * Math.PI; // Latitude
      const phi = Math.random() * 2 * Math.PI; // Longitude
      const x = 2 * Math.sin(theta) * Math.cos(phi);
      const y = 2 * Math.sin(theta) * Math.sin(phi);
      const z = 2 * Math.cos(theta);
      dotPositions.push(x, y, z);
    }
    dotsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
    const dotsMaterial = new THREE.PointsMaterial({ color: 0x64ffda, size: 0.05 });
    const dots = new THREE.Points(dotsGeometry, dotsMaterial);
    scene.add(dots);

    // Animation Loop
    const animate = () => {
      globe.rotation.y += 0.002; // Slow rotation
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
      className="w-full h-[400px] relative" // Fixed height for consistency
      style={{
        aspectRatio: '1 / 1',
        maxWidth: '100%',
        clipPath: 'circle(50% at 50% 50%)',
      }}
    />
  );
};

export default Globe3D;
