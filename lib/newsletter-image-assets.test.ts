import { describe, expect, it } from "vitest";
import { collectImageAssetIds, removedAssetIds } from "./newsletter-image-assets";

function fakeDoc(nodes: Array<{ type: string; attrs?: Record<string, unknown> }>) {
  return {
    descendants(fn: (node: { type: { name: string }; attrs: Record<string, unknown> }) => void) {
      nodes.forEach((node) => fn({ type: { name: node.type }, attrs: node.attrs ?? {} }));
    },
  };
}

describe("newsletter image assets", () => {
  it("collects asset ids from image nodes", () => {
    const ids = collectImageAssetIds(
      fakeDoc([
        { type: "paragraph" },
        { type: "image", attrs: { src: "https://cdn.example/a.png", assetId: 12 } },
        { type: "image", attrs: { src: "https://cdn.example/b.png" } },
        { type: "image", attrs: { src: "https://cdn.example/c.png", assetId: "15" } },
      ])
    );

    expect(ids).toEqual(["12", "15"]);
  });

  it("falls back to a session url map when the asset id attr is missing", () => {
    const ids = collectImageAssetIds(
      fakeDoc([{ type: "image", attrs: { src: "https://cdn.example/a.png" } }]),
      { "https://cdn.example/a.png": "21" }
    );

    expect(ids).toEqual(["21"]);
  });

  it("returns unique ids that disappeared from the document", () => {
    expect(removedAssetIds(["12", "12", "15", "18"], ["15"])).toEqual(["12", "18"]);
    expect(removedAssetIds(["12", "12"], ["12"])).toEqual([]);
  });
});
