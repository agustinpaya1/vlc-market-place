# Sistema de Códigos QR Seguros - VLC Market Place

## Resumen de Seguridad

Este documento describe las mejoras de seguridad implementadas en el sistema de códigos QR para prevenir falsificaciones, manipulaciones y uso no autorizado.

## Problemas Identificados y Solucionados

### 1. **Generación de QR sin key_id**
- **Problema**: Los QR se generaban sin guardar la clave pública (`key_id`) en la base de datos
- **Solución**: Ahora se guarda tanto la clave pública como un hash de la misma para búsquedas rápidas

### 2. **Validación deficiente**
- **Problema**: Solo se verificaba la existencia del QR, no su autenticidad criptográfica
- **Solución**: Implementada verificación de firma digital Ed25519

### 3. **No se actualizaba el estado del QR**
- **Problema**: El método `markQRAsUsed()` buscaba por `signature` en lugar de `order_id` y `code`
- **Solución**: Corregida la lógica de búsqueda y actualización

### 4. **Falta de verificación de propiedad**
- **Problema**: No se verificaba que el usuario validando fuera el propietario de la tienda
- **Solución**: Agregada verificación de `owner_id` antes de permitir validaciones

## Arquitectura de Seguridad

### Criptografía Ed25519
- **Algoritmo**: Ed25519 (curva elíptica de alta seguridad)
- **Claves**: Par de claves única por cada QR
- **Firma**: Firma digital del payload completo
- **Verificación**: Verificación criptográfica en cada validación

### Estructura del QR
```json
{
  "order_id": "uuid-del-pedido",
  "code": "codigo-unico-del-qr",
  "payload": "datos-originales-firmados",
  "signature": "firma-digital-ed25519",
  "public_key": "clave-publica-base64",
  "key_id": "hash-sha256-clave-publica"
}
```

### Base de Datos
```sql
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  store_id UUID REFERENCES stores(id),
  code TEXT UNIQUE NOT NULL,
  payload JSONB NOT NULL,
  signature TEXT NOT NULL,
  public_key TEXT,
  key_id TEXT,
  validation_attempts INTEGER DEFAULT 0,
  is_valid BOOLEAN DEFAULT true,
  used_at TIMESTAMP,
  used_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Proceso de Validación

### 1. Verificación de Propiedad
- Se verifica que el usuario sea propietario de la tienda
- Se consulta `stores.owner_id = auth.uid()`

### 2. Validación Criptográfica
- Se parsean los datos del QR escaneado
- Se verifica la firma digital usando la clave pública
- Se valida que el payload no haya sido modificado

### 3. Verificaciones de Seguridad
- **Timestamp**: QR no debe ser muy antiguo (máximo 24 horas)
- **Nonce**: Previene ataques de replay
- **Intentos**: Máximo 3 intentos de validación fallidos
- **Estado**: El QR debe estar marcado como válido

### 4. Actualización de Estado
- Se marca el QR como usado (`is_valid = false`)
- Se registra quién y cuándo lo usó
- Se actualiza el timestamp de uso

## Medidas Anti-Fraude

### 1. **Prevención de Replay Attacks**
- Cada QR incluye un nonce único
- Timestamp de creación con expiración
- Estado de uso único

### 2. **Verificación de Integridad**
- Firma digital de todo el payload
- Hash de verificación de la clave pública
- Validación cruzada con base de datos

### 3. **Control de Acceso**
- Solo propietarios de tienda pueden validar
- RLS (Row Level Security) en base de datos
- Verificación de permisos en múltiples capas

### 4. **Auditoría**
- Log completo de intentos de validación
- Registro de quién marcó QRs como usados
- Timestamps de todas las operaciones

## Políticas de Seguridad en Base de Datos

```sql
-- Solo propietarios pueden ver sus QRs
CREATE POLICY qr_codes_select_policy ON qr_codes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores s 
      WHERE s.id = qr_codes.store_id 
      AND s.owner_id = auth.uid()
    )
  );

-- Solo propietarios pueden actualizar sus QRs
CREATE POLICY qr_codes_update_policy ON qr_codes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores s 
      WHERE s.id = qr_codes.store_id 
      AND s.owner_id = auth.uid()
    )
  );
```

## Flujo de Validación Seguro

1. **Escaneo del QR**: Usuario escanea código QR
2. **Parseo**: Se extraen y validan los datos del QR
3. **Autenticación**: Se verifica que el usuario esté autenticado
4. **Autorización**: Se verifica que sea propietario de la tienda
5. **Validación Criptográfica**: Se verifica la firma digital
6. **Verificaciones de Seguridad**: Timestamp, estado, intentos
7. **Actualización**: Se marca como usado y se actualiza el pedido
8. **Auditoría**: Se registra la operación

## Beneficios de Seguridad

- **Imposible falsificar**: Sin la clave privada no se puede crear una firma válida
- **Detección de manipulación**: Cualquier cambio en el payload invalida la firma
- **Control de acceso**: Solo propietarios autorizados pueden validar
- **Prevención de reutilización**: QRs de un solo uso
- **Auditoría completa**: Registro de todas las operaciones
- **Expiración automática**: QRs con tiempo de vida limitado

## Recomendaciones Adicionales

1. **Rotación de Claves**: Considerar rotación periódica de claves maestras
2. **Monitoreo**: Alertas por intentos de validación fallidos repetidos
3. **Backup**: Respaldo seguro de claves y datos críticos
4. **Actualización**: Mantener bibliotecas criptográficas actualizadas
5. **Testing**: Pruebas regulares de penetración y seguridad
