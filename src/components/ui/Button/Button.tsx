import clsx from 'clsx';
import type { AnchorHTMLAttributes } from 'react';
import styles from '@/components/ui/Button/Button.module.scss';

type ButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

// Botón de llamada a la acción. Se renderiza como enlace para conservar la
// semántica y el comportamiento de ancla aunque no haya JavaScript.
export function Button({ className, children, ...props }: ButtonProps) {
  return (
    <a className={clsx(styles.button, className)} {...props}>
      {children}
    </a>
  );
}
