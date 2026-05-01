🚀 QuillaMap - Guía de Ejecución Local (Modo Ahorro)

Este archivo contiene los pasos exactos para arrancar el frontend en esta máquina sin que se trabe y asegurando la conexión con el iPhone.

## 📋 Requisitos Previos
1. **Pausar OneDrive:** Vital para evitar que la terminal se congele.
2. **Mismo Wi-Fi:** El iPhone y la PC deben estar en la misma red.
3. **Terminal Externa:** No usar la terminal de VS Code. Usar PowerShell independiente.

## 🛠️ Pasos para Iniciar
Cada vez que vayas a trabajar, sigue este orden en la terminal:

1. **Definir la IP de la máquina (actualizar si cambia el router):**
   ```powershell
   $env:EXPO_PACKAGER_HOSTNAME="192.168.1.10"
Arrancar Expo en modo LAN:

PowerShell
pnpm exec expo start --host lan