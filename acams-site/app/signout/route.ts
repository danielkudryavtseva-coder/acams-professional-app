import { NextResponse } from "next/server";
import { signOut } from "@/auth";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirectTo") ?? "/";
  await signOut({ redirect: false });
  return NextResponse.redirect(new URL(redirectTo, url.origin));
}
