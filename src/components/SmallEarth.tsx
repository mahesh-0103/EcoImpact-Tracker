import { useEffect, useRef } from 'react';

const SmallEarth = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use a fixed size for the canvas rendering to ensure consistency
    const size = 160; 
    canvas.width = size;
    canvas.height = size;
    const radius = size * 0.4;

    let rotation = 0;
    let raf = 0;

    const draw = () => {
      if (!ctx) return;

      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.translate(size / 2, size / 2);

      // Create realistic Earth with proper shading
      const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius * 1.2);
      gradient.addColorStop(0, '#87CEEB'); // Sky blue highlight
      gradient.addColorStop(0.3, '#4682B4'); // Steel blue
      gradient.addColorStop(0.7, '#2E8B57'); // Sea green
      gradient.addColorStop(1, '#1B4D3E'); // Dark green
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();

      // Add realistic continents with rotation
      ctx.save();
      ctx.rotate(rotation);
      
      // Continents using ellipses
      ctx.fillStyle = '#228B22'; // Dark green for landmasses
      ctx.beginPath();
      ctx.ellipse(-radius * 0.4, -radius * 0.1, radius * 0.25, radius * 0.15, 0.2, 0, Math.PI * 2); // N. America
      ctx.fill();
      
      ctx.fillStyle = '#32CD32'; // Lighter green
      ctx.beginPath();
      ctx.ellipse(radius * 0.1, radius * 0.2, radius * 0.2, radius * 0.3, -0.3, 0, Math.PI * 2); // Africa/Europe
      ctx.fill();
      
      ctx.fillStyle = '#2E8B57'; // Sea green
      ctx.beginPath();
      ctx.ellipse(radius * 0.5, -radius * 0.2, radius * 0.3, radius * 0.2, 0.5, 0, Math.PI * 2); // Asia
      ctx.fill();
      
      ctx.fillStyle = '#3CB371'; // Medium sea green
      ctx.beginPath();
      ctx.ellipse(radius * 0.2, radius * 0.45, radius * 0.15, radius * 0.1, -0.8, 0, Math.PI * 2); // Australia
      ctx.fill();
      
      ctx.restore();

      // Add atmospheric glow
      const glowGradient = ctx.createRadialGradient(0, 0, radius * 0.9, 0, 0, radius * 1.4);
      glowGradient.addColorStop(0, 'rgba(135, 206, 235, 0.15)');
      glowGradient.addColorStop(0.7, 'rgba(135, 206, 235, 0.05)');
      glowGradient.addColorStop(1, 'rgba(135, 206, 235, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Add subtle rim lighting for a 3D effect
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      rotation += 0.002; // Slow rotation for a calming effect
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full rounded-full drop-shadow-lg"
      />
      <div 
        className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/10 to-green-400/10 blur-md animate-pulse"
        style={{ pointerEvents: 'none' }} // Ensure canvas is interactive if needed
      ></div>
    </div>
  );
};

export default SmallEarth;
