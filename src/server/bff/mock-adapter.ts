import { NextResponse } from "next/server";

export async function handleMockRequest(path: string) {
  return NextResponse.json({ message: "Mock adapter placeholder", path });
}
