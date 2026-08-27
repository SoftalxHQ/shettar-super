"use client"

import { forwardRef, useCallback } from "react"

import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
import { useImageRemove } from "@/components/tiptap-ui/image-remove-button/use-image-remove"
import { TrashIcon } from "@/components/tiptap-icons/trash-icon"
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button } from "@/components/tiptap-ui-primitive/button"

export interface ImageRemoveButtonProps extends Omit<ButtonProps, "type"> {
  text?: string
}

export const ImageRemoveButton = forwardRef<HTMLButtonElement, ImageRemoveButtonProps>(
  ({ text = "Remove", onClick, children, ...buttonProps }, ref) => {
    const { editor } = useTiptapEditor()
    const { canRemove, handleRemove } = useImageRemove(editor)

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        handleRemove()
      },
      [handleRemove, onClick]
    )

    return (
      <Button
        type="button"
        variant="ghost"
        role="button"
        tabIndex={-1}
        disabled={!canRemove}
        data-disabled={!canRemove}
        aria-label="Remove image"
        tooltip="Remove image"
        onClick={handleClick}
        {...buttonProps}
        ref={ref}
      >
        {children ?? (
          <>
            <TrashIcon className="tiptap-button-icon" />
            {text && <span className="tiptap-button-text">{text}</span>}
          </>
        )}
      </Button>
    )
  }
)

ImageRemoveButton.displayName = "ImageRemoveButton"
