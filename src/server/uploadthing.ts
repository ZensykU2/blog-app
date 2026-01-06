import { UTApi } from "uploadthing/server";

export const utapi = new UTApi();

export function getUploadthingKey(url: string | null): string | null {
    if (!url) return null;
    if (!url.includes("utfs.io")) return null;
    const parts = url.split("/");
    return parts[parts.length - 1] ?? null;
}
