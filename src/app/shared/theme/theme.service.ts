import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'pastoral-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly current = signal<Theme>(this.readInitial());
  readonly theme = this.current.asReadonly();

  constructor() {
    this.apply(this.current());
  }

  toggle(): void {
    this.set(this.current() === 'dark' ? 'light' : 'dark');
  }

  set(theme: Theme): void {
    this.current.set(theme);
    this.apply(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage indisponível (modo privado); a preferência só dura a sessão de navegação.
    }
  }

  private apply(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }

  private readInitial(): Theme {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'dark' || attr === 'light') return attr;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {
      // Ignora e usa o padrão claro.
    }
    return 'light';
  }
}
