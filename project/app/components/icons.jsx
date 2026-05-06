/* Status card icons — clean blob shapes with optional alarm blink */
const { motion: motionIcons } = window.Motion;

function AlarmWrap({ alarm, color, alarmColor, children, filterId }) {
  // children must be a function that takes a fill color and returns the SVG path/group.
  return (
    <motionIcons.g
      animate={alarm ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
      transition={alarm ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
    >
      {children(alarm ? alarmColor : color)}
    </motionIcons.g>
  );
}

/* ----- Sensors: sine-wave blob ----- */
function IconSensors({ alarm = false }) {
  const color = "#A8E000";       // calm chartreuse — matches Surdis lime family
  const alarmColor = "#FF3B3B";
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg viewBox="0 0 220 200" className="absolute" style={{ left: 130, top: -10, width: 230, height: 220, filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.18))" }}>
        <AlarmWrap alarm={alarm} color={color} alarmColor={alarmColor}>
          {(c) => (
            <g transform="rotate(-12 110 100)">
              {/* Wavy blob: a fat sine path made into a closed shape */}
              <path
                d="M 18 110
                   C 30 60, 70 60, 90 100
                   C 110 140, 150 140, 170 100
                   C 188 65, 210 75, 208 105
                   C 206 135, 188 155, 150 155
                   C 110 155, 80 135, 50 145
                   C 22 153, 10 138, 18 110 Z"
                fill={c}
              />
              {/* Subtle inner sine line */}
              <path
                d="M 30 115 C 55 80, 90 145, 115 110 C 140 75, 175 145, 200 110"
                stroke="rgba(0,0,0,0.18)" strokeWidth="3" fill="none" strokeLinecap="round"
              />
            </g>
          )}
        </AlarmWrap>
      </svg>
    </div>
  );
}

/* ----- Power: plug + socket blob ----- */
function IconPower({ alarm = false }) {
  const color = "#C2FF33";
  const alarmColor = "#FF3B3B";
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg viewBox="0 0 220 200" className="absolute" style={{ left: 150, top: -5, width: 220, height: 210, filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.18))" }}>
        <AlarmWrap alarm={alarm} color={color} alarmColor={alarmColor}>
          {(c) => (
            <g transform="rotate(18 110 100)">
              {/* Plug body — rounded squircle */}
              <path
                d="M 50 60
                   C 50 40, 70 30, 100 30
                   L 150 30
                   C 180 30, 200 40, 200 60
                   L 200 130
                   C 200 165, 175 180, 145 175
                   C 115 170, 85 180, 60 160
                   C 35 138, 35 95, 50 60 Z"
                fill={c}
              />
              {/* Two prong holes */}
              <ellipse cx="100" cy="85" rx="6" ry="22" fill="rgba(0,0,0,0.45)" />
              <ellipse cx="150" cy="85" rx="6" ry="22" fill="rgba(0,0,0,0.45)" />
              {/* Cable bump */}
              <path d="M 110 25 C 110 10, 140 10, 140 25 Z" fill={c} />
            </g>
          )}
        </AlarmWrap>
      </svg>
    </div>
  );
}

/* ----- Climate: bold cloud-fan hybrid blob (we keep the climate as alarm-style red, default normal-green) ----- */
function IconClimate({ alarm = false }) {
  const color = "#A8E000";
  const alarmColor = "#FF3B3B";
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg viewBox="0 0 220 200" className="absolute" style={{ left: 155, top: 0, width: 215, height: 200, filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.18))" }}>
        <AlarmWrap alarm={alarm} color={color} alarmColor={alarmColor}>
          {(c) => (
            <g transform="translate(0,0)">
              {/* Cloud-like blob */}
              <path
                d="M 40 110
                   C 40 80, 65 70, 85 75
                   C 92 50, 125 45, 140 65
                   C 165 55, 195 70, 195 100
                   C 210 110, 205 145, 175 145
                   L 65 145
                   C 35 145, 25 130, 40 110 Z"
                fill={c}
              />
              {/* 3 wind streaks */}
              <path d="M 80 165 L 200 165" stroke={c} strokeWidth="9" strokeLinecap="round" />
              <path d="M 70 178 L 170 178" stroke={c} strokeWidth="7" strokeLinecap="round" opacity="0.85" />
              <path d="M 95 190 L 175 190" stroke={c} strokeWidth="6" strokeLinecap="round" opacity="0.7" />
            </g>
          )}
        </AlarmWrap>
      </svg>
    </div>
  );
}

/* ----- Modbus: chain links blob ----- */
function IconModbus({ alarm = false }) {
  const color = "#C2FF33";
  const alarmColor = "#FF3B3B";
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg viewBox="0 0 220 200" className="absolute" style={{ left: 145, top: -5, width: 230, height: 210, filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.18))" }}>
        <AlarmWrap alarm={alarm} color={color} alarmColor={alarmColor}>
          {(c) => (
            <g transform="rotate(-22 110 100)">
              {/* Left link */}
              <path
                d="M 35 100
                   C 35 65, 60 50, 90 55
                   C 120 60, 130 80, 125 105
                   C 120 130, 95 145, 70 138
                   C 45 132, 35 120, 35 100 Z"
                fill={c}
              />
              <ellipse cx="80" cy="100" rx="22" ry="22" fill="rgba(0,0,0,0.0)" stroke="rgba(0,0,0,0.35)" strokeWidth="6" />
              {/* Right link, overlapping */}
              <path
                d="M 110 100
                   C 110 65, 135 50, 165 55
                   C 195 60, 205 80, 200 105
                   C 195 130, 170 145, 145 138
                   C 120 132, 110 120, 110 100 Z"
                fill={c}
              />
              <ellipse cx="155" cy="100" rx="22" ry="22" fill="rgba(0,0,0,0.0)" stroke="rgba(0,0,0,0.35)" strokeWidth="6" />
            </g>
          )}
        </AlarmWrap>
      </svg>
    </div>
  );
}

/* ----- Small inline header icons ----- */
function MiniSensors({ color }) { return <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M2 11 C5 5, 9 17, 11 11 C13 5, 17 17, 20 11" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" /></svg>; }
function MiniPower({ color })   { return <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="6" y="3" width="10" height="13" rx="3" stroke={color} strokeWidth="1.8" fill="none" /><line x1="9" y1="6" x2="9" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" /><line x1="13" y1="6" x2="13" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" /><path d="M11 16 V20" stroke={color} strokeWidth="1.8" strokeLinecap="round" /></svg>; }
function MiniClimate({ color }) { return <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 11 C3 8, 6 7, 8 8 C9 4, 14 4, 15 8 C18 7, 20 9, 19 12" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" /><path d="M5 16 H17" stroke={color} strokeWidth="1.8" strokeLinecap="round" /><path d="M7 19 H15" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function MiniModbus({ color })  { return <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="8" cy="11" r="4" stroke={color} strokeWidth="1.8" fill="none" /><circle cx="14" cy="11" r="4" stroke={color} strokeWidth="1.8" fill="none" /></svg>; }

window.SurdisIcons = { IconSensors, IconPower, IconClimate, IconModbus, MiniSensors, MiniPower, MiniClimate, MiniModbus };
