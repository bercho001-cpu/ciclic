import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware de Next.js 15 con Supabase SSR.
 *
 * Responsabilidades:
 * 1. Refrescar el token de sesión de Supabase antes de cada render.
 * 2. Redirigir a /login si el usuario no está autenticado en rutas protegidas.
 * 3. Permitir acceso público a: /login, /register, /view/proposal/[shareToken].
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refrescar sesión (NO ejecutar lógica de auth aquí)
  const { data: { user } } = await supabase.auth.getUser();

  // Rutas públicas permitidas sin autenticación
  const publicPaths = ['/login', '/register'];
  const { pathname } = request.nextUrl;

  const isPublicPath =
    publicPaths.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/view/proposal/') ||
    pathname === '/';

  // Redirigir a /login si no está autenticado y la ruta es protegida
  if (!user && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // Redirigir a /dashboard si ya está autenticado e intenta entrar a /login o /register
  if (user && (pathname === '/login' || pathname === '/register')) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
