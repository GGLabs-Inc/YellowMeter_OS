# 🚀 AI Chat Integration - Frontend Setup

## ✅ Cambios Realizados

### 1. Nuevo Servicio: `aiChatService.ts`
Servicio completo para interactuar con el backend de Yellow Network:
- Crear sesiones (state channels)
- Generar session keys
- Enviar consultas a IA
- Conexión WebSocket en tiempo real
- Cerrar sesiones cooperativamente

### 2. Modal Actualizado: `AiChatModal.tsx`
Integración completa con:
- ✅ Inicialización automática de sesión al abrir
- ✅ Conexión a Yellow Network backend
- ✅ Firmas con wallet (wagmi)
- ✅ WebSocket para updates en tiempo real
- ✅ Indicadores de estado de conexión
- ✅ Balance del canal visible
- ✅ Cierre cooperativo de sesión

---

## ⚙️ Configuración

### 1. Crear archivo `.env`
```bash
cp .env.example .env
```

Edita `.env` y configura:
```env
VITE_BACKEND_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

### 2. Instalar Dependencias (si no están)
```bash
npm install socket.io-client
```

### 3. ** Verificar que wagmi esté configurado**
El proyecto ya usa `wagmi` para conectar wallets. Asegúrate que esté funcionando correctamente.

---

## 🎯 Flujo de Uso

### Cuando el usuario abre el modal:

1. **Frontend** detecta apertura → Llama a `initializeSession()`
2. **POST** `/ai-chat/sessions` → Crea sesión en backend
3. **Backend** → Abre State Channel en Yellow Network
4. **Frontend** firma session key (1 sola vez)
5. **WebSocket** → Conexión establecida
6. **Usuario** puede empezar a chatear ✅

### Cuando el usuario envía un mensaje:

1. **Frontend** → Usuario escribe y presiona "Enviar"
2. **Firma** automática con session key
3. **POST** `/ai-chat/query` → Backend procesa
4. **Backend** → Llama a IA (OpenAI/Anthropic/Gemini/Deepseek)
5. **Backend** → Actualiza estado del canal (off-chain)
6. **Frontend** recibe respuesta + nuevo balance
7. **UI** actualiza inmediatamente ⚡

### Cuando el usuario cierra el modal:

1. **Frontend** → `handleCloseSession()`
2. **POST** `/ai-chat/sessions/:id/close`
3. **Backend** → Cierra canal cooperativamente
4. **Yellow Network** → Fondos devueltos on-chain
5. **WebSocket** desconectado

---

## 🐛 Debugging

### Ver logs en consola del navegador:
```javascript
// La aplicación imprime logs útiles:
✅ Session created: abc123...
✅ Session key created: key_xyz...
✅ WebSocket connected
💰 Balance update: { balance: "95000000", nonce: 3 }
```

### Verificar conexión con backend:
```bash
# Debe estar corriendo en puerto 3000
curl http://localhost:3000/ai-chat/models
```

### Si no conecta:
1. Verifica que el backend esté corriendo
2. Chequea `.env` tenga las URLs correctas
3. Revisa que wagmi esté conectado con una wallet
4. Mira los logs de la consola del navegador

---

## 📊 Indicadores Visuales

| Indicador | Significado |
|-----------|-------------|
| 🟢 CHANNEL OPEN | Conectado y listo para chatear |
| 🟡 CONNECTING... | Inicializando sesión |
| Balance Canal: X USDC | Fondos disponibles en el state channel |
| Consultas: N | Número de queries realizadas (nonce) |

---

## 🎨 Próximas Mejoras

- [ ] Reconexión automática si se cae WebSocket
- [ ] Persistir sesión en localStorage
- [ ] Streaming de respuestas en tiempo real
- [ ] Historial de conversaciones

---

## 📚 Archivos Modificados

```
src/
├── services/
│   └── aiChatService.ts          ← NUEVO
├── components/
│   └── modals/
│       └── AiChatModal.tsx       ← ACTUALIZADO
.env.example                      ← NUEVO
INTEGRATION_GUIDE.md              ← ESTE ARCHIVO
```

---

## ✅ Testing

### Test Manual:
1. Inicia el backend: `cd backend && npm run dev`
2. Inicia el frontend: `npm run dev`
3. Conecta wallet (MetaMask, RainbowKit, etc.)
4. Abre el modal de AI Chat
5. Espera a que diga "✅ Conectado a Yellow Network!"
6. Escribe un mensaje
7. Verifica que funcione

---

## 🚨 Troubleshooting Común

### Error: "Failed to create session"
- ✅ Backend está corriendo?
- ✅ Yellow Network está configurado en backend?
- ✅ Wallet conectada?

### Error: "Invalid signature"
- ✅ Usuario firmó el mensaje?
- ✅ Address correcta en wagmi?

### WebSocket no conecta:
- ✅ URL correcta en `.env`?
- ✅ CORS configurado en backend?

---

**¡Listo! 🚀** El frontend ahora está completamente integrado con Yellow Network.
