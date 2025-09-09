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
    camera.position.z = 2.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);

    // Globe Geometry and Material
    const geometry = new THREE.SphereGeometry(1.5, 64, 64);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x64ffda, // A modern, techy green
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const globe = new THREE.Mesh(geometry, wireframeMaterial);
    scene.add(globe);

    // Animation Loop
    const animate = () => {
      globe.rotation.y += 0.001; // Slower, smoother rotation
      renderer.render(scene, camera);
      animationFrameId.current = requestAnimationFrame(animate);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      if (!currentMount) return;
      const { clientWidth, clientHeight } = currentMount;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="w-full h-full" 
      style={{ 
        aspectRatio: '1 / 1',
        maxWidth: '100%',
        maxHeight: '100%',
        clipPath: 'circle(50% at 50% 50%)', // Enforces a circular shape
      }}
    />
  );
};

export default Globe3D;
