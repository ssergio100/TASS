export function generateHarmony(baseH, baseS, baseL, rule = 'analogous') {
  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
  const wrapHue = (h) => (h % 360 + 360) % 360;

  const points = [];
  
  // Base color is always points[0]
  const addPoint = (hOff, sMult, lMult) => {
    points.push({
      h: wrapHue(baseH + hOff),
      s: clamp(baseS * sMult, 0, 100),
      l: clamp(baseL * lMult, 0, 100)
    });
  };

  switch (rule) {
    case 'analogous':
      // Base, -30, -15, +15, +30
      addPoint(0, 1, 1);
      addPoint(-30, 1, 1);
      addPoint(-15, 1, 1);
      addPoint(15, 1, 1);
      addPoint(30, 1, 1);
      break;
    case 'monochromatic':
      addPoint(0, 1, 1);
      addPoint(0, 0.5, 1.2);
      addPoint(0, 1, 0.5);
      addPoint(0, 0.8, 0.8);
      addPoint(0, 0.3, 1.5);
      break;
    case 'triad':
      addPoint(0, 1, 1);
      addPoint(120, 1, 1);
      addPoint(240, 1, 1);
      addPoint(120, 0.8, 0.8);
      addPoint(240, 0.8, 0.8);
      break;
    case 'complementary':
      addPoint(0, 1, 1);
      addPoint(180, 1, 1);
      addPoint(0, 0.8, 0.8);
      addPoint(180, 0.8, 0.8);
      addPoint(0, 0.5, 1.2);
      break;
    case 'split-complementary':
      addPoint(0, 1, 1);
      addPoint(150, 1, 1);
      addPoint(210, 1, 1);
      addPoint(150, 0.8, 0.8);
      addPoint(210, 0.8, 0.8);
      break;
    case 'square':
      addPoint(0, 1, 1);
      addPoint(90, 1, 1);
      addPoint(180, 1, 1);
      addPoint(270, 1, 1);
      addPoint(180, 0.8, 0.8);
      break;
    default:
      addPoint(0, 1, 1);
  }
  
  return points;
}
