import type { SVGProps } from 'react';

// Symbols de `public/icons.svg` en uso.
export type IconId = 'menu-icon' | 'close-icon';

type IconProps = Omit<SVGProps<SVGSVGElement>, 'id'> & { id: IconId };

// Ícono de `public/icons.svg`, del color del texto. Decorativo por defecto: el nombre accesible
// lo pone el control que lo contiene.
export function Icon({ id, ...props }: IconProps) {
  return (
    <svg width='24' height='24' aria-hidden='true' focusable='false' {...props}>
      <use href={`${import.meta.env.BASE_URL}icons.svg#${id}`} />
    </svg>
  );
}
