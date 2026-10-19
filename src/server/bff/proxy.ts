import { NextRequest, NextResponse } from "next/server";

export async function proxyRequest(request: NextRequest, targetPath: string) {
  return NextResponse.json({ message: "Proxy placeholder", path: targetPath });
}
