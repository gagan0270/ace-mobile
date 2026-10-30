import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

/**
 * SplashScreen — Unified High Performance React Splash Screen
 * Matches Android Native Splash 1:1 with instant zero-delay presentation:
 * - Logo and "ACE PORTAL" text visible from Frame 0 (no two-stage jump)
 * - Pure #000000 background
 * - Subtle ambient breathing pulse
 * - Clean, swift fade-out exit
 */
export function SplashScreen({ isExiting = false }) {
  const containerRef = useRef(null);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 1 }}
      animate={{
        opacity: isExiting ? 0 : 1,
        scale: isExiting ? 1.02 : 1.0,
      }}
      transition={{
        duration: isExiting ? 0.25 : 0,
        ease: "easeOut",
      }}
      className="fixed inset-0 z-50 bg-[#000000] flex flex-col items-center justify-center pointer-events-none select-none overflow-hidden safe-top safe-bottom"
    >
      <div className="flex flex-col items-center justify-center gap-6">
        {/* SVG Mascot Logo (Instant Frame 0 Render with subtle ambient pulse) */}
        <motion.div
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-28 flex items-center justify-center"
        >
          <svg
            className="w-28 h-auto overflow-visible block filter drop-shadow-[0_0_24px_rgba(255,255,255,0.18)]"
            viewBox="0 0 56.668873 64.891806"
          >
            {/* Left Dot */}
            <g className="origin-center">
              <g transform="translate(-53.944816,116.891806) scale(0.1,-0.1)" fill="#ffffff">
                <path d="M566 1149 c-53 -42 -21 -139 46 -139 40 0 57 10 73 41 21 40 19 57 -14 90 -35 34 -68 37 -105 8z" />
              </g>
            </g>

            {/* Right Dot */}
            <g className="origin-center">
              <g transform="translate(-53.944816,116.891806) scale(0.1,-0.1)" fill="#ffffff">
                <path d="M975 1135 c-69 -68 19 -172 100 -119 43 28 41 96 -4 131 -26 20 -70 15 -96 -12z" />
              </g>
            </g>

            {/* Body Piece */}
            <g className="origin-bottom">
              <g transform="translate(-53.944816,116.891806) scale(0.1,-0.1)" fill="#ffffff">
                <path d="M722 991 c-66 -23 -126 -79 -158 -146 -20 -42 -24 -66 -24 -152 0 -98 1 -104 28 -134 53 -59 166 -44 192 27 6 14 10 65 10 113 0 69 -4 92 -16 102 -11 9 -20 10 -32 2 -13 -8 -18 -29 -20 -99 -3 -93 -11 -114 -46 -114 -38 0 -46 19 -46 107 0 63 5 93 19 121 54 104 168 148 266 103 90 -42 125 -104 125 -224 0 -88 -8 -107 -46 -107 -33 0 -38 14 -44 115 -5 83 -7 90 -27 93 -34 5 -46 -30 -41 -122 6 -115 38 -156 124 -156 28 0 44 8 70 34 l34 34 0 103 c0 122 -17 169 -83 237 -75 76 -180 99 -285 63z" />
              </g>
            </g>
          </svg>
        </motion.div>

        {/* Minimalist Sub-Label (Visible from start without delayed pop-in) */}
        <div className="text-[#8a8a8e] text-xs font-semibold uppercase tracking-[0.35em] text-center select-none">
          ACE PORTAL
        </div>
      </div>
    </motion.div>
  );
}

export default SplashScreen;
