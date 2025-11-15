# 🖼️ Cambio en Almacenamiento de Imágenes - Rutas Relativas

## ¿Qué cambió?

### Antes (❌ Problemático)
```
BD guarda: "http://localhost:3001/uploads/1c69d5032f4.jpg"
Problema: Si cambias servidor → URL roto
```

### Ahora (✅ Correcto)
```
BD guarda: "uploads/1c69d5032f4.jpg" (ruta relativa)
Frontend construye: "http://192.168.100.3:3001/uploads/1c69d5032f4.jpg"
Ventaja: URL siempre correcta, sin importar servidor
```

---

## 🔄 Cómo Funciona Ahora

### 1. Backend guarda ruta relativa
```typescript
// Upload endpoint: /patients/:id/profile-image
const normalizedPath = file.path.replace(/\\/g, '/'); // "uploads/abc123.jpg"
await prisma.user.update({
  where: { id },
  data: { profileImageUrl: normalizedPath } // ✅ Solo la ruta relativa
});
```

### 2. Frontend construye URL completa
```typescript
// Al cargar perfil
let imageUrl = perfilData.profileImageUrl; // "uploads/abc123.jpg"

if (!imageUrl.startsWith('http')) {
  // Ruta relativa → convertir a URL completa
  imageUrl = `${API_URL}/${imageUrl}`;
  // Resultado: "http://192.168.100.3:3001/uploads/abc123.jpg"
}

setImageUri(imageUrl); // Mostrar imagen
```

---

## ✨ Ventajas

| Aspecto | Antes | Ahora |
|--------|-------|-------|
| **Cambio de IP** | ❌ URLs rotas | ✅ Funciona automáticamente |
| **Cambio a producción** | ❌ URLs al viejo servidor | ✅ Se adapta al nuevo `API_URL` |
| **Escalabilidad** | ❌ Acoplado a servidor | ✅ Flexible y portable |
| **Almacenamiento cloud** | ❌ Rutas invalidas | ✅ Fácil integrar (S3, etc) |

---

## 🚀 Migrando Datos Antiguos

Si tienes imágenes con URLs completas en la BD, puedes limpiarlas:

```sql
-- Convertir URLs completas a rutas relativas
UPDATE "User" 
SET "profileImageUrl" = substring("profileImageUrl", position('uploads' in "profileImageUrl"))
WHERE "profileImageUrl" LIKE 'http://%'
  OR "profileImageUrl" LIKE 'https://%';
```

O hacerlo desde Node.js:

```typescript
const users = await prisma.user.findMany({
  where: { profileImageUrl: { contains: 'http' } }
});

for (const user of users) {
  const relativePath = user.profileImageUrl!.split('/uploads/')[1];
  await prisma.user.update({
    where: { id: user.id },
    data: { profileImageUrl: `uploads/${relativePath}` }
  });
}
```

---

## 📝 Casos de Uso

### Caso 1: Cambiar IP del servidor
```
Antes: BD tiene "http://192.168.100.3:3001/uploads/..."
Cambio a nueva IP: 192.168.200.5
Resultado: 
  - BD sigue igual (ruta relativa)
  - Frontend usa nuevo API_URL
  - Imágenes funcionan automáticamente ✅
```

### Caso 2: Subir a producción
```
Desarrollo: API_URL = "http://192.168.100.3:3001"
Producción: API_URL = "https://app.ejemplo.com"
Resultado:
  - BD sin cambios (ruta relativa)
  - Frontend adapta API_URL
  - Imágenes se sirven desde producción ✅
```

### Caso 3: Integración con almacenamiento cloud (ej: AWS S3)
```
// Future: Cambiar backend para usar S3
const fileUrl = await s3.uploadFile(file);
// Si retorna: "https://s3.amazonaws.com/bucket/1c69d50.jpg"
// El frontend simplemente lo usa como-es (ya es una URL completa)
```

---

## 🔧 Configuración Actual

### Backend (`index.ts`)
```typescript
// POST /patients/:id/profile-image
app.post('/patients/:id/profile-image', upload.single('profileImage'), async (req, res) => {
  const normalizedPath = file.path.replace(/\\/g, '/');
  // Guarda SOLO: "uploads/abc123.jpg"
  await prisma.user.update({
    data: { profileImageUrl: normalizedPath }
  });
});
```

### Frontend (`perfil.tsx`)
```typescript
// Al cargar
if (imageUrl && !imageUrl.startsWith('http')) {
  imageUrl = `${API_URL}/${imageUrl}`; // Construir URL completa
}

// Al subir
if (uploadedProfileImageUrl && !uploadedProfileImageUrl.startsWith('http')) {
  uploadedProfileImageUrl = `${API_URL}/${uploadedProfileImageUrl}`;
}
```

---

## 🎯 Mejora a Futuro: Almacenamiento Cloud

Cuando quieras escalar, puedes cambiar a cloud sin tocar el frontend:

```typescript
// Backend - Cambiar solo esto
const s3 = new AWS.S3();
const uploadedUrl = await s3.upload({
  Bucket: 'mi-bucket',
  Key: `profile-images/${filename}`,
  Body: file.buffer
}).promise();

// Devolver URL completa desde S3
await prisma.user.update({
  data: { profileImageUrl: uploadedUrl } // URL completa: https://s3.../abc123.jpg
});

// Frontend: Se detecta automáticamente como URL completa y se usa directamente
if (!imageUrl.startsWith('http')) { ... } // No entra aquí
```

---

**Beneficio Principal**: La app ahora es **agnóstica a la infraestructura**. 

Puedes cambiar servidor, cambiar IP, subir a producción, o integrar cloud, **sin tocar el frontend** y sin quebrar las imágenes existentes.

✅ **Portabilidad asegurada**

---

**Actualizado**: 14 de Noviembre de 2025
