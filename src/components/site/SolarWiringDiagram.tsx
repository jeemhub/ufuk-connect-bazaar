import { ConnectionType } from "@/lib/solarCalc";

interface Props {
  count: number;
  connection: ConnectionType;
  rows?: number;
  cols?: number;
  batteryVoltage: number;
  batteryAh: number;
  bankVoltage: number;
  bankAh: number;
}

const BATTERY_W = 56;
const BATTERY_H = 80;

function Battery({ x, y, label }: { x: number; y: number; label?: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect width={BATTERY_W} height={BATTERY_H} rx={6} fill="#1f2937" stroke="#F59E0B" strokeWidth={1.5} />
      <rect x={BATTERY_W / 2 - 8} y={-5} width={16} height={6} rx={1} fill="#F59E0B" />
      <text x={8} y={18} fill="#ef4444" fontSize="10" fontWeight="700">+</text>
      <text x={BATTERY_W - 14} y={BATTERY_H - 8} fill="#9ca3af" fontSize="10" fontWeight="700">−</text>
      <text x={BATTERY_W / 2} y={BATTERY_H / 2 + 4} textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="700">
        {label ?? "BAT"}
      </text>
    </g>
  );
}

function Inverter({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect width={90} height={110} rx={8} fill="#0f172a" stroke="#3B82F6" strokeWidth={2} />
      <text x={45} y={24} textAnchor="middle" fill="#3B82F6" fontSize="11" fontWeight="700">INVERTER</text>
      <text x={45} y={62} textAnchor="middle" fill="#fbbf24" fontSize="22" fontWeight="700">⚡</text>
      <text x={45} y={92} textAnchor="middle" fill="#9ca3af" fontSize="10">العاكس</text>
    </g>
  );
}

function Load({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx={28} cy={28} r={26} fill="#0f172a" stroke="#10b981" strokeWidth={2} />
      <text x={28} y={36} textAnchor="middle" fontSize="22">💡</text>
      <text x={28} y={70} textAnchor="middle" fill="#9ca3af" fontSize="10">الحمل</text>
    </g>
  );
}

const flowStyle: React.CSSProperties = {
  strokeDasharray: "6 4",
  animation: "solar-flow 1s linear infinite",
};

export function WiringDiagram({ count, connection, rows = 1, cols = 1, batteryAh, bankVoltage, bankAh }: Props) {
  const maxRender = 8;
  let displayCount = count;
  let extra = 0;

  // Determine layout
  let cellsR = 1;
  let cellsC = 1;
  if (connection === "single") {
    cellsR = 1;
    cellsC = 1;
    displayCount = 1;
  } else if (connection === "series") {
    displayCount = Math.min(count, maxRender);
    extra = count - displayCount;
    cellsR = 1;
    cellsC = displayCount;
  } else if (connection === "parallel") {
    displayCount = Math.min(count, maxRender);
    extra = count - displayCount;
    cellsR = displayCount;
    cellsC = 1;
  } else {
    cellsR = Math.min(rows, 4);
    cellsC = Math.min(cols, 4);
    displayCount = cellsR * cellsC;
    extra = rows * cols - displayCount;
  }

  const padding = 40;
  const gapX = 30;
  const gapY = 30;
  const gridW = cellsC * BATTERY_W + (cellsC - 1) * gapX;
  const gridH = cellsR * BATTERY_H + (cellsR - 1) * gapY;
  const inverterX = padding + gridW + 80;
  const loadX = inverterX + 90 + 70;
  const width = loadX + 56 + padding;
  const height = Math.max(gridH, 110) + padding * 2 + 30;
  const gridY = padding + (height - padding * 2 - gridH) / 2;
  const invY = padding + (height - padding * 2 - 110) / 2;

  const batteries: { x: number; y: number; label: string }[] = [];
  for (let r = 0; r < cellsR; r++) {
    for (let c = 0; c < cellsC; c++) {
      batteries.push({
        x: padding + c * (BATTERY_W + gapX),
        y: gridY + r * (BATTERY_H + gapY),
        label: `${batteryAh}Ah`,
      });
    }
  }

  // Wires (simplified): from rightmost battery group to inverter
  const wireStartX = padding + gridW;
  const wireMidX = wireStartX + 40;
  const invInY = invY + 30;
  const invInY2 = invY + 80;

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-amber-500/20 bg-[#0A0E1A] p-4">
      <style>{`@keyframes solar-flow { to { stroke-dashoffset: -20; } }`}</style>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 600 }}>
        {/* grid texture */}
        <defs>
          <pattern id="solargrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#solargrid)" />

        {batteries.map((b, i) => (
          <Battery key={i} x={b.x} y={b.y} label={b.label} />
        ))}

        {/* + wire (red) */}
        <path
          d={`M ${wireStartX} ${gridY + 10} H ${wireMidX} V ${invInY} H ${inverterX}`}
          fill="none"
          stroke="#ef4444"
          strokeWidth={2.5}
          style={flowStyle}
        />
        {/* - wire (black/gray) */}
        <path
          d={`M ${wireStartX} ${gridY + gridH - 10} H ${wireMidX + 10} V ${invInY2} H ${inverterX}`}
          fill="none"
          stroke="#9ca3af"
          strokeWidth={2.5}
          style={flowStyle}
        />

        <Inverter x={inverterX} y={invY} />

        {/* AC out wire to load */}
        <path
          d={`M ${inverterX + 90} ${invY + 55} H ${loadX}`}
          fill="none"
          stroke="#10b981"
          strokeWidth={2.5}
          style={flowStyle}
        />

        <Load x={loadX} y={invY + 27} />

        {/* labels */}
        <text x={padding} y={20} fill="#fbbf24" fontSize="11" fontWeight="700">
          البنك: {bankVoltage}V — {bankAh}Ah
        </text>
        {extra > 0 && (
          <text x={padding} y={height - 12} fill="#9ca3af" fontSize="11">
            + {extra} بطارية إضافية
          </text>
        )}
      </svg>
    </div>
  );
}
