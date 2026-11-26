import { Component, type ReactNode } from 'react';
import type { SectionId } from '@/interfaces/navigation';
import { sectionFailed } from '@/utils/sectionLoader';

interface SectionBoundaryProps {
  id: SectionId;
  fallback: ReactNode;
  children: ReactNode;
}

// Si la sección falla al descargarse o al montarse, queda su marcador de posición, sin reintentos,
// y se avisa a quien la esperaba.
export class SectionBoundary extends Component<SectionBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    sectionFailed(this.props.id, error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
