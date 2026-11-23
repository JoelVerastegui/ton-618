import type {
  BlackHoleAssets,
  BlackHoleEngine,
  BlackHoleOptions,
} from '../../interfaces/blackHole';
import {
  AZIMUTH_DRIFT,
  DEFAULT_DISTANCE,
  FINE_DELAY,
  FINE_ROWS_PER_CHUNK,
  FINE_SLICE_MS,
  SCALE_MAX_COARSE,
  SCALE_MIN_COARSE,
  SCALE_MIN_FINE,
} from './constants';
import { clampDistance, clampTilt, createCameraState } from './camera';
import { computeStartPsi } from './geodesicTable';
import { clamp } from './random';
import { createShader } from './shadePass';
import { createTracePass, createTracer, resizeTracePass } from './tracePass';

// Motor del agujero negro: ensambla el trazado de rayos, el sombreado y el render progresivo
// sobre un canvas 2D. No registra listeners ni bucle: el hook los ligan y llaman a `frame`.
export function createBlackHole(
  canvas: HTMLCanvasElement,
  assets: BlackHoleAssets,
  options: Pick<BlackHoleOptions, 'preview' | 'distance' | 'autoDrift' | 'reducedMotion'> = {}
): BlackHoleEngine {
  const preview = options.preview ?? false;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('No hay contexto 2D para el agujero negro');

  const trace = createTracer(assets);
  const shade = createShader(assets);
  const camera = createCameraState(options.distance ?? DEFAULT_DISTANCE);
  let autoDrift = options.autoDrift ?? true;
  let reducedMotion = options.reducedMotion ?? false;

  // Lienzo de render a resolución interna, y sus reducciones 1/4 y 1/12 para el bloom.
  const renderCanvas = document.createElement('canvas');
  const renderCtx = renderCanvas.getContext('2d');
  const bloomNear = document.createElement('canvas');
  const bloomNearCtx = bloomNear.getContext('2d');
  const bloomFar = document.createElement('canvas');
  const bloomFarCtx = bloomFar.getContext('2d');
  if (!renderCtx || !bloomNearCtx || !bloomFarCtx) {
    throw new Error('No hay contexto 2D para el render del agujero negro');
  }
  let image: ImageData | null = null;
  let pixels = new Uint32Array(0);

  // Dos pasadas: la que se muestra y la fina que se calcula por trozos en segundo plano.
  let shown = createTracePass();
  let pending = createTracePass();

  let width = 0;
  let height = 0;
  let dpr = 1;
  let maxScale = 1; // tope de la resolución interna respecto al tamaño CSS
  let coarseScale = 0.35;
  let fineScale = 0.7;
  let shadeMs = 6; // media móvil del coste del sombreado
  let gasTime = 0;
  let destroyed = false;
  let cameraVersion = 0;
  let lastTiltKey = NaN;
  let lastDistanceKey = NaN;
  let startPsiKey = NaN;
  let sinceChange = 0;
  let renderWidth = 0;
  let renderHeight = 0;

  const computeRenderSize = (scale: number): void => {
    const s = Math.min(scale, maxScale);
    renderWidth = Math.max(32, Math.round(width * s));
    renderHeight = Math.max(20, Math.round(height * s));
  };

  const setupRenderCanvases = (w: number, h: number): void => {
    if (renderCanvas.width === w && renderCanvas.height === h) return;
    renderCanvas.width = w;
    renderCanvas.height = h;
    image = renderCtx.createImageData(w, h);
    pixels = new Uint32Array(image.data.buffer);
    bloomNear.width = Math.max(8, Math.round(w / 4));
    bloomNear.height = Math.max(5, Math.round(h / 4));
    bloomFar.width = Math.max(4, Math.round(w / 12));
    bloomFar.height = Math.max(3, Math.round(h / 12));
  };

  const draw = (): void => {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(renderCanvas, 0, 0, width, height);
    bloomNearCtx.imageSmoothingQuality = 'high';
    bloomNearCtx.drawImage(renderCanvas, 0, 0, bloomNear.width, bloomNear.height);
    bloomFarCtx.imageSmoothingQuality = 'high';
    bloomFarCtx.drawImage(bloomNear, 0, 0, bloomFar.width, bloomFar.height);
    // Bloom: las versiones reducidas se suman encima con `lighter`.
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.3;
    ctx.drawImage(bloomNear, 0, 0, width, height);
    ctx.globalAlpha = 0.3;
    ctx.drawImage(bloomFar, 0, 0, width, height);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  const frame = (dt: number): void => {
    if (destroyed || width === 0 || height === 0) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!reducedMotion) gasTime += dt;

    // El fondo gira despacio respecto al agujero negro a ritmo constante; la inclinación solo
    // cambia si la persona la mueve.
    if (autoDrift && !reducedMotion) camera.azimuth += AZIMUTH_DRIFT * dt;

    const tiltKey = Math.round(camera.tilt * 1e6);
    const distanceKey = Math.round(camera.distance * 1e5);
    if (tiltKey !== lastTiltKey || distanceKey !== lastDistanceKey) {
      if (distanceKey !== startPsiKey) {
        computeStartPsi(assets.table, camera.distance);
        startPsiKey = distanceKey;
      }
      lastTiltKey = tiltKey;
      lastDistanceKey = distanceKey;
      cameraVersion += 1;
    }

    if (shown.version !== cameraVersion) {
      // La cámara cambió: pasada gruesa de inmediato; la fina empieza si se queda quieta.
      sinceChange = 0;
      pending.version = 0;
      computeRenderSize(coarseScale);
      resizeTracePass(shown, renderWidth, renderHeight);
      shown.fine = false;
      const start = performance.now();
      trace(shown, camera.tilt, camera.distance, 0, renderHeight);
      const elapsed = performance.now() - start;
      shown.version = cameraVersion;
      // La escala gruesa se ajusta para que esta pasada cueste ~7 ms (4 ms en miniatura).
      const target = preview ? 4 : 7;
      coarseScale = clamp(
        coarseScale * Math.pow(target / Math.max(0.5, elapsed), 0.25),
        SCALE_MIN_COARSE,
        SCALE_MAX_COARSE
      );
    } else {
      sinceChange += dt;
      if (!shown.fine && sinceChange > FINE_DELAY) {
        if (pending.version !== cameraVersion) {
          computeRenderSize(fineScale);
          resizeTracePass(pending, renderWidth, renderHeight);
          pending.version = cameraVersion;
        }
        const start = performance.now();
        while (pending.row < pending.height && performance.now() - start < FINE_SLICE_MS) {
          const next = Math.min(pending.height, pending.row + FINE_ROWS_PER_CHUNK);
          trace(pending, camera.tilt, camera.distance, pending.row, next);
          pending.row = next;
        }
        if (pending.row >= pending.height) {
          pending.fine = true;
          const done = pending;
          pending = shown;
          shown = done;
          pending.version = 0;
        }
      }
    }

    setupRenderCanvases(shown.width, shown.height);
    const shadeStart = performance.now();
    shade(shown, pixels, camera.azimuth, gasTime);
    if (image) renderCtx.putImageData(image, 0, 0);
    const shadeElapsed = performance.now() - shadeStart;
    if (shown.fine) {
      // Si el sombreado es lento, baja la resolución de la próxima pasada fina.
      shadeMs += 0.1 * (shadeElapsed - shadeMs);
      if (shadeMs > 11 && fineScale > SCALE_MIN_FINE) {
        fineScale *= 0.92;
        shadeMs = 8;
      }
    }
    draw();
  };

  return {
    get distance() {
      return camera.distance;
    },
    set distance(value: number) {
      camera.distance = clampDistance(value);
    },
    get azimuth() {
      return camera.azimuth;
    },
    set azimuth(value: number) {
      camera.azimuth = value;
    },
    get tilt() {
      return camera.tilt;
    },
    set tilt(value: number) {
      camera.tilt = clampTilt(value);
    },
    get autoDrift() {
      return autoDrift;
    },
    set autoDrift(value: boolean) {
      autoDrift = value;
    },
    get reducedMotion() {
      return reducedMotion;
    },
    set reducedMotion(value: boolean) {
      reducedMotion = value;
    },
    resize(cssWidth, cssHeight, ratio) {
      if (destroyed) return;
      if (cssWidth !== width || cssHeight !== height || ratio !== dpr) {
        width = cssWidth;
        height = cssHeight;
        dpr = ratio;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      maxScale = preview ? 0.75 : Math.min(dpr, 1.25);
      fineScale = preview ? 0.75 : 0.72;
      // Fuerza una pasada gruesa nueva con el tamaño actual.
      lastTiltKey = NaN;
    },
    frame,
    orbitBy(azimuthDelta, tiltDelta) {
      camera.azimuth += azimuthDelta;
      camera.tilt = clampTilt(camera.tilt + tiltDelta);
    },
    destroy() {
      destroyed = true;
      // Libera los lienzos intermedios y los buffers de las pasadas.
      renderCanvas.width = 0;
      bloomNear.width = 0;
      bloomFar.width = 0;
      image = null;
      pixels = new Uint32Array(0);
      shown = createTracePass();
      pending = createTracePass();
    },
  };
}
