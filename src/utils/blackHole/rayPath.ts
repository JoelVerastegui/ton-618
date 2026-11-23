import type { RayPoint } from '../../interfaces/blackHole';

// Paso angular de la integración y tope de pasos (≈ 20 rad: sobra para cualquier rayo que escape).
const DPSI = 0.02;
const MAX_STEPS = 1000;

// Trayectoria de un rayo de luz en el plano del rayo (coordenadas cartesianas en radios de
// Schwarzschild, el agujero negro en el origen, la cámara en (distance, 0) y el rayo yendo hacia
// +y). Resuelve la misma ecuación que el motor, u'' = -u + 1,5·u² (u = 1/r, ψ = ángulo polar), con
// RK4. `impactParameter` es b = L/E: el radio al que pasaría el rayo sin gravedad. El trazo acaba
// cuando el rayo vuelve a la distancia de la cámara, o al cruzar el horizonte (r = 1) si b es menor
// que el crítico (3√3/2 ≈ 2,6). Función pura.
export function rayPath(impactParameter: number, distance: number): RayPoint[] {
  const u0 = 1 / distance;
  // (du/dψ)² = 1/b² - u²(1 - u): el rayo sale de la cámara hacia dentro (u crece).
  const slope0 = Math.sqrt(
    Math.max(0, 1 / (impactParameter * impactParameter) - u0 * u0 * (1 - u0))
  );
  const acceleration = (u: number): number => 1.5 * u * u - u;

  const points: RayPoint[] = [{ x: distance, y: 0 }];
  let u = u0;
  let du = slope0;
  let psi = 0;
  for (let step = 0; step < MAX_STEPS; step += 1) {
    const k1 = acceleration(u);
    const uMid1 = u + 0.5 * DPSI * du;
    const duMid1 = du + 0.5 * DPSI * k1;
    const k2 = acceleration(uMid1);
    const uMid2 = u + 0.5 * DPSI * duMid1;
    const duMid2 = du + 0.5 * DPSI * k2;
    const k3 = acceleration(uMid2);
    const uEnd = u + DPSI * duMid2;
    const nextU = u + (DPSI / 6) * (du + 2 * duMid1 + 2 * duMid2 + (du + DPSI * k3));
    const nextDu = du + (DPSI / 6) * (k1 + 2 * k2 + 2 * k3 + acceleration(uEnd));
    // Capturado (u = 1) o de vuelta a la distancia de la cámara (u = u0): el último punto se
    // interpola hasta esa frontera, no se queda en el paso que la cruza.
    const captured = nextU >= 1;
    const returned = nextDu < 0 && nextU <= u0;
    if (captured || returned) {
      const boundary = captured ? 1 : u0;
      const fraction = (boundary - u) / (nextU - u);
      const exitPsi = psi + fraction * DPSI;
      const radius = 1 / boundary;
      points.push({ x: radius * Math.cos(exitPsi), y: radius * Math.sin(exitPsi) });
      break;
    }
    psi += DPSI;
    u = nextU;
    du = nextDu;
    const radius = 1 / u;
    points.push({ x: radius * Math.cos(psi), y: radius * Math.sin(psi) });
  }
  return points;
}

// El mismo rayo sin gravedad (recta con el mismo parámetro de impacto), también desde la cámara y
// hasta volver a su distancia: dos puntos. Función pura.
export function straightRayPath(impactParameter: number, distance: number): RayPoint[] {
  const sinAlpha = Math.min(1, impactParameter / distance);
  const alpha = Math.asin(sinAlpha);
  // Cuerda de la circunferencia r = distance: acaba en (-D·cos2α, D·sin2α).
  return [
    { x: distance, y: 0 },
    { x: -distance * Math.cos(2 * alpha), y: distance * Math.sin(2 * alpha) },
  ];
}
