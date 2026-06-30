import { useAuthStore } from '../useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      session: null,
      isLoading: true,
    });
  });

  it('termina la hidratacion con una actualizacion observable', () => {
    useAuthStore.getState().finishHydration();

    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('mantiene isLoading apagado al cerrar sesion', () => {
    useAuthStore.getState().signOut();

    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(useAuthStore.getState().session).toBeNull();
  });
});
