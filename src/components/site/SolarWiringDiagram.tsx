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

const BATTERY_W = 64;
const BATTERY_H = 90;
const POS_OFFSET = 14; // x offset of + terminal from left of battery
const NEG_OFFSET = BATTERY_W - 14; // x offset of − terminal

const POS_COLOR = "#ef4444"; // red
const NEG_COLOR = "#9ca3af"; // gray
const AC_COLOR = "#10b981"; // green

const flowStyle: React.CSSProperties = {
  strokeDasharray: "6 4",
  animation: "solar-flow 1s linear infinite",
};

function Battery({ x, y, label }: { x: number; y: number; label?: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      {/* + terminal stub */}
      <rect x={POS_OFFSET - 6} y={-8} width={12} height={8} rx={1} fill={POS_COLOR} />
      {/* − terminal stub */}
      <rect x={NEG_OFFSET - 6} y={-6} width={12} height={6} rx={1} fill={NEG_COLOR} />
      {/* body */}
      <rect width={BATTERY_W} height={BATTERY_H} rx={6} fill="#FEF3C7" stroke="#F59E0B" strokeWidth={1.5} />
      <text x={POS_OFFSET} y={14} textAnchor="middle" fill={POS_COLOR} fontSize="11" fontWeight="700">+</text>
      <text x={NEG_OFFSET} y={14} textAnchor="middle" fill={NEG_COLOR} fontSize="13" fontWeight="700">−</text>
      <text x={BATTERY_W / 2} y={BATTERY_H / 2 + 4} textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="700">
        {label ?? "BAT"}
      </text>
      <text x={BATTERY_W / 2} y={BATTERY_H - 8} textAnchor="middle" fill="#475569" fontSize="8">BATTERY</text>
    </g>
  );
}

function Inverter({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect width={100} height={120} rx={8} fill="#F1F5F9" stroke="#3B82F6" strokeWidth={2} />
      <text x={50} y={26} textAnchor="middle" fill="#3B82F6" fontSize="11" fontWeight="700">INVERTER</text>
      <text x={50} y={68} textAnchor="middle" fill="#fbbf24" fontSize="26" fontWeight="700">⚡</text>
      <text x={50} y={100} textAnchor="middle" fill="#475569" fontSize="10">العاكس</text>
      {/* DC input markers */}
      <text x={-6} y={36} textAnchor="end" fill={POS_COLOR} fontSize="9" fontWeight="700">+DC</text>
      <text x={-6} y={92} textAnchor="end" fill={NEG_COLOR} fontSize="9" fontWeight="700">−DC</text>
      {/* AC out marker */}
      <text x={106} y={64} fill={AC_COLOR} fontSize="9" fontWeight="700">AC 220V</text>
    </g>
  );
}

function Load({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx={28} cy={28} r={26} fill="#F1F5F9" stroke={AC_COLOR} strokeWidth={2} />
      <text x={28} y={36} textAnchor="middle" fontSize="22">💡</text>
      <text x={28} y={70} textAnchor="middle" fill="#475569" fontSize="10">الحمل 220V</text>
    </g>
  );
}

interface Term { x: number; y: number }

export function WiringDiagram({ count, connection, rows = 1, cols = 1, batteryAh, bankVoltage, bankAh }: Props) {
  const maxRender = 8;

  // Determine layout
  let cellsR = 1;
  let cellsC = 1;
  let displayCount = 1;
  let extra = 0;

  if (connection === "single") {
    cellsR = 1; cellsC = 1; displayCount = 1;
  } else if (connection === "series") {
    displayCount = Math.min(count, maxRender);
    extra = count - displayCount;
    cellsR = 1; cellsC = displayCount;
  } else if (connection === "parallel") {
    displayCount = Math.min(count, maxRender);
    extra = count - displayCount;
    cellsR = displayCount; cellsC = 1;
  } else {
    cellsR = Math.min(rows, 4);
    cellsC = Math.min(cols, 4);
    displayCount = cellsR * cellsC;
    extra = rows * cols - displayCount;
  }

  const padding = 50;
  const gapX = 60;
  const gapY = 60;
  const gridW = cellsC * BATTERY_W + (cellsC - 1) * gapX;
  const gridH = cellsR * BATTERY_H + (cellsR - 1) * gapY;
  const inverterX = padding + gridW + 110;
  const loadX = inverterX + 100 + 80;
  const width = loadX + 56 + padding;
  const height = Math.max(gridH, 120) + padding * 2 + 40;
  const gridY = padding + (height - padding * 2 - gridH) / 2;
  const invY = padding + (height - padding * 2 - 120) / 2;

  // Compute battery positions and terminals
  type Cell = { x: number; y: number; pos: Term; neg: Term };
  const cells: Cell[][] = [];
  for (let r = 0; r < cellsR; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cellsC; c++) {
      const x = padding + c * (BATTERY_W + gapX);
      const y = gridY + r * (BATTERY_H + gapY);
      row.push({
        x, y,
        pos: { x: x + POS_OFFSET, y: y - 8 },
        neg: { x: x + NEG_OFFSET, y: y - 6 },
      });
    }
    cells.push(row);
  }

  // Build connection wires + identify bank + and − terminals (going to inverter)
  const wires: { d: string; color: string }[] = [];
  let bankPos: Term = cells[0][0].pos;
  let bankNeg: Term = cells[0][0].neg;

  const topBus = gridY - 28; // y level for top bus (above batteries)
  const bottomBus = gridY + gridH + 28; // y for bottom bus

  if (connection === "single") {
    bankPos = cells[0][0].pos;
    bankNeg = cells[0][0].neg;
  } else if (connection === "series") {
    // chain: + of cell i to − of cell i+1, alternating top arches
    for (let i = 0; i < displayCount - 1; i++) {
      const a = cells[0][i];
      const b = cells[0][i + 1];
      // a.neg → b.pos via top
      wires.push({
        d: `M ${a.neg.x} ${a.neg.y} V ${topBus} H ${b.pos.x} V ${b.pos.y}`,
        color: NEG_COLOR,
      });
    }
    bankPos = cells[0][0].pos;
    bankNeg = cells[0][displayCount - 1].neg;
  } else if (connection === "parallel") {
    // all + connected via vertical right bus, all − via vertical left bus
    const posBusX = cells[0][0].x + BATTERY_W + 22;
    const negBusX = cells[0][0].x - 22;
    // pos bus
    const firstPos = cells[0][0].pos;
    const lastPos = cells[displayCount - 1][0].pos;
    wires.push({ d: `M ${posBusX} ${firstPos.y - 4} V ${lastPos.y - 4}`, color: POS_COLOR });
    // neg bus
    wires.push({ d: `M ${negBusX} ${firstPos.y - 4} V ${lastPos.y - 4}`, color: NEG_COLOR });
    // stubs from each battery
    for (let i = 0; i < displayCount; i++) {
      const c = cells[i][0];
      wires.push({ d: `M ${c.pos.x} ${c.pos.y} V ${c.pos.y - 4} H ${posBusX}`, color: POS_COLOR });
      wires.push({ d: `M ${c.neg.x} ${c.neg.y} V ${c.neg.y - 6} H ${negBusX}`, color: NEG_COLOR });
    }
    bankPos = { x: posBusX, y: cells[Math.floor(displayCount / 2)][0].pos.y - 4 };
    bankNeg = { x: negBusX, y: cells[Math.floor(displayCount / 2)][0].neg.y - 4 };
  } else {
    // series-parallel: each row is series; rows are paralleled
    const rowEnds: { pos: Term; neg: Term }[] = [];
    for (let r = 0; r < cellsR; r++) {
      // wire series within row
      for (let i = 0; i < cellsC - 1; i++) {
        const a = cells[r][i];
        const b = cells[r][i + 1];
        const archY = a.y - 28;
        wires.push({
          d: `M ${a.neg.x} ${a.neg.y} V ${archY} H ${b.pos.x} V ${b.pos.y}`,
          color: NEG_COLOR,
        });
      }
      rowEnds.push({ pos: cells[r][0].pos, neg: cells[r][cellsC - 1].neg });
    }
    // parallel busses on each side
    const posBusX = cells[0][0].x - 24;
    const negBusX = cells[0][cellsC - 1].x + BATTERY_W + 24;
    if (cellsR > 1) {
      wires.push({ d: `M ${posBusX} ${rowEnds[0].pos.y - 4} V ${rowEnds[cellsR - 1].pos.y - 4}`, color: POS_COLOR });
      wires.push({ d: `M ${negBusX} ${rowEnds[0].neg.y - 4} V ${rowEnds[cellsR - 1].neg.y - 4}`, color: NEG_COLOR });
    }
    for (let r = 0; r < cellsR; r++) {
      const e = rowEnds[r];
      wires.push({ d: `M ${e.pos.x} ${e.pos.y} V ${e.pos.y - 4} H ${posBusX}`, color: POS_COLOR });
      wires.push({ d: `M ${e.neg.x} ${e.neg.y} V ${e.neg.y - 4} H ${negBusX}`, color: NEG_COLOR });
    }
    const midY = (rowEnds[0].pos.y + rowEnds[cellsR - 1].pos.y) / 2 - 4;
    bankPos = { x: posBusX, y: midY };
    bankNeg = { x: negBusX, y: midY };
  }

  // Wires to inverter
  const invPosX = inverterX;
  const invPosY = invY + 36;
  const invNegY = invY + 92;
  const trunkX = inverterX - 30;

  // From bankPos to inverter +
  const posToInv = `M ${bankPos.x} ${bankPos.y} ${
    connection === "parallel" || connection === "series-parallel"
      ? `H ${trunkX - 10} V ${invPosY} H ${invPosX}`
      : `V ${topBus - 10} H ${trunkX} V ${invPosY} H ${invPosX}`
  }`;
  // From bankNeg to inverter −
  const negToInv = `M ${bankNeg.x} ${bankNeg.y} ${
    connection === "parallel" || connection === "series-parallel"
      ? `H ${trunkX} V ${invNegY} H ${invPosX}`
      : `V ${topBus - 20} H ${trunkX + 10} V ${invNegY} H ${invPosX}`
  }`;

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-amber-500/20 bg-[#F8FAFC] p-4">
      <style>{`@keyframes solar-flow { to { stroke-dashoffset: -20; } }`}</style>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 640 }}>
        <defs>
          <pattern id="solargrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#solargrid)" />

        {/* inter-battery wires */}
        {wires.map((w, i) => (
          <path key={i} d={w.d} fill="none" stroke={w.color} strokeWidth={2.2} style={flowStyle} />
        ))}

        {/* bank → inverter */}
        <path d={posToInv} fill="none" stroke={POS_COLOR} strokeWidth={2.6} style={flowStyle} />
        <path d={negToInv} fill="none" stroke={NEG_COLOR} strokeWidth={2.6} style={flowStyle} />

        {/* batteries */}
        {cells.flat().map((b, i) => (
          <Battery key={i} x={b.x} y={b.y} label={`${batteryAh}Ah`} />
        ))}

        <Inverter x={inverterX} y={invY} />

        {/* AC out wire to load */}
        <path
          d={`M ${inverterX + 100} ${invY + 60} H ${loadX}`}
          fill="none"
          stroke={AC_COLOR}
          strokeWidth={2.6}
          style={flowStyle}
        />

        <Load x={loadX} y={invY + 32} />

        {/* labels */}
        <text x={padding} y={24} fill="#fbbf24" fontSize="12" fontWeight="700">
          البنك: {bankVoltage}V — {bankAh}Ah
        </text>
        {extra > 0 && (
          <text x={padding} y={height - 14} fill="#475569" fontSize="11">
            + {extra} بطارية إضافية
          </text>
        )}
      </svg>
    </div>
  );
}
