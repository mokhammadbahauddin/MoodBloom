"use client";
import React, { useEffect, useRef } from "react";

const vertexShaderSource = `
  attribute vec4 a_position;
  void main() {
    gl_Position = a_position;
  }
`;

const fragmentShaderSource = `
precision highp float;

uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uIntensity;

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    float time = iTime * 0.2;
    
    // Wave calculations for "Breathing" effect
    float noise = sin(uv.x * 3.0 + time) * cos(uv.y * 2.0 - time * 1.5);
    noise += sin(uv.y * 4.0 + time * 0.8) * cos(uv.x * 5.0 + time);
    
    vec3 color = mix(uColorA, uColorB, uv.y + noise * 0.1 * uIntensity);
    
    // Soft glow pulse
    float pulse = (sin(time * 2.0) * 0.5 + 0.5) * 0.05 * uIntensity;
    color += pulse;

    gl_FragColor = vec4(color, 1.0);
}
`;

interface LiquidShaderProps {
  colorA?: [number, number, number];
  colorB?: [number, number, number];
  intensity?: number;
  className?: string;
}

/**
 * LiquidShader Component
 * A high-performance WebGL background that provides a "Breathing" atmosphere.
 * Designed for the Digital Oasis aesthetic.
 */
export const LiquidShader: React.FC<LiquidShaderProps> = ({
  colorA = [0.06, 0.09, 0.16], // Deep Navy
  colorB = [0.06, 0.72, 0.50], // Emerald
  intensity = 1.0,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const program = gl.createProgram()!;
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexShaderSource));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource));
    gl.linkProgram(program);
    gl.useProgram(program);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const iResolutionLocation = gl.getUniformLocation(program, "iResolution");
    const iTimeLocation = gl.getUniformLocation(program, "iTime");
    const uColorALocation = gl.getUniformLocation(program, "uColorA");
    const uColorBLocation = gl.getUniformLocation(program, "uColorB");
    const uIntensityLocation = gl.getUniformLocation(program, "uIntensity");

    let animationFrameId: number;
    const startTime = Date.now();

    const render = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      gl.uniform2f(iResolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(iTimeLocation, (Date.now() - startTime) / 1000);
      gl.uniform3f(uColorALocation, colorA[0], colorA[1], colorA[2]);
      gl.uniform3f(uColorBLocation, colorB[0], colorB[1], colorB[2]);
      gl.uniform1f(uIntensityLocation, intensity);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [colorA, colorB, intensity]);

  return <canvas ref={canvasRef} className={`fixed inset-0 w-full h-full -z-10 ${className}`} />;
};
