import { NextRequest, NextResponse } from "next/server";
import { DATA_MODE } from "@/lib/config/data-mode";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/");

  if (DATA_MODE === "mock") {
    return NextResponse.json({ message: "BFF Mock Response", path });
  }

  return NextResponse.json({ message: "BFF Real Proxy Response", path });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/");

  if (DATA_MODE === "mock") {
    return NextResponse.json({ message: "BFF Mock Response", path });
  }

  return NextResponse.json({ message: "BFF Real Proxy Response", path });
}
