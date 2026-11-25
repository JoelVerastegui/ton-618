## **8. El final — Algo más grande todavía**

08 — EPÍLOGO

Última sección. No cierra la historia: la deja abierta. El visitante termina con una pregunta y una imagen que le provoque asombro, sin explicaciones, para que quiera seguir investigando por su cuenta.

### Fondo

Es el mismo fondo del Hero, pero sobre negro puro (`#000`):

- Estrellas y nebulosa.
- Destellos ocasionales de estrellas.
- Parallax con el mouse (en móvil, el mismo fallback que use el Hero).

Se reutiliza el fondo del Hero, no se reimplementa.

### Entrada y salida

- **Entrada:** scroll normal, igual que de Hero a Exploration. Sin transición especial.
- **Salida:** ninguna, es la última sección.

### Mensaje

_«Y aun así, TON 618 es solamente una pequeña parte de un universo que todavía estamos intentando comprender»._

Se mantiene, pero **no va en el centro**: el centro es del cliffhanger. Va descentrado (lateral o en un extremo), con tipografía discreta y un reveal suave.

### Cliffhanger: el Gran Atractor

El centro de la sección es el cliffhanger: el Gran Atractor y una sola pregunta, **«¿Has oído hablar del Gran Atractor?»**

- Sin descripción, sin datos, sin enlaces que lo expliquen.
- Ningún texto después de la pregunta que resuelva la duda.
- **Única pista:** un pequeño punto con la etiqueta «VÍA LÁCTEA». Sin él solo se ven líneas dando forma a algo; con él, el visitante entiende que nosotros somos ese punto y que todo fluye hacia algo enorme. Es la pista que multiplica la curiosidad.

### Imagen

La referencia (`Downloads/the great attractor.jpg`) son líneas de flujo doradas de galaxias convergiendo hacia un punto brillante, con ramas y un vacío interior oscuro. Define la forma que debe tener la imagen de la sección.

**Decisión:** imagen generada con IA a partir de esa referencia.

1. **Plan principal:** en el paso de implementación correspondiente se entrega el prompt para generarla con IA (fondo oscuro, sin texto, sin rótulos, sin estrellas de fondo, para poder tratarla: negro → alfa). Estrellas, nebulosa, marcador y parallax se añaden en código.
2. **Plan de respaldo:** si el resultado de la IA no es lo que se quería, se usa la imagen de referencia tal cual, conservando sus líneas. Habrá que eliminar el rótulo «MILKY WAY» incrustado, y se le da interactividad con SVG/CSS (parallax por capas, brillo que respira, pulsos de luz sobre las líneas) y se añade el indicador de la Vía Láctea en código.
   - Pendiente en ese caso: licencia/atribución de la imagen (visualización de terceros, supercúmulo Laniakea).

El prototipo en SVG/CSS ya no es el camino elegido; solo sirve como referencia de movimiento.

**Indicador de la Vía Láctea (en ambos casos):** código, no parte de la imagen. Punto + anillo que pulsa + etiqueta «VÍA LÁCTEA». Su posición se calibra sobre la imagen final, en el extremo de una de las ramas. Sin rótulos de «representación artística».

### Interactividad

- Parallax con el mouse (compartido con el fondo).
- En móvil: movimiento ambiental continuo en lugar de hover.
- Respetar `prefers-reduced-motion`.

### Fuera de alcance

Sin botón para volver al inicio y sin enlaces a fuentes: la sección termina en la pregunta.
