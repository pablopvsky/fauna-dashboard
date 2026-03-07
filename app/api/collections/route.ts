import { NextResponse } from "next/server";
import { getClient, getCollectionNamesList } from "@/utils/fauna-client";

export async function GET(request: Request) {
  try {
    const client = getClient(request);
    const names = await getCollectionNamesList(client);
    return NextResponse.json({ success: true, names });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
