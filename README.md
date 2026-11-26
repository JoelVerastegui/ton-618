# TON 618

Experiencia espacial interactiva e informativa sobre el agujero negro TON 618. SPA separado en varias secciones (no features), cada una con un contenido específico, incluyen animaciones avanzadas, transiciones dinámicas y una cohesión del diseño artístico. La navegación entre las secciones es por scroll o desde un menú lateral que salta a cada una (detalle en [docs/navigation.md](docs/navigation.md)), y se adapta a dispositivos desktop y móviles.

## Tecnologías

- **React** con **TypeScript**
- **Vite** como bundler
- **Bootstrap** para el diseño/estilos

## Scripts

Los comandos disponibles están en [package.json](package.json).

## Estilos

Reglas de estilos en [docs/styles-rules.md](docs/styles-rules.md).

## Paleta de colores

- Cosmic Blue: #111C35
- Nebula purple: #35204D
- Solar amber: #B96F37
- Starlight: #E5E8EF

## Arquitectura

La estructura del file system y la ubicación de los datos de proyectos están en [docs/architecture.md](docs/architecture.md).

## Créditos y licencias

Todos los créditos de los recursos del proyecto se declaran aquí, no en pantalla. Los recursos marcados como **pendiente** deben resolverse antes de publicar.

| Recurso | Dónde se usa | Origen y estado |
| --- | --- | --- |
| Demo «Black Hole» de Emergent Mind | Motor del agujero negro de la sección Experimento (`src/utils/blackHole/`, `src/hooks/useBlackHole.ts`): port a TypeScript del demo, con sus constantes y fórmulas | https://www.emergentmind.com/visualizations/black-hole. **Pendiente (bloqueante de publicación):** confirmar la licencia con el autor. |
| Imagen de la Tierra | Escala y Tiempo (`src/assets/images/scale/earth.webp`) | NASA Science, «As the World Turns» (cámara EPIC de DSCOVR). **Pendiente:** confirmar la nota de crédito de la página original. |
| Vídeo del cuásar | Ciencia (`src/assets/videos/science/`) | Simulación de un disco de acreción en GIF, tomada de una nota de prensa de lopezdoriga.com («NASA muestra simulación de cómo un agujero negro deforma el espacio»). **Pendiente:** confirmar autoría y licencia en la fuente original. |
| Vídeo del Sol | Escala (`src/assets/videos/scale/`) | GIF de Pinterest sin autor ni licencia verificables; provisional. **Pendiente:** sustituir o licenciar. |
| Sprites de los 8 planetas | Escala (`src/assets/images/scale/planets/`) | Imagen de Pinterest sin autor ni licencia verificables; provisional. **Pendiente:** sustituir por sprites con licencia clara. |
| Agujero negro, nebulosa, campo profundo y Vía Láctea | Hero, Exploración, Escala y Tiempo (`src/assets/images/hero/`, `src/assets/images/exploration/`) | Imágenes generadas con IA a partir de los prompts de los specs 01 y 02. **Pendiente:** anotar herramienta y fecha de generación; los términos dependen del generador. |
| Observación de TON 618 | Evidencia (`src/assets/images/evidence/`) | Legacy Surveys (DR9), crédito: «Legacy Surveys / D. Lang (Perimeter Institute)». Licencia CC BY 4.0 (https://www.legacysurvey.org/acknowledgment/). Recortada, con reducción de ruido y reescalada a WebP. |
| Space Grotesk | Tipografía (`src/assets/fonts/`) | SIL Open Font License 1.1 (`src/assets/fonts/SpaceGrotesk-OFL.txt`). |

Las estrellas, el disco de gas, el cielo del agujero negro interactivo, la distorsión entre secciones y el salto hiperespacial del menú se generan en código: no hay recursos adicionales.

### Fuentes científicas

Shemmer et al. 2004 (arXiv:astro-ph/0406559), Ge et al. 2019 (arXiv:1903.08830), NASA/IPAC Extragalactic Database (NED), NASA SVS y NASA/NSSDC Planetary Fact Sheet. Las cifras verificadas de cada sección están en su spec (`specs/`).
