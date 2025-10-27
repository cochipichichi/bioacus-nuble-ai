# BioAcus-Ñuble AI

Monitoreo bioacústico escolar con **huellas de 16 bandas** (sin audio crudo), espectrograma en vivo y clasificador ligero en el navegador (centroides + coseno). PWA offline-first, export/import JSON y visores 👁️ 3D / 📱 AR / 🥽 VR.

## Flujo rápido
1. **Iniciar** grabación ▶️ y observar espectrograma.
2. **Capturar huella** ➕ con etiqueta (p. ej., *Chucao*).
3. **Calcular centroides** 🧠 para entrenar.
4. Ver **predicción** en tiempo real.

## Dataset y privacidad
- Vectores de 16 bandas (100–8000 Hz). No guarda audio crudo por defecto.
- Exporta/Importa JSON para colaborar.

## Edge / TinyML (ESP32-S3)
`firmware/esp32_s3_i2s_stub.ino` contiene un stub para features de 16 bandas vía I2S.

MIT — educativo.