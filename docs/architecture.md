# Arquitectura

## File System

```
ton-618/
├── docs/
│   └── architecture.md     # Este documento
├── public/
│   ├── favicon.svg         # Ícono de la web
│   └── icons.svg           # Declaración de symbols de los SVG (Crear un componente Icon que use los symbols y reciba el id)
├── src/
│   ├── assets/             # Iconos, imágenes y estilos globales
│   │   ├── fonts/          # Fuentes de letra
│   │   └── images/         # Imágenes a usar en las secciones
│   ├── styles/                          # Capa Global y Configuración de Bootstrap
│   │   ├── _variables.scss              # Tokens del proyecto y sobrescrituras de Bootstrap
│   │   ├── _bootstrap-custom.scss       # Importación selectiva del core y componentes de Bootstrap
│   │   └── main.scss                    # Punto de entrada global (importado únicamente en main.tsx)
│   ├── components/         # Todos los componentes de la aplicación
│   │   ├── ui/             # Elementos base
│   │   ├── layout/         # Estructura visual (Navbar, Footer)
│   │   └── sections/       # Secciones de la página de inicio
│   ├── data/               # Datos estáticos. Contiene el JSON con la información de las secciones
│   ├── hooks/              # Custom hooks (tanto de lógica de negocio como globales)
│   ├── services/           # Llamadas a la API y configuración de Fetch
│   ├── interfaces/         # Tipos TypeScript (DTOs / modelos)
│   ├── utils/              # Funciones de ayuda (formateadores de fechas, validadores)
│   ├── App.tsx             # Contenedor principal
│   └── main.tsx            # Punto de entrada
```

## Datos de secciones

- La información de las secciones vive en un JSON dentro de `src/data/` (p. ej. `hero.json`).
- La estructura del JSON será distinta por cada sección, según se requiera.
- Las imágenes necesarias de cada sección van en `src/assets/images/` y el JSON las referencia.

## Navegación

Cada sección (a excepción del Hero, que sería "/"), tendrá su ruta propia, y al hacer scroll cambiará de manera dinámica por cada sección.
Para lograr un scroll suave desde el navbar, actualización silenciosa de la URL y carga dinámica bajo demanda, se usará:

- scrollIntoView para la navegación
- window.history.replaceState para evitar re-renders innecesarios en React
- React.lazy junto con IntersectionObserver para ahorrar memoria

No se usará librería de terceros para la navegación.
