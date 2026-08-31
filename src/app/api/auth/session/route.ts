import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    return NextResponse.json({ session });
  } catch {
    return NextResponse.json({ session: null }, { status: 200 });
  }
}