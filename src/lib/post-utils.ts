/**
 * Extracts the first image URL and its definition from post content.
 * Returns the data URL of the first image found in reference style ![alt][id].
 */
export function extractCoverImage(content: string): string | null {
    const images = extractImages(content, 1);
    return images[0] ?? null;
}

export function extractImages(content: string, limit: number = 4): string[] {
    if (!content) return [];

    const images: string[] = [];

    // Extract image references in the format ![alt][id]
    const refMatches = content.matchAll(/!\[.*?\]\s*\[(img[a-z0-9]+)\]/g);
    const imageIds: string[] = [];

    for (const match of refMatches) {
        if (match[1] && imageIds.length < limit) {
            imageIds.push(match[1]);
        }
    }

    // Find the data URLs for these IDs
    for (const id of imageIds) {
        const defRegex = new RegExp(`\\[${id}\\]:\\s*(data:image\\/[a-zA-Z0-9]+;base64,\\S+)`);
        const defMatch = content.match(defRegex);

        if (defMatch?.[1] && images.length < limit) {
            images.push(defMatch[1]);
        }
    }

    return images;
}
