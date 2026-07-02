"use client"

import { forwardRef, useCallback, useState, type ForwardedRef } from "react"
import { type Editor } from "@tiptap/react"

import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
import { ChevronDownIcon } from "@/components/tiptap-icons/chevron-down-icon"
import { TableIcon } from "@/components/tiptap-icons/table-icon"
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button } from "@/components/tiptap-ui-primitive/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuSeparator,
} from "@/components/tiptap-ui-primitive/dropdown-menu"

export interface TableDropdownMenuProps extends Omit<ButtonProps, "type"> {
  editor?: Editor
  modal?: boolean
}

function runTableCommand(editor: Editor | null, command: () => boolean) {
  if (!editor) return
  command()
}

function TableDropdownMenuImpl(
  { editor: providedEditor, modal = false, ...props }: TableDropdownMenuProps,
  ref: ForwardedRef<HTMLButtonElement>
) {
  const { editor } = useTiptapEditor(providedEditor)
  const [isOpen, setIsOpen] = useState(false)

  const canInsert = editor?.can().insertTable({ rows: 3, cols: 3, withHeaderRow: true }) ?? false
  const isInTable = editor?.isActive("table") ?? false

  const handleInsert = useCallback(() => {
    runTableCommand(editor, () =>
      editor!.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    )
    setIsOpen(false)
  }, [editor])

  if (!editor) return null

  return (
    <DropdownMenu modal={modal} open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          data-active-state={isInTable ? "on" : "off"}
          role="button"
          tabIndex={-1}
          aria-label="Table options"
          tooltip="Table"
          {...props}
          ref={ref}
        >
          <TableIcon className="tiptap-button-icon" />
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <DropdownMenuItem disabled={!canInsert} onSelect={handleInsert}>
            Insert 3×3 table
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {isInTable && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={() =>
                  runTableCommand(editor, () => editor.chain().focus().addRowBefore().run())
                }
              >
                Add row above
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  runTableCommand(editor, () => editor.chain().focus().addRowAfter().run())
                }
              >
                Add row below
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  runTableCommand(editor, () => editor.chain().focus().addColumnBefore().run())
                }
              >
                Add column left
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  runTableCommand(editor, () => editor.chain().focus().addColumnAfter().run())
                }
              >
                Add column right
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={() =>
                  runTableCommand(editor, () => editor.chain().focus().deleteRow().run())
                }
              >
                Delete row
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  runTableCommand(editor, () => editor.chain().focus().deleteColumn().run())
                }
              >
                Delete column
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onSelect={() =>
                  runTableCommand(editor, () => editor.chain().focus().deleteTable().run())
                }
              >
                Delete table
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const TableDropdownMenu = forwardRef(TableDropdownMenuImpl)
TableDropdownMenu.displayName = "TableDropdownMenu"

export default TableDropdownMenu
