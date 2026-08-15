# ⚡ Stack Tecnológico y Guía de Supabase (Free Tier) — Ciclic

## 1. Topología del Stack Tecnológico 100% Gratuito

Ciclic está diseñado para ejecutarse permanentemente con **costo $0 USD**, aprovechando al máximo las cuotas gratuitas más generosas de la industria sin comprometer rendimiento, seguridad ni calidad técnica.

```
┌─────────────────────────────────────────────────────────────┐
│                 DESPLIEGUE (Hosting Gratuito)               │
│               Vercel Hobby Plan / Netlify Free              │
│       - SSL Gratuito, CI/CD Automático desde GitHub         │
│       - Edge Network Global y Serverless Functions          │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    FRONTEND & BACKEND API                   │
│                    Next.js 15 + TypeScript                  │
│       - App Router & Server Components (RSC)                │
│       - Server Actions para mutaciones type-safe            │
│       - Vanilla CSS / Tailwind + Tokens HSL                 │
│       - Lucide React (Íconos libres)                        │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                   PERSISTENCIA & SEGURIDAD                  │
│                      Supabase Free Tier                     │
│       - PostgreSQL 15+ (500 MB almacenamiento)              │
│       - Supabase Auth (50.000 MAU gratis)                   │
│       - Row Level Security (RLS) obligatorio por usuario    │
│       - Backups automáticos y API REST/GraphQL automática   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Límites y Gestión de Cuotas Gratuitas

| Servicio | Límite Free Tier | Consumo Estimado de Ciclic | Margen de Seguridad |
| :--- | :--- | :--- | :--- |
| **Supabase PostgreSQL** | 500 MB base de datos | ~5 MB para 5.000 proyectos y 50.000 tareas | 99% libre |
| **Supabase Auth** | 50.000 usuarios activos/mes | 1 a 1.000 usuarios (uso personal/agencia) | 98% libre |
| **Supabase Storage** | 1 GB archivos | No requerido inicialmente (PDFs se generan on-the-fly) | 100% libre |
| **Vercel Bandwidth** | 100 GB/mes | ~2 GB/mes | 98% libre |
| **Vercel Serverless Invokes**| 1.000.000 ejecuciones/mes | ~20.000 llamadas/mes | 98% libre |

---

## 3. Configuración de Supabase

### 3.1. Variables de Entorno (`.env.local`)
Crea un archivo `.env.local` con las credenciales de tu proyecto en Supabase:

```env
# Claves públicas para el cliente Next.js
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-publica

# Clave de servicio para tareas administrativas (solo en servidor, opcional)
SUPABASE_SERVICE_ROLE_KEY=tu-clave-service-role
```

### 3.2. Clientes Supabase para SSR y Cliente (Next.js App Router)

Implementamos la arquitectura estándar recomendada por Supabase para Next.js con soporte de cookies y sesiones seguras:

#### Cliente Navegador (`/src/infrastructure/supabase/client.ts`):
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

#### Cliente Servidor (`/src/infrastructure/supabase/server.ts`):
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Manejo seguro en Server Components de solo lectura
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Manejo seguro
          }
        },
      },
    }
  );
}
```

---

## 4. Motor de Exportación de Cotizaciones a Costo Cero

En lugar de utilizar servicios de renderizado de PDF en la nube que cobran por página (como DocRaptor o Puppeteer serverless que agotan memoria), Ciclic utiliza:

1. **Generación Cliente con CSS `@media print`:**
   - Hoja de estilos dedicada para impresión limpia que genera PDFs vectoriales impecables directamente mediante el diálogo nativo del navegador (`window.print()`).
2. **Generación con `@react-pdf/renderer` (Opcional):**
   - Renderiza un documento PDF directamente en el cliente o servidor Node.js sin navegadores headless pesados.
