import { loginSchema } from "src/features/auth/schemas/auth.schema";

describe('Login Schema Validation', () => {
  test('debe rechazar correos mal formados', () => {
    const result = loginSchema.safeParse({ email: 'esto-no-es-un-email', password: '123456' });
    expect(result.success).toBe(false);
  });

  test('debe aceptar credenciales válidas', () => {
    const result = loginSchema.safeParse({ email: 'juan@quillamap.com', password: 'password123' });
    expect(result.success).toBe(true);
  });
});