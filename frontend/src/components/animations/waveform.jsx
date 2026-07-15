import { useEffect, useRef, useState } from "react";

const BAR_COUNT = 32;

export default function VoiceWaveform({ stream }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!stream) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const audioContext = new AudioContext();

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / BAR_COUNT;

      for (let i = 0; i < BAR_COUNT; i++) {
        const value = dataArray[i] || 0;

        // Scale bar height
        const barHeight = Math.max(6, (value / 255) * canvas.height);

        //thinner bars
        const barArea = canvas.width / BAR_COUNT
        const barWidth = Math.max(1, Math.floor(barArea * 0.4)); 
        const gap = Math.max(2, Math.floor(barArea * 0.08));

        const x = i * barWidth;
        const y = (canvas.height - barHeight) / 2;

        // Rounded bars
        ctx.beginPath();
        ctx.roundRect(
          x + 2,
          y,
          barWidth - 4,
          barHeight,
          3
        );

        ctx.fillStyle = "#4C75F2";
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      source.disconnect();
      analyser.disconnect();
      audioContext.close();
    };
  }, [stream]);

  return (
    <canvas
      ref={canvasRef}
      width={900}
      height={40}
      className="w-full h-12"
    />
  );
}