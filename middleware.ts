import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isLoginPage = path.startsWith("/login");

  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    let isStoreStaff = false;
    if (user.email) {
      const { data } = await supabase.from("store_users").select("store_id").eq("email", user.email).maybeSingle();
      isStoreStaff = !!data;
    }

    if (isLoginPage) {
      return NextResponse.redirect(new URL(isStoreStaff ? "/store" : "/dashboard", request.url));
    }
    // Store staff can only ever see the /store area — never the admin panel,
    // even by typing a URL directly. Admin data is also protected by RLS,
    // this just keeps the navigation experience clean.
    // NOTE: must be an exact "/store" or "/store/..." match — "/stores/..."
    // (the admin section) is a different route and must NOT match here.
    const isStoreArea = path === "/store" || path.startsWith("/store/");
    if (isStoreStaff && !isStoreArea) {
      return NextResponse.redirect(new URL("/store", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
