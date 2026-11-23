import type { RayDiagram, RayPoint } from '../interfaces/blackHole';
import { rayPath, straightRayPath } from './blackHole/rayPath';
import { RAY_IMPACT } from './experimentScale';

// Margen del encuadre (fracción del lado mayor) y radio mínimo visible alrededor del origen.
const PADDING = 0.08;

const fixed = (n: number): string => (Math.round(n * 100) / 100).toString();

const toPath = (points: RayPoint[]): string =>
  points.map((p, i) => `${i === 0 ? 'M' : 'L'}${fixed(p.x)} ${fixed(-p.y)}`).join(' ');

const cache = new Map<number, RayDiagram>();

// Diagrama del rayo para la distancia de la cámara. La trayectoria se calcula una vez por distancia
// redondeada a 0,1 rs y se guarda: mover el deslizante no la recalcula en cada evento.
export function getRayDiagram(distance: number): RayDiagram {
  const key = Math.round(distance * 10);
  const hit = cache.get(key);
  if (hit) return hit;

  const camera = key / 10;
  const bent = rayPath(RAY_IMPACT, camera);
  const straight = straightRayPath(RAY_IMPACT, camera);
  const all = [...bent, ...straight, { x: -1, y: -1 }, { x: 1, y: 1 }];
  const xs = all.map((p) => p.x);
  const ys = all.map((p) => -p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = Math.max(maxX - minX, maxY - minY) * PADDING;
  const diagram: RayDiagram = {
    viewBox: `${fixed(minX - pad)} ${fixed(minY - pad)} ${fixed(maxX - minX + 2 * pad)} ${fixed(maxY - minY + 2 * pad)}`,
    straight: toPath(straight),
    bent: toPath(bent),
    camera: `M${fixed(camera)} 0h0`,
  };
  cache.set(key, diagram);
  return diagram;
}
