import Sqids from "sqids";

const sqids = new Sqids({
    minLength: 6,
});


export function encodeId(id: number): string {
    return sqids.encode([id]);
}

export function decodeId(hash: string): number | null {
    const decoded = sqids.decode(hash);
    return decoded[0] ?? null;
}
