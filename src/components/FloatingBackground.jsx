const OBJECTS = [
  { icon: '🚗', x: 3,   y: 8,   size: 55, delay: 0,   dur: 6.2 },
  { icon: '🔧', x: 88,  y: 12,  size: 46, delay: 1.2, dur: 7.5 },
  { icon: '⚙️', x: 10,  y: 62,  size: 62, delay: 2.5, dur: 8.1 },
  { icon: '🚙', x: 80,  y: 50,  size: 64, delay: 0.8, dur: 5.8 },
  { icon: '⚡', x: 47,  y: 3,   size: 42, delay: 1.8, dur: 9.0 },
  { icon: '🛞', x: 67,  y: 76,  size: 60, delay: 3.2, dur: 6.5 },
  { icon: '🔩', x: 20,  y: 38,  size: 44, delay: 2.0, dur: 7.3 },
  { icon: '🚘', x: 57,  y: 32,  size: 62, delay: 1.0, dur: 8.7 },
  { icon: '🏆', x: 33,  y: 72,  size: 48, delay: 0.5, dur: 7.0 },
  { icon: '🔑', x: 73,  y: 20,  size: 42, delay: 3.0, dur: 6.2 },
  { icon: '🚗', x: 6,   y: 82,  size: 52, delay: 1.5, dur: 9.2 },
  { icon: '⚙️', x: 92,  y: 66,  size: 52, delay: 2.8, dur: 7.1 },
  { icon: '🔧', x: 42,  y: 52,  size: 38, delay: 0.3, dur: 8.0 },
  { icon: '⚡', x: 18,  y: 22,  size: 36, delay: 4.0, dur: 6.8 },
  { icon: '🚙', x: 55,  y: 88,  size: 56, delay: 2.2, dur: 8.3 },
  { icon: '🛞', x: 28,  y: 14,  size: 46, delay: 1.7, dur: 7.6 },
  { icon: '🔑', x: 62,  y: 6,   size: 40, delay: 3.5, dur: 6.4 },
  { icon: '🏆', x: 85,  y: 85,  size: 52, delay: 0.9, dur: 9.1 },
]

export default function FloatingBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {OBJECTS.map((obj, i) => (
        <div
          key={i}
          className="absolute select-none"
          style={{
            left: `${obj.x}%`,
            top: `${obj.y}%`,
            fontSize: obj.size,
            opacity: 0.7,
            animation: `floatObj ${obj.dur}s ease-in-out ${obj.delay}s infinite`,
            filter: 'drop-shadow(0 0 22px rgba(59,130,246,0.7)) brightness(1.15)',
            willChange: 'transform',
          }}
        >
          {obj.icon}
        </div>
      ))}
    </div>
  )
}
