# Backend Testing Documentation — Nexia

## 1. Introducción

Este documento describe la estrategia de pruebas implementada en el backend del sistema Nexia, diseñado bajo los principios de Clean Architecture.

El objetivo del sistema de pruebas es garantizar:

- Correcto funcionamiento de las reglas de negocio
- Validación de los casos de uso del sistema
- Verificación del comportamiento de la API
- Detección temprana de errores antes de producción
- Soporte para refactorizaciones seguras

Las pruebas se ejecutan utilizando:
- **Jest** como framework principal de testing
- **Supertest** para pruebas de integración HTTP
- **Mocks** para aislar dependencias externas

---

## 2. Estructura de Tests

Los tests se encuentran en el directorio:

```
backend/tests/
```

y se organizan siguiendo la misma estructura de Clean Architecture.

```
backend/
├── tests/
│
│   ├── unit/
│   │   ├── domain/
│   │   │   ├── Usuario.test.js
│   │   │   ├── Solicitud.test.js
│   │   │   ├── FirmaDigital.test.js
│   │   │   └── TransferenciaBancaria.test.js
│   │   │
│   │   ├── application/
│   │   │   ├── auth/
│   │   │   │   ├── RegistrarUsuario.test.js
│   │   │   │   └── LoginUsuario.test.js
│   │   │   │
│   │   │   ├── firmas/
│   │   │   │   └── ProcesarFirma.test.js
│   │   │   │
│   │   │   ├── solicitudes/
│   │   │   │   └── AprobarSolicitud.test.js
│   │   │   │
│   │   │   └── transferencias/
│   │   │       └── CrearTransferencia.test.js
│   │   │
│   │   └── infrastructure/
│   │       └── repositories/
│   │           └── mocks/
│   │               └── repositoryMocks.js
│
│   └── integration/
│       ├── auth/
│       │   └── auth.integration.test.js
│       │
│       ├── solicitudes/
│       │   └── solicitudes.integration.test.js
│       │
│       └── firmas/
│           └── firmas.integration.test.js
```

### `backend/jest.config.js`

```javascript
module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverageFrom: [
        'domain/**/*.js',
        'application/**/*.js',
        '!**/node_modules/**',
        '!**/tests/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    setupFilesAfterEnv: ['./tests/helpers/setup.js'],
    verbose: true,
    transformIgnorePatterns: [
        'node_modules/(?!(uuid)/)'
    ],
    moduleNameMapper: {
        '^.*infrastructure/database/supabaseAdmin(\\.js)?$':
            '<rootDir>/tests/__mocks__/supabaseAdmin.js'
    }
};
```

### `backend/tests/__mocks__/supabaseAdmin.js`

```javascript
// Mock manual de supabaseAdmin para tests.
// Se usa via moduleNameMapper en jest.config.js para evitar que el módulo real
// llame a process.exit(1) cuando SUPABASE_SERVICE_ROLE_KEY no está configurada.

const supabaseAdmin = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
        admin: {
            createUser: jest.fn().mockResolvedValue({
                data: { user: { id: 'test-user-id' } },
                error: null
            }),
            updateUserById: jest.fn().mockResolvedValue({
                data: { user: { id: 'test-user-id' } },
                error: null
            }),
            listUsers: jest.fn().mockResolvedValue({
                data: { users: [] },
                error: null
            })
        },
        signInWithPassword: jest.fn().mockResolvedValue({
            data: { session: { access_token: 'test-token' } },
            error: null
        })
    },
    storage: {
        from: jest.fn().mockReturnThis(),
        upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
        download: jest.fn().mockResolvedValue({ data: {}, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'http://test.url' } })
    }
};

const getUserByEmail = jest.fn().mockResolvedValue({
    data: { user: { id: 'test-user-id', email: 'test@example.com' } },
    error: null
});

const confirmUserEmail = jest.fn().mockResolvedValue({
    success: true,
    data: {}
});

module.exports = {
    supabaseAdmin,
    getUserByEmail,
    confirmUserEmail
};
```

---

## 3. Tipos de Tests

### 3.1 Unit Tests

Los tests unitarios verifican el comportamiento de unidades individuales del sistema sin depender de servicios externos.

#### Domain Tests

Validan las entidades del dominio y sus reglas de negocio.

**Ejemplos:**
- Validación de datos obligatorios
- Cambios de estado
- Cálculo de scoring
- Reglas de negocio internas

**Ubicación:** `tests/unit/domain/`

**Entidades probadas:**
- Usuario
- Solicitud
- FirmaDigital
- TransferenciaBancaria

#### Application Tests

Prueban los casos de uso (Use Cases).

En estos tests se utilizan mocks de repositorios para evitar dependencias con base de datos o servicios externos.

**Ubicación:** `tests/unit/application/`

**Casos de uso cubiertos:**

| Módulo | Caso de uso |
|--------|-------------|
| Auth | RegistrarUsuario |
| Auth | LoginUsuario |
| Firmas | ProcesarFirma |
| Solicitudes | AprobarSolicitud |
| Transferencias | CrearTransferencia |

**Ejemplo de validaciones:**
- Permisos de usuario
- Estados de solicitudes
- Manejo de errores
- Ejecución correcta de repositorios

#### Infrastructure Tests

Contienen mocks reutilizables para simular repositorios.

**Ubicación:** `tests/unit/infrastructure/repositories/mocks`

**Archivo:** `repositoryMocks.js`

Estos mocks permiten:
- Simular respuestas de base de datos
- Evitar dependencias externas
- Controlar escenarios de prueba

### 3.2 Integration Tests

Los tests de integración verifican la interacción entre múltiples componentes del sistema.

Incluyen:
- Rutas
- Controladores
- Middlewares
- Casos de uso

Se ejecutan utilizando **Supertest** para simular peticiones HTTP.

**Ubicación:** `tests/integration/`

**Endpoints probados:**

| Módulo | Endpoint |
|--------|----------|
| Auth | registro |
| Auth | login |
| Auth | session |
| Solicitudes | CRUD de solicitudes |
| Firmas | proceso de firma |

**Ejemplo:**

```javascript
const response = await request
  .post('/api/firmas/iniciar-proceso/:solicitud_id')
  .set('Authorization', `Bearer ${token}`)
  .expect(404);
```

---

## 4. Herramientas Utilizadas

| Herramienta | Uso |
|-------------|-----|
| Jest | Framework de testing |
| Supertest | Testing de endpoints HTTP |
| Mock Functions | Simulación de dependencias |
| Jest Coverage | Análisis de cobertura |

---

## 5. Ejecución de Tests

**Ejecutar todos los tests:**

```bash
npm test
```

**Ejecutar solo tests unitarios:**

```bash
npm run test:unit
```

**Ejecutar tests de integración:**

```bash
npm run test:integration
```

**Generar cobertura:**

```bash
npm run test:coverage
```

El reporte se genera en: `coverage/`

---

## 6. Cobertura de Tests

El sistema utiliza Jest Coverage para medir la calidad de las pruebas.

Las métricas evaluadas son:
- Statements
- Functions
- Branches
- Lines

---

## 7. Buenas Prácticas Implementadas

El sistema de pruebas sigue las siguientes prácticas:

- Separación por capas de arquitectura
- Mocks para dependencias externas
- Tests independientes
- Cobertura de casos positivos y negativos
- Uso de tokens de prueba para endpoints protegidos

---

## 8. Test Strategy (Testing Pyramid)

La estrategia de pruebas sigue el modelo **Testing Pyramid**.

```
           ┌─────────────┐
           │    E2E      │
           │ (futuro)    │
           └──────┬──────┘
                  │
        ┌─────────┴─────────┐
        │ Integration Tests │
        └─────────┬─────────┘
                  │
         ┌────────┴────────┐
         │    Unit Tests    │
         └──────────────────┘
```

**Distribución aproximada:**

| Tipo | Porcentaje |
|------|------------|
| Unit Tests | ~80% |
| Integration Tests | ~20% |
| E2E Tests | futuro |

---

## 9. Testing Guidelines

### Patrón AAA

Todos los tests siguen el patrón: **Arrange - Act - Assert**

**Ejemplo:**

```javascript
test('Debe aprobar solicitud', async () => {
  // Arrange
  const solicitud = new Solicitud(mockData);

  // Act
  const result = await aprobarSolicitud.execute(solicitud);

  // Assert
  expect(result.success).toBe(true);
});
```

### Tests independientes

Cada test debe ser aislado.

- ❌ **Incorrecto:** Test B depende de datos creados por Test A
- ✅ **Correcto:** Cada test crea sus propios datos

### Naming claro

**Ejemplos correctos:**
- `Debe crear una solicitud válida`
- `Debe fallar si el monto es negativo`
- `Debe aprobar solicitud exitosamente`

---

## 10. CI/CD Testing Pipeline

Los tests están diseñados para ejecutarse automáticamente en pipelines de CI/CD.

Se ejecutan en:
- push
- pull request
- merge a main

**Flujo del pipeline:**

```
Developer Push
      │
Install Dependencies
      │
Run Linter
      │
Run Unit Tests
      │
Run Integration Tests
      │
Generate Coverage
      │
Deploy
```

**Ejemplo de comandos:**

```bash
npm install
npm test
npm run test:coverage
```

---

## 11. Test Data Management

Los datos utilizados en los tests se generan dinámicamente.

**Principios:**

| Regla | Explicación |
|-------|-------------|
| Datos aislados | Cada test crea sus propios datos |
| Sin datos reales | No usar datos de producción |
| Mocks controlados | Repositorios simulados |

**Ejemplos de datos de prueba:**
- `test-user-id`
- `test-token`
- `solicitud-123`

---

## 12. Test Coverage Strategy

**Cobertura mínima objetivo:**

| Métrica | Objetivo |
|---------|----------|
| Statements | > 80% |
| Functions | > 80% |
| Branches | > 70% |
| Lines | > 80% |

Las capas críticas son:
- Domain Entities
- Application Use Cases
- Security / Authentication
- Financial Operations

---

## 13. Performance Considerations

Los tests deben ejecutarse rápidamente para no afectar el flujo de desarrollo.

**Buenas prácticas implementadas:**
- Uso de mocks
- Tests unitarios rápidos
- Ejecución paralela con Jest

**Tiempo actual de ejecución:**
- 65 tests
- 12 test suites
- ~4 segundos

---

## Resultado

El sistema actual cuenta con:

- **12** test suites
- **65** tests
- **100%** passing
- **~4s** execution time

Lo que garantiza una base sólida de calidad y mantenibilidad para el backend del sistema Nexia.
