# Sistema de Componentes

## Filosofía de Diseño

Los componentes de la interfaz de usuario están construidos sobre **Material-UI (MUI) v5**, una librería de componentes robusta y personalizable.  

La estrategia es utilizar los componentes base de MUI y extenderlos o componerlos para crear componentes específicos de la aplicación, siguiendo principios de diseño atómico pero adaptados a una arquitectura por características.

---

## Estructura de Carpetas

Los componentes se organizan en dos carpetas principales, reflejando su nivel de reutilización y dominio:

### 1. `src/components/` (Componentes Compartidos y de UI Global)

**Propósito:**  
Albergar componentes que son reutilizables en múltiples características o que forman parte de la infraestructura global de la UI.

**Subcarpetas:**

- `ui/`:  
  Componentes de UI puramente genéricos y altamente reutilizables, como `Button`, `Modal`, `TabPanel`, `Input`.  
  Suelen ser wrappers delgados sobre componentes de MUI con estilos o props por defecto de la aplicación.

- `layout/`:  
  Componentes relacionados con la estructura de la página, como `DynamicNavigation`.

- `auth/`, `chatbot/`, `notificaciones/`, `usuario/`:  
  Componentes compartidos que están vinculados a una funcionalidad de negocio específica pero que son utilizados en más de una característica (ej. `LoginForm` es usado por la página de login y quizás un modal).  
  Son menos genéricos que los de `ui/`.

- `home/`:  
  Componentes agrupados para la sección pública de marketing (landing page).

---

### 2. `src/features/[feature]/components/` (Componentes Específicos de una Característica)

**Propósito:**  
Contener componentes que son exclusivos de una característica de negocio y no se espera que sean reutilizados fuera de ella.

Por ejemplo, `DocumentacionStep`, `BCRAStep` y `DecisionStep` dentro de `src/features/operador/components/`  
(aunque en el código actual están en `src/components/operador/steps/`, una reestructuración futura podría moverlos aquí).

**Ventaja:**  
Mantiene el código de una característica encapsulado y facilita su mantenimiento o futura extracción como un paquete independiente.

---

## Patrones de Diseño Comunes

### 1. Componentes de Página (Page Components)

Son los componentes que se renderizan directamente desde el App Router de Next.js (ej. `src/app/(dashboard)/documentos/page.tsx`).

Su responsabilidad es orquestar la página:

- Obtener datos iniciales (a través de hooks).
- Definir el layout principal de la página.
- Manejar el estado de la UI de alto nivel (ej. qué pestaña está activa).
- Pasar datos y manejadores de eventos a los componentes hijos más pequeños.
- Manejar estados de carga y error.

#### Ejemplo de patrón en `DocumentosOperadorPage`

```tsx
export default function DocumentosOperadorPage() {
  // 1. Hooks para estado de UI y datos
  const [tabValue, setTabValue] = useState(0);
  const { documentos, loading, error, cargarDocumentos } = useDocumentos();

  // 2. Efectos para carga inicial
  useEffect(() => { cargarTodosLosDocumentos(); }, []);

  // 3. Manejadores de eventos de la página
  const handleTabChange = (event, newValue) => { setTabValue(newValue); };
  const handleDescargar = async (comprobante) => { ... };

  // 4. Renderizado condicional (loading, error)
  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  // 5. Renderizado de la UI con componentes hijos
  return (
    <Container>
      <Typography>Gestión de documentos</Typography>
      <Tabs value={tabValue} onChange={handleTabChange}>...</Tabs>
      <TabPanel value={tabValue} index={0}>
        <TablaContratos data={contratos} onDownload={handleDescargar} />
      </TabPanel>
    </Container>
  );
}
```

---

### 2. Componentes de Presentación (Presentational Components)

Son componentes enfocados únicamente en cómo se ven las cosas.  

- Reciben datos y callbacks a través de props.
- No gestionan lógica de negocio compleja.
- Son ideales para ser reutilizados.
- Facilitan las pruebas unitarias.

Muchos de los componentes en `src/components/ui/` y los que renderizan tablas o tarjetas dentro de las páginas siguen este patrón.

#### Ejemplo hipotético de un componente de presentación

```tsx
interface ContratoCardProps {
  contrato: ContratoOperador;
  onDownload: (id: string) => void;
}

export const ContratoCard = ({ contrato, onDownload }: ContratoCardProps) => {
  return (
    <Card>
      <CardContent>
        <Typography>{contrato.numero_contrato}</Typography>
        <Typography>{contrato.solicitante_nombre}</Typography>
        <Button onClick={() => onDownload(contrato.id)}>Descargar</Button>
      </CardContent>
    </Card>
  );
};
```

---

### 3. Componentes de Contenedor / Inteligentes (Container / Smart Components)

Son componentes que se preocupan por cómo funcionan las cosas.

- Obtienen datos.
- Gestionan el estado.
- Proporcionan la lógica a los componentes de presentación.

Los componentes de página y los hooks personalizados actúan como contenedores inteligentes.

Los hooks personalizados, aunque no son componentes en sí mismos, son una forma moderna y efectiva de extraer y compartir lógica de estado entre componentes.

---

### 4. Uso de Wrappers de MUI

Para mantener la consistencia y simplificar los estilos, se crean wrappers delgados de componentes MUI en `src/components/ui/`.

#### Ejemplo: `src/components/ui/button.tsx`

```tsx
import * as React from "react"
import { Button as MuiButton, ButtonProps as MuiButtonProps } from "@mui/material"

export const Button = React.forwardRef<HTMLButtonElement, MuiButtonProps>(
  ({ variant = "contained", ...props }, ref) => {
    return <MuiButton ref={ref} variant={variant} {...props} />;
  }
);

Button.displayName = "Button"
```

Esto permite:

- Establecer valores por defecto consistentes para toda la aplicación.
- Cambiar la librería de UI subyacente en el futuro con un mínimo impacto.
- Crear una interfaz más limpia y específica para el dominio de la aplicación.

---

## Componentes Clave y su Propósito

### `DynamicNavigation`  
`src/components/layout/DynamicNavigation.tsx`

Renderiza el menú de navegación del sidebar de forma dinámica basándose en el rol del usuario (obtenido de `useSession()`).

---

### `NotificacionesBell` y `NotificacionesModal`  
`src/components/notificaciones/`

Gestionan:

- La visualización de notificaciones no leídas en el header.
- Un modal con el detalle completo de notificaciones.

---

### `VisorWordFirma`  
`src/components/FirmaDigital/VisorWordFirma.tsx`

Un componente complejo que permite:

- Visualizar un contrato (en un formato de texto simulado).
- Agregar firmas digitales arrastrándolas.
- Enviar la firma al backend.

---

### `RevisionModal`  
`src/components/operador/RevisionModal.tsx`

Un modal de varios pasos que guía al operador a través del proceso de revisión de una solicitud, dividiendo la lógica en subcomponentes de paso como:

- `ResumenStep`
- `DocumentacionStep`
- `BCRAStep`
- `DecisionStep`

---

### `SolicitudCreditoForm`  
`src/components/solicitudes/SolicitudCreditoForm.tsx`

Formulario multi-paso que permite al solicitante:

- Crear una nueva solicitud de crédito.
- Gestionar el estado del formulario.
- Subir documentos requeridos.
- Validar información antes de enviarla al backend.

---

