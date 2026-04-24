const OBJECTS = [
  // Carros grandes
  { icon: '🚗', x: 5,   y: 10,  size: 72, delay: 0,   dur: 7.2, rot: -12 },
  { icon: '🚙', x: 78,  y: 8,   size: 80, delay: 1.4, dur: 8.5, rot: 8   },
  { icon: '🚘', x: 12,  y: 70,  size: 76, delay: 2.8, dur: 6.9, rot: -6  },
  { icon: '🚗', x: 72,  y: 62,  size: 68, delay: 0.6, dur: 9.0, rot: 10  },
  { icon: '🚙', x: 40,  y: 78,  size: 64, delay: 3.2, dur: 7.6, rot: -8  },
  { icon: '🚘', x: 86,  y: 40,  size: 72, delay: 1.8, dur: 8.1, rot: 5   },

  // Peças
  { icon: '⚙️', x: 28,  y: 5,   size: 56, delay: 1.0, dur: 6.5, rot: 20  },
  { icon: '🔧', x: 60,  y: 22,  size: 48, delay: 2.2, dur: 7.8, rot: -25 },
  { icon: '🛞', x: 18,  y: 44,  size: 60, delay: 0.4, dur: 8.3, rot: 0   },
  { icon: '🔩', x: 50,  y: 50,  size: 44, delay: 3.5, dur: 6.7, rot: 15  },
  { icon: '🔑', x: 88,  y: 78,  size: 46, delay: 1.6, dur: 7.2, rot: -18 },
  { icon: '⚡', x: 35,  y: 90,  size: 52, delay: 2.0, dur: 8.8, rot: 0   },
  { icon: '🛠️', x: 65,  y: 85,  size: 54, delay: 0.9, dur: 7.5, rot: 12  },
  { icon: '⚙️', x: 92,  y: 20,  size: 48, delay: 3.8, dur: 6.3, rot: -30 },
  { icon: '🔧', x: 3,   y: 88,  size: 42, delay: 1.3, dur: 9.2, rot: 22  },
  { icon: '🛞', x: 48,  y: 2,   size: 58, delay: 2.6, dur: 7.0, rot: 0   },
  { icon: '🏆', x: 22,  y: 25,  size: 44, delay: 0.7, dur: 8.6, rot: -5  },
  { icon: '🔩', x: 75,  y: 35,  size: 40, delay: 4.0, dur: 6.1, rot: 35  },
]

export default function FloatingBackground() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{
        zIndex: 0,
        background: 'linear-gradient(145deg, #0d47a1 0%, #1565c0 25%, #1976d2 50%, #1565c0 75%, #0d47a1 100%)',
      }}
    >
      {/* Radial glow spots */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 60% 50% at 20% 30%, rgba(25,118,210,0.6) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 80% 70%, rgba(13,71,161,0.8) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 50% 50%, rgba(21,101,192,0.4) 0%, transparent 80%)',
      }} />

      {/* Particle dots */}
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={`dot-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${(i * 37 + 13) % 100}%`,
            top: `${(i * 53 + 7) % 100}%`,
            width: i % 4 === 0 ? 4 : i % 3 === 0 ? 3 : 2,
            height: i % 4 === 0 ? 4 : i % 3 === 0 ? 3 : 2,
            background: 'rgba(255,255,255,0.35)',
            animation: `floatObj ${5 + (i % 5)}s ease-in-out ${(i % 40) * 0.2}s infinite`,
          }}
        />
      ))}

      {/* Floating objects */}
      {OBJECTS.map((obj, i) => (
        <div
          key={i}
          className="absolute select-none"
          style={{
            left: `${obj.x}%`,
            top: `${obj.y}%`,
            fontSize: obj.size,
            opacity: 0.22,
            transform: `rotate(${obj.rot}deg)`,
            animation: `floatObj ${obj.dur}s ease-in-out ${obj.delay}s infinite`,
            filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.3)) brightness(1.1)',
            willChange: 'transform',
          }}
        >
          {obj.icon}
        </div>
      ))}

      {/* Blue wave lines overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.8"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  )
}
