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

Implementamos la arquitectura estándar recomendada por Supabase para Next.js 15 con soporte de cookies y sesiones seguras:

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

### 3.3. Middleware de Autenticación y Refresco de Sesión (`/src/middleware.ts`)

En Next.js 15, el middleware refresca los tokens de sesión de Supabase antes de cargar cualquier ruta y protege las secciones autenticadas (`/dashboard`, `/projects/*`, `/settings/*`), permitiendo acceso anónimo a `/login`, `/register` y propuestas públicas (`/view/proposal/*`).

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Rutas públicas que no requieren autenticación
  const isPublicRoute = 
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register') ||
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/view/proposal');

  if (!user && !isPublicRoute && request.nextUrl.pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

---

## 4. Estructura de Directorios del Proyecto (Clean Architecture + App Router)

```text
ciclic/
├── src/
│   ├── app/                      # Next.js 15 App Router (Páginas, Layouts, Server Actions)
│   │   ├── (auth)/               # Rutas de autenticación (/login, /register)
│   │   ├── (dashboard)/          # Rutas protegidas (/dashboard, /projects, /settings)
│   │   │   ├── dashboard/
│   │   │   ├── projects/
│   │   │   │   ├── new/
│   │   │   │   └── [id]/
│   │   │   └── settings/
│   │   │       ├── rates/
│   │   │       └── profile/
│   │   ├── view/                 # Rutas públicas (ej. /view/proposal/[shareToken])
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/               # Componentes UI reutilizables (Design System)
│   ├── domain/                   # Capa de Dominio Pura (TypeScript)
│   │   ├── aggregates/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── services/
│   │   └── repositories/
│   ├── application/              # Capa de Aplicación (Use Cases, DTOs)
│   │   ├── use-cases/
│   │   └── dtos/
│   ├── infrastructure/           # Capa de Infraestructura (Supabase, PDF, Adapters)
│   │   ├── supabase/
│   │   └── repositories/
│   └── tests/                    # Tests E2E y setup global
├── docs/                         # Documentación técnica
├── playwright.config.ts          # Configuración de Playwright para TDD y E2E
└── package.json
```

---

## 5. Motor de Exportación de Cotizaciones a Costo Cero

En lugar de utilizar servicios de renderizado de PDF en la nube que cobran por página (como DocRaptor o Puppeteer serverless que agotan memoria), Ciclic utiliza:

1. **Generación Cliente con CSS `@media print`:**
   - Hoja de estilos dedicada para impresión limpia que genera PDFs vectoriales impecables directamente mediante el diálogo nativo del navegador (`window.print()`).
2. **Generación con `@react-pdf/renderer` (Opcional):**
   - Renderiza un documento PDF directamente en el cliente o servidor Node.js sin dependencias pesadas de navegador headless.

---

## 6. Configuración de Google Sign-In (Supabase Free Tier)

Supabase Auth incluye soporte gratuito para autenticación con proveedores OAuth, como Google. Para configurarlo con Next.js 15 sin costo adicional:

### 6.1. Configuración en Google Cloud Console
1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un nuevo proyecto.
3. Ve a **APIs & Services > Credentials** (APIs y Servicios > Credenciales).
4. Configura la **OAuth consent screen** (Pantalla de consentimiento OAuth):
   - Tipo de usuario: **External** (Externo).
   - Registra tu App name, email de soporte y el dominio autorizado de Supabase (`tu-proyecto.supabase.co`).
5. En la sección **Credentials**, haz clic en **Create Credentials > OAuth client ID** (Crear credenciales > ID de cliente de OAuth):
   - Application type: **Web application** (Aplicación web).
   - **Authorized JavaScript origins** (Orígenes autorizados de JavaScript):
     - `http://localhost:3000` (para desarrollo).
     - `https://tu-proyecto.supabase.co` (URL de tu proyecto de Supabase).
   - **Authorized redirect URIs** (URIs de redireccionamiento autorizadas):
     - `https://tu-proyecto.supabase.co/auth/v1/callback` (este callback te lo provee Supabase en el panel de Auth).

### 6.2. Configuración en Supabase Dashboard
1. Ve a **Authentication > Providers > Google** en tu panel de Supabase.
2. Activa el proveedor de Google (Enabled).
3. Introduce el **Client ID** y el **Client Secret** generados por Google Cloud Console en el paso anterior.
4. Asegúrate de configurar la URL de redirección global del sitio en **Authentication > URL Configuration**:
   - Site URL: `https://tu-sitio.vercel.app` (o `http://localhost:3000` en desarrollo).
   - Redirect URLs: `https://tu-sitio.vercel.app/auth/callback` (para el flujo SSR en Next.js).

### 6.3. Implementación del Cliente en Next.js (SignIn Button)
Usa el SDK del cliente navegador para disparar el flujo de autenticación:
```typescript
import { createClient } from '@/infrastructure/supabase/client';

export function GoogleSignInButton() {
  const supabase = createClient();

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <button onClick={handleSignIn} className="google-sign-in-btn">
      Sign in with Google
    </button>
  );
}
```

---

## 7. Internacionalización de la Página (i18n: Inglés / Español)

Para implementar i18n en Next.js 15 (App Router) sin usar librerías complejas que requieran configuraciones pesadas de middleware, se utiliza un enfoque de **diccionarios dinámicos locales** integrados con los segmentos dinámicos de rutas de Next.js (`[locale]`).

### 7.1. Estructura de Diccionarios de Traducción (`src/locales/`)
Crea los archivos de diccionarios en JSON para cada idioma soportado:

* **Español (`src/locales/es.json`):**
```json
{
  "dashboard": {
    "title": "Salud Financiera",
    "totalInvoiced": "Total Facturado",
    "totalCollected": "Cobrado en Mano",
    "pendingCollected": "Pendiente de Cobro"
  }
}
```

* **Inglés (`src/locales/en.json`):**
```json
{
  "dashboard": {
    "title": "Financial Health",
    "totalInvoiced": "Total Invoiced",
    "totalCollected": "Collected in Hand",
    "pendingCollected": "Pending Collection"
  }
}
```

### 7.2. Función Cargadora de Diccionarios (`src/locales/get-dictionary.ts`):
```typescript
const dictionaries = {
  en: () => import('./en.json').then((module) => module.default),
  es: () => import('./es.json').then((module) => module.default),
};

export const getDictionary = async (locale: 'en' | 'es') => {
  return dictionaries[locale]();
};
```

### 7.3. Integración en Next.js 15 App Router (`src/app/[locale]/`):
En Next.js App Router, todas las páginas del dashboard y del cotizador se ubican bajo el directorio dinámico `[locale]`.
```typescript
import { getDictionary } from '@/locales/get-dictionary';

interface PageProps {
  params: Promise<{ locale: 'en' | 'es' }>;
}

export default async function DashboardPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getDictionary(locale);

  return (
    <div>
      <h1>{t.dashboard.title}</h1>
      <p>{t.dashboard.totalInvoiced}</p>
    </div>
  );
}
```

---

## 8. Selector de Tema (Light, Dark, System)

Para implementar el selector de tema rápido, fluido y sin parpadeos (Flicker) en Next.js 15, se utiliza **vanilla CSS con variables HSL** y una clase global `.dark` o `.light` inyectada en el elemento `<html>`.

### 8.1. Proveedor de Tema (`src/components/theme-provider.tsx`)
```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
} | undefined>(undefined);

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('system');

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'system';
    setThemeState(savedTheme);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
```

### 8.2. Componente Selector de Tema (`src/components/theme-toggle.tsx`)
```typescript
'use client';

import { useTheme } from './theme-provider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
      className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded p-1"
    >
      <option value="light">☀️ Light</option>
      <option value="dark">🌙 Dark</option>
      <option value="system">💻 System</option>
    </select>
  );
}
```
