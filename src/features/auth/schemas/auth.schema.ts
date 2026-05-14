import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El correo es obligatorio")
    .email("Ingresa un correo electrónico válido"),
  password: z
    .string()
    .min(1, "La contraseña es obligatoria")
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const registerSchema = z.object({
  full_name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  email: z.string().email("Ingresa un correo electrónico válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  mobility_mode: z.string().min(1, "Debes seleccionar un modo de movilidad"),
  vehicle_type: z.string().optional(),
  license_plate: z.string().optional(),
}).refine((data) => {
  if (['carro', 'moto'].includes(data.mobility_mode)) {
    return !!data.license_plate && data.license_plate.length >= 5;
  }
  return true;
}, {
  message: "La placa es obligatoria para vehículos",
  path: ["license_plate"], 
});

export type LoginFormData = z.infer<typeof loginSchema>;