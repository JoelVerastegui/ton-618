# Arquitectura

## File System

```
ton-618/
├── docs/
│   ├── architecture.md     # Este documento
│   └── navigation.md       # Detalle de la navegación
├── public/
│   ├── favicon.svg         # Ícono de la web
│   └── icons.svg           # Symbols de los SVG en uso (se muestran con el componente `ui/Icon`)
├── src/
│   ├── assets/             # Recursos que importa el código
│   │   ├── fonts/          # Fuentes de letra
│   │   ├── images/         # Imágenes a usar en las secciones
│   │   └── videos/         # Vídeos a usar en las secciones
│   ├── styles/                          # Capa Global y Configuración de Bootstrap
│   │   ├── _variables.scss              # Tokens del proyecto y sobrescrituras de Bootstrap
│   │   ├── _bootstrap-custom.scss       # Importación selectiva del core y componentes de Bootstrap
│   │   ├── _sectionTracks.scss          # Medidas que comparten cada sección y su marcador de posición
│   │   ├── _*.scss                      # Demás parciales compartidos entre componentes
│   │   └── main.scss                    # Punto de entrada global (importado únicamente en main.tsx)
│   ├── components/         # Todos los componentes de la aplicación
│   │   ├── ui/             # Elementos base
│   │   ├── layout/         # Estructura de la página: `LazySection`, `SectionMenu` y `Hyperspace`
│   │   └── sections/       # Secciones de la página de inicio
│   ├── data/               # Datos estáticos. Contiene el JSON con la información de las secciones
│   ├── hooks/              # Custom hooks (tanto de lógica de negocio como globales)
│   ├── services/           # Llamadas a la API y configuración de Fetch (solo si hacen falta)
│   ├── interfaces/         # Tipos TypeScript (DTOs / modelos)
│   ├── utils/              # Funciones de ayuda (formateadores de fechas, validadores)
│   ├── App.tsx             # Contenedor principal: menú y secciones (con carga bajo demanda)
│   └── main.tsx            # Punto de entrada
└── vite.config.ts          # `base` (`/ton-618/`) y generación de `dist/404.html`
```

La lógica en `.ts` vive solo en `hooks/` y `utils/`; las carpetas de componentes tienen solo `.tsx` y `.scss`.

## Datos de secciones

- La información de las secciones vive en un JSON dentro de `src/data/` (p. ej. `hero.json`).
- La estructura del JSON será distinta por cada sección, según se requiera.
- Las imágenes necesarias de cada sección van en `src/assets/images/` y el JSON las referencia.

## Navegación

Cada sección (a excepción del Hero, que sería "/"), tendrá su ruta propia, y al hacer scroll cambiará de manera dinámica por cada sección.
La navegación desde el menú lateral es un salto instantáneo cubierto por una transición, con actualización silenciosa de la URL y carga dinámica bajo demanda.

El detalle (rutas, carga bajo demanda, menú lateral, transición, punto de llegada y validaciones) está en [navigation.md](navigation.md), que es la referencia para todo lo relacionado con la navegación.

| Responsabilidad | Archivos |
| --- | --- |
| Textos y rutas | `data/navigation.json`, `interfaces/navigation.ts`, `utils/routes.ts` |
| Sección activa, URL y acceso directo | `hooks/useActiveSection.ts`, `hooks/useDirectAccess.ts` |
| Punto de llegada | `utils/sectionArrival.ts`, `utils/settleSection.ts` |
| Carga bajo demanda | `components/layout/LazySection/`, `utils/sectionLoader.ts` |
| Menú | `components/layout/SectionMenu/`, `hooks/useScrollLock.ts`, `utils/continueTabFrom.ts` |
| Salto y transición | `hooks/useSectionNavigation.ts`, `components/layout/Hyperspace/`, `utils/navigationState.ts`, `utils/blockInput.ts`, `utils/scrollAnimations.ts` |
