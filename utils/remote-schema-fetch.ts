import { dashboardFetch } from "@/utils/dashboard-api";

export type PulledFile = { name: string; content: string };

export type RemoteSchemaData = {
  files: PulledFile[];
  error?: string;
};

export const SCHEMA_REMOTE_SWR_KEY = "schema-remote";

export async function fetchRemoteSchema(): Promise<RemoteSchemaData> {
  const listRes = await dashboardFetch("/api/schema/files");
  if (!listRes.ok) {
    const data = await listRes.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || listRes.statusText);
  }
  const listData = (await listRes.json()) as {
    files?: (string | { filename?: string })[];
  };
  const rawNames = Array.isArray(listData.files) ? listData.files : [];
  const names = rawNames
    .map((n) =>
      typeof n === "string"
        ? n
        : n && typeof n === "object" && "filename" in n
          ? (n as { filename: string }).filename
          : "",
    )
    .filter(Boolean);
  if (names.length === 0) {
    return { files: [] };
  }
  const files: PulledFile[] = [];
  for (const name of names) {
    const fileRes = await dashboardFetch(
      `/api/schema/files?name=${encodeURIComponent(name)}`,
    );
    if (!fileRes.ok) {
      const errData = await fileRes.json().catch(() => ({}));
      throw new Error(
        (errData as { error?: string }).error || fileRes.statusText,
      );
    }
    const content = await fileRes.text();
    try {
      const parsed = JSON.parse(content) as { content?: string };
      files.push({
        name,
        content: typeof parsed.content === "string" ? parsed.content : content,
      });
    } catch {
      files.push({ name, content });
    }
  }
  return { files };
}
