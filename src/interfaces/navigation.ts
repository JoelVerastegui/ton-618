export type SectionId =
  'hero' | 'exploration' | 'science' | 'scale' | 'time' | 'experiment' | 'evidence' | 'epilogue';

export interface NavigationLink {
  id: SectionId; // id del <section>
  path: string; // relativo a la base: '' para el Hero, 'science', …
  label: string; // texto del menú
}

export interface NavigationData {
  menuLabel: string; // nombre accesible del menú
  openLabel: string; // nombre accesible del ícono
  closeLabel: string; // nombre accesible del botón de cierre
  links: NavigationLink[]; // 8, en el orden de la página
}
