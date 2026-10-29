import React, { useState, useEffect, useRef } from "react";

/**
 * High-performance range slider that updates its visual thumb position at 60fps
 * using local state and only triggers `onChangeCommitted` when the user finishes
 * dragging (or after a 140ms debounce), preventing network spam on every pixel.
 */
export default function BufferedRangeSlider({
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChangeCommitted,
  className = "w-full accent-cyan-400 cursor-pointer",
  disabled = false,
}) {
  const [localVal, setLocalVal] = useState(value);
  const draggingRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!draggingRef.current) {
      setLocalVal(value);
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const commitValue = (nextVal) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    draggingRef.current = false;
    const num = Number(nextVal);
    if (Number.isFinite(num) && Math.abs(num - Number(value)) > 1e-6) {
      onChangeCommitted?.(num);
    }
  };

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      value={localVal ?? 0}
      onChange={(e) => {
        const next = Number(e.target.value);
        draggingRef.current = true;
        setLocalVal(next);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          commitValue(next);
        }, 160);
      }}
      onMouseUp={(e) => commitValue(e.currentTarget.value)}
      onTouchEnd={(e) => commitValue(e.currentTarget.value)}
      onKeyUp={(e) => commitValue(e.currentTarget.value)}
      className={className}
    />
  );
}

