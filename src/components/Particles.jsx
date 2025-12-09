import React from "react";
import { useEffect, useRef } from "react";

// Utility function for className merging (simplified version)
const cn = (...classes) => classes.filter(Boolean).join(' ');

export const Particles = ({
  className = "",
  quantity = 100,
  ease = 50,
  size = 0.4,
  refresh = false,
  color = "#ffffff",
  vx = 0,
  vy = 0,
}) => {
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const context = useRef(null);
  const circles = useRef([]);
  const canvasSize = useRef({ w: 0, h: 0 });
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;

  useEffect(() => {
    if (canvasRef.current) {
      context.current = canvasRef.current.getContext("2d");
    }
    initCanvas();
    animate();
    window.addEventListener("resize", initCanvas);
    return () => {
      window.removeEventListener("resize", initCanvas);
    };
  }, [color]);

  useEffect(() => {
    initCanvas();
  }, [refresh]);

  const initCanvas = () => {
    resizeCanvas();
    drawParticles();
  };

  const resizeCanvas = () => {
    if (canvasContainerRef.current && canvasRef.current && context.current) {
      circles.current.length = 0;
      canvasSize.current.w = canvasContainerRef.current.offsetWidth;
      canvasSize.current.h = canvasContainerRef.current.offsetHeight;
      canvasRef.current.width = canvasSize.current.w * dpr;
      canvasRef.current.height = canvasSize.current.h * dpr;
      canvasRef.current.style.width = `${canvasSize.current.w}px`;
      canvasRef.current.style.height = `${canvasSize.current.h}px`;
      context.current.scale(dpr, dpr);
    }
  };

  const circleParams = () => {
    const x = Math.floor(Math.random() * canvasSize.current.w);
    const y = Math.floor(Math.random() * canvasSize.current.h);
    const pSize = Math.floor(Math.random() * 2) + size;
    const alpha = 0;
    const targetAlpha = parseFloat((Math.random() * 0.2 + 0.05).toFixed(1));
    const dx = (Math.random() - 0.5) * 0.05;
    const dy = (Math.random() - 0.5) * 0.05;
    
    // Calculate fade speed for 8-15 second cycles
    // At 60fps: 8 seconds = 480 frames, 15 seconds = 900 frames
    // fadeSpeed = targetAlpha / (frames * 2) for full cycle (fade in + fade out)
    const cycleTime = 8 + Math.random() * 7; // 8-15 seconds
    const framesPerCycle = cycleTime * 60; // 60fps
    const fadeSpeed = targetAlpha / (framesPerCycle / 2); // Half cycle for fade in/out
    
    const fadeDirection = Math.random() > 0.5 ? 1 : -1; // Random fade direction
    return {
      x,
      y,
      size: pSize,
      alpha,
      targetAlpha,
      dx,
      dy,
      fadeSpeed,
      fadeDirection,
    };
  };

  const hexToRgb = (hex) => {
    hex = hex.replace("#", "");
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    }
    const hexInt = parseInt(hex, 16);
    const red = (hexInt >> 16) & 255;
    const green = (hexInt >> 8) & 255;
    const blue = hexInt & 255;
    return [red, green, blue];
  };

  const rgb = hexToRgb(color);

  const drawCircle = (circle, update = false) => {
    if (context.current) {
      const { x, y, size, alpha } = circle;
      context.current.beginPath();
      context.current.arc(x, y, size, 0, 2 * Math.PI);
      context.current.fillStyle = `rgba(${rgb.join(", ")}, ${alpha})`;
      context.current.fill();
      if (!update) {
        circles.current.push(circle);
      }
    }
  };

  const clearContext = () => {
    if (context.current) {
      context.current.clearRect(
        0,
        0,
        canvasSize.current.w,
        canvasSize.current.h,
      );
    }
  };

  const drawParticles = () => {
    clearContext();
    const particleCount = quantity;
    for (let i = 0; i < particleCount; i++) {
      const circle = circleParams();
      drawCircle(circle);
    }
  };

  const remapValue = (
    value,
    start1,
    end1,
    start2,
    end2,
  ) => {
    const remapped =
      ((value - start1) * (end2 - start2)) / (end1 - start1) + start2;
    return remapped > 0 ? remapped : 0;
  };

  const animate = () => {
    clearContext();
    circles.current.forEach((circle, i) => {
      // Handle fade in/out effect
      circle.alpha += circle.fadeSpeed * circle.fadeDirection;
      
      // Reverse fade direction when reaching limits
      if (circle.alpha <= 0) {
        circle.alpha = 0;
        circle.fadeDirection = 1; // Start fading in
      } else if (circle.alpha >= circle.targetAlpha) {
        circle.alpha = circle.targetAlpha;
        circle.fadeDirection = -1; // Start fading out
      }
      
      // Move particles
      circle.x += circle.dx + vx;
      circle.y += circle.dy + vy;
      
      drawCircle(circle, true);
      
      // Reset particle position when it goes out of bounds
      if (
        circle.x < -circle.size ||
        circle.x > canvasSize.current.w + circle.size ||
        circle.y < -circle.size ||
        circle.y > canvasSize.current.h + circle.size
      ) {
        // Remove the circle from the array
        circles.current.splice(i, 1);
        // Create a new circle
        const newCircle = circleParams();
        drawCircle(newCircle);
      }
    });
    window.requestAnimationFrame(animate);
  };

  return (
    <div
      className={cn("pointer-events-none", className)}
      ref={canvasContainerRef}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
};

Particles.displayName = "Particles";
