import { loginSchema } from 'src/features/auth/schemas/auth.schema';

describe('Auth Validation Schemas - Unit Tests', () => {
  test('debe fallar si el email no tiene formato correcto', () => {
    const result = loginSchema.safeParse({ 
      email: 'juanfer-sin-arroba', 
      password: 'password123' 
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Ingresa un correo electrónico válido");
    }
  });

  test('debe fallar si la contraseña tiene menos de 6 caracteres', () => {
    const result = loginSchema.safeParse({ 
      email: 'test@quillamap.com', 
      password: '123' 
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("La contraseña debe tener al menos 6 caracteres");
    }
  });

  test('debe validar con éxito credenciales correctas', () => {
    const result = loginSchema.safeParse({ 
      email: 'pacheco@quillamap.com', 
      password: 'password123' 
    });
    expect(result.success).toBe(true);
  });
});