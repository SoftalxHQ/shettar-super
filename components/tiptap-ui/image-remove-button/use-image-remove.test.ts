import { describe, expect, it, vi } from "vitest"
import type { Editor } from "@tiptap/react"
import { canRemoveSelectedImage, removeSelectedImage } from "./use-image-remove"

function mockEditor(overrides: Partial<Editor> = {}): Editor {
  const run = vi.fn(() => true)
  const deleteSelection = vi.fn(() => ({ run }))
  const focus = vi.fn(() => ({ deleteSelection }))
  const chain = vi.fn(() => ({ focus }))

  return {
    isEditable: true,
    isActive: (name: string) => name === "image",
    state: { selection: {} },
    chain,
    ...overrides,
  } as unknown as Editor
}

describe("removeSelectedImage", () => {
  it("does not delete when the editor is missing", () => {
    expect(canRemoveSelectedImage(null)).toBe(false)
    expect(removeSelectedImage(null)).toBe(false)
  })

  it("does not delete when no image is selected", () => {
    const editor = mockEditor({ isActive: () => false })
    expect(canRemoveSelectedImage(editor)).toBe(false)
    expect(removeSelectedImage(editor)).toBe(false)
  })

  it("deletes the selected image", () => {
    const editor = mockEditor()
    expect(canRemoveSelectedImage(editor)).toBe(true)
    expect(removeSelectedImage(editor)).toBe(true)
    expect(editor.chain).toHaveBeenCalled()
  })

  it("does not delete when the editor is read-only", () => {
    const editor = mockEditor({ isEditable: false })
    expect(canRemoveSelectedImage(editor)).toBe(false)
    expect(removeSelectedImage(editor)).toBe(false)
  })
})
