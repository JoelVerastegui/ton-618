# Guía de Arquitectura y Reglas de Estilos (React + Sass + Bootstrap)

Este documento define las convenciones, estructura de archivos y buenas prácticas para el manejo de estilos en el proyecto. Su objetivo es evitar conflictos de especificidad, prevenir la duplicación de CSS y mantener el código escalable.

---

## 1. Arquitectura de Carpetas

Los estilos se dividen en dos capas: una **capa global** (configuración de Bootstrap y tokens) y una **capa local** (estilos encapsulados junto a cada componente).

```text
src/
├── styles/                          # Capa Global y Configuración de Bootstrap
│   ├── _variables.scss              # Tokens del proyecto y sobrescrituras de Bootstrap
│   ├── _bootstrap-custom.scss       # Importación selectiva del core y componentes de Bootstrap
│   └── main.scss                    # Punto de entrada global (importado únicamente en main.tsx)
│
├── components/                      # Capa Local (UI Kit reutilizable)
│   └── Button/
│       ├── Button.tsx
│       └── Button.module.scss       # Estilos exclusivos del componente
│
└── features/                        # Capa Local (Módulos de negocio)
    └── Checkout/
        └── components/
            └── CartSummary/
                ├── CartSummary.tsx
                └── CartSummary.module.scss
```

---

## 2. Personalización de Bootstrap

**Regla:** Nunca importar `bootstrap.min.css` ni sobrescribir clases de Bootstrap usando `!important` en hojas externas.

### Cómo modificar Bootstrap
1. **Variables (`_variables.scss`):** Toda personalización de colores, tipografías, bordes o espaciados debe hacerse redefiniendo las variables `!default` de Bootstrap **antes** de importar su código fuente.
2. **Mapas:** Para agregar o eliminar variantes (ej. colores en `$theme-colors` o espaciados en `$spacers`), usar `map-merge()` y `map-remove()`.
3. **Importación selectiva (`_bootstrap-custom.scss`):** Importar únicamente los módulos de Bootstrap que el proyecto utiliza, respetando estrictamente el orden de carga:

```scss
// 1. Funciones de Bootstrap (Obligatorio primero)
@import "bootstrap/scss/functions";

// 2. Variables personalizadas del proyecto
@import "./variables";

// 3. Core de Bootstrap (Variables, mapas, mixins y utilidades base)
@import "bootstrap/scss/variables";
@import "bootstrap/scss/variables-dark";
@import "bootstrap/scss/maps";
@import "bootstrap/scss/mixins";
@import "bootstrap/scss/utilities";

// 4. Componentes específicos utilizados en el proyecto
@import "bootstrap/scss/root";
@import "bootstrap/scss/reboot";
@import "bootstrap/scss/type";
@import "bootstrap/scss/grid";
@import "bootstrap/scss/buttons";
@import "bootstrap/scss/forms";

// 5. Generación de API de utilidades (Obligatorio al final)
@import "bootstrap/scss/utilities/api";
```

---

## 3. Estilos a Nivel de Componente (CSS Modules)

Para estilos que Bootstrap no cubre de forma nativa, se deben usar archivos **Sass Modules** (`.module.scss`) ubicados en la misma carpeta del componente (*colocation*).

### Uso de variables y mixins en módulos
Si un archivo `.module.scss` necesita acceder a variables o mixins responsivos de Bootstrap, **solo debe importar los helpers sin salida CSS**:

```scss
// ✅ CORRECTO: No genera CSS duplicado
@import "../../styles/variables";
@import "bootstrap/scss/functions";
@import "bootstrap/scss/variables";
@import "bootstrap/scss/mixins";

.cardContainer {
  border: 1px solid \$primary;
  padding: 1rem;

  @include media-breakpoint-up(md) {
    padding: 2rem;
  }
}
```

```scss
// ❌ INCORRECTO: Duplica todo el framework en el bundle por cada componente
@import "bootstrap/scss/bootstrap";
```

---

## 4. Convenciones en el Código (JSX/TSX)

* **Layout vs. Diseño:** Usar las clases utilitarias y de grilla de Bootstrap (`container`, `row`, `col-*`, `d-flex`, `gap-*`, `mt-*`) para estructura y posicionamiento. Usar `.module.scss` para estilos visuales complejos o estados personalizados.
* **Nomenclatura en `.module.scss`:** Usar `camelCase` para las clases (ej. `.cardHeader`, `.activeTab`) para facilitar su acceso en TypeScript/JavaScript (`styles.cardHeader`).
* **Combinación de clases:** Para combinar clases de Bootstrap con CSS Modules, usar template literals o librerías como `clsx` / `classnames`:

```tsx
import clsx from 'clsx';
import styles from './ProductCard.module.scss';

export function ProductCard({ isFeatured }: { isFeatured: boolean }) {
  return (
    <div className={clsx('card p-3', styles.cardWrapper, isFeatured && styles.featured)}>
      {/* Contenido */}
    </div>
  );
}
```

---

## 5. Prohibiciones (Anti-patrones)

1. **Prohibido importar `main.scss` o `_bootstrap-custom.scss` dentro de componentes individuales.** Solo se importa una vez en el punto de entrada de la aplicación (`main.tsx` o `App.tsx`).
2. **Prohibido el uso de `!important`.** Si existe un problema de especificidad, revisar el orden de importación o ajustar la variable correspondiente en `_variables.scss`.
3. **Prohibido crear hojas de estilo globales sueltas.** Ningún componente debe tener un archivo `.scss` sin el sufijo `.module.scss`.
4. **Evitar estilos en línea (`style={{ ... }}`).** Reservarlos exclusivamente para valores dinámicos calculados en tiempo de ejecución (ej. coordenadas, porcentajes de progreso).