import { NextResponse } from "next/server";

/** Kamal-proxy defaults to GET /up and expects HTTP 200. */
export function GET() {
  return new NextResponse("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
