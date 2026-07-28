import {
  getTransitMotionLabel,
  isTransitComplexUiLocked,
} from '../utils/transitVelocityGuard';

describe('transitVelocityGuard', () => {
  it('bloquea menus complejos con itinerario activo al caminar rapido', () => {
    expect(isTransitComplexUiLocked(6, true, false)).toBe(true);
    expect(isTransitComplexUiLocked(5.9, true, false)).toBe(false);
  });

  it('mantiene el desbloqueo para copiloto o sin itinerario activo', () => {
    expect(isTransitComplexUiLocked(18, true, true)).toBe(false);
    expect(isTransitComplexUiLocked(18, false, false)).toBe(false);
  });

  it('clasifica movimiento de usuario para UX segura', () => {
    expect(getTransitMotionLabel(0)).toBe('quieto');
    expect(getTransitMotionLabel(7)).toBe('caminando');
    expect(getTransitMotionLabel(16)).toBe('bus');
  });
});
