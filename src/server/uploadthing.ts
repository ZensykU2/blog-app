import { UTApi } from "uploadthing/server";

export const utapi = new UTApi();

export function getUploadthingKey(url: string | null): string | null {
    if (!url) return null;
    // UploadThing URLs usually contain /f/ before the key
    // Examples: https://utfs.io/f/key, https://<app>.ufs.sh/f/key
    if (!url.includes("/f/")) return null;

    const parts = url.split("/");
    return parts[parts.length - 1] ?? null;
}
