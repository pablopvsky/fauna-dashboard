import { NextResponse } from "next/server";
import { getClient, getCollectionNamesList } from "@/utils/fauna-client";

const NO_CONNECTION_MESSAGE = "No connection. Set and activate a connection on Home.";

export async function GET(request: Request) {
  try {
    const client = getClient(request);
    if (!client) {
      return NextResponse.json(
        { success: false, error: NO_CONNECTION_MESSAGE },
        { status: 401 }
      );
    }
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
