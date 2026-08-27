"use client"

import { useCallback } from "react"
import type { Editor } from "@tiptap/react"

import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
import { isNodeTypeSelected } from "@/lib/tiptap-utils"

export function canRemoveSelectedImage(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  return editor.isActive("image") || isNodeTypeSelected(editor, ["image"])
}

export function removeSelectedImage(editor: Editor | null): boolean {
  if (!editor || !canRemoveSelectedImage(editor)) return false
  return editor.chain().focus().deleteSelection().run()
}

export function useImageRemove(editor?: Editor | null) {
  const { editor: tiptapEditor } = useTiptapEditor(editor)
  const canRemove = canRemoveSelectedImage(tiptapEditor)

  const handleRemove = useCallback(() => {
    return removeSelectedImage(tiptapEditor)
  }, [tiptapEditor])

  return { editor: tiptapEditor, canRemove, handleRemove }
}
