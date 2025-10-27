
# BioAcus-Ñuble AI — v1.1

Añadidos:
- 🗺️ **Mapa calor horario** (24 x últimos N días).
- 🎯 **Captura por ventana** (N segundos, múltiples tomas).
- 🌐 **MQTT básico** para ingesta de huellas remotas.

## Uso rápido
1. Inicia ▶️ y observa el espectrograma.
2. Captura huellas (instantánea o por ventana) y entrena centroides.
3. Conéctate opcionalmente a un broker MQTT (`wss://`) y suscríbete a `bioacus/fp`.

### MQTT payload
```json
{"ts": 1730000000000, "bands": [0.1, -0.2, ... 16 vals ...], "label":"opcional"}
```

## Calor horario
- Ajusta "Últimos días" (7 por defecto). Mide actividad por hora (capturas locales + remotas).

MIT — educativo.
