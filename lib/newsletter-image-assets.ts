type EditorDoc = {
  descendants: (fn: (node: { type: { name: string }; attrs: Record<string, unknown> }) => void) => void;
};

function lookupUrlMap(urlToAssetId?: Map<string, string> | Record<string, string>) {
  if (!urlToAssetId) return new Map<string, string>();
  return urlToAssetId instanceof Map ? urlToAssetId : new Map(Object.entries(urlToAssetId));
}

export function collectImageAssetIds(
  doc: EditorDoc,
  urlToAssetId?: Map<string, string> | Record<string, string>
): string[] {
  const lookup = lookupUrlMap(urlToAssetId);
  const ids: string[] = [];
  doc.descendants((node) => {
    if (node.type.name !== "image") return;
    const fromAttr = node.attrs.assetId;
    if (fromAttr != null && String(fromAttr).trim() !== "") {
      ids.push(String(fromAttr));
      return;
    }
    const src = node.attrs.src;
    if (src == null) return;
    const mapped = lookup.get(String(src));
    if (mapped) ids.push(mapped);
  });
  return ids;
}

export function removedAssetIds(previous: Iterable<string>, next: Iterable<string>): string[] {
  const remaining = new Set(Array.from(next, String));
  const gone = new Set<string>();
  for (const id of previous) {
    const key = String(id);
    if (!remaining.has(key)) gone.add(key);
  }
  return Array.from(gone);
}
