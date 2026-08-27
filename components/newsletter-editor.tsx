"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, EditorContext, useEditor, type Editor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Selection } from "@tiptap/extensions";
import type { NodeView } from "@tiptap/pm/view";

import { Spacer } from "@/components/tiptap-ui-primitive/spacer";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar";

import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension";
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";

import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";
import { ImageRemoveButton } from "@/components/tiptap-ui/image-remove-button";
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu";
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button";
import { LinkPopover, LinkButton, LinkContent } from "@/components/tiptap-ui/link-popover";
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button";
import { TableDropdownMenu } from "@/components/tiptap-ui/table-dropdown-menu";
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button";
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon";
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon";
import { LinkIcon } from "@/components/tiptap-icons/link-icon";
import { Button } from "@/components/tiptap-ui-primitive/button";
import { pickHighlightColorsByValue } from "@/components/tiptap-ui/color-highlight-button";

import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";
import { MAX_FILE_SIZE } from "@/lib/tiptap-utils";
import { collectImageAssetIds, removedAssetIds } from "@/lib/newsletter-image-assets";

import "@/components/tiptap-templates/simple/simple-editor.scss";
import "./newsletter-editor.scss";

const NEWSLETTER_HIGHLIGHT_COLORS = pickHighlightColorsByValue([
  "var(--tt-color-highlight-yellow)",
  "var(--tt-color-highlight-green)",
  "var(--tt-color-highlight-blue)",
  "var(--tt-color-highlight-purple)",
  "var(--tt-color-highlight-red)",
]);

function attachImageRemoveControl(view: NodeView, getPos: () => number | undefined, editor: Editor): NodeView {
  const { dom } = view;
  if (!(dom instanceof HTMLElement)) return view;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "newsletter-image-remove";
  button.setAttribute("aria-label", "Remove image");
  button.setAttribute("contenteditable", "false");
  button.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M7 5V4C7 3.17477 7.40255 2.43324 7.91789 1.91789C8.43324 1.40255 9.17477 1 10 1H14C14.8252 1 15.5668 1.40255 16.0821 1.91789C16.5975 2.43324 17 3.17477 17 4V5H21C21.5523 5 22 5.44772 22 6C22 6.55228 21.5523 7 21 7H20V20C20 20.8252 19.5975 21.5668 19.0821 22.0821C18.5668 22.5975 17.8252 23 17 23H7C6.17477 23 5.43324 22.5975 4.91789 22.0821C4.40255 21.5668 4 20.8252 4 20V7H3C2.44772 7 2 6.55228 2 6C2.44772 5 3 5H7ZM9 4C9 3.82523 9.09745 3.56676 9.33211 3.33211C9.56676 3.09745 9.82523 3 10 3H14C14.1748 3 14.4332 3.09745 14.6679 3.33211C14.9025 3.56676 15 3.82523 15 4V5H9V4ZM6 7V20C6 20.1748 6.09745 20.4332 6.33211 20.6679C6.56676 20.9025 6.82523 21 7 21H17C17.1748 21 17.4332 20.9025 17.6679 20.6679C17.9025 20.4332 18 20.1748 18 20V7H6Z"/></svg>';

  const stop = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const onClick = (event: Event) => {
    stop(event);
    const pos = getPos();
    if (typeof pos !== "number") return;
    const node = editor.state.doc.nodeAt(pos);
    if (!node) return;
    editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run();
  };

  button.addEventListener("mousedown", stop);
  button.addEventListener("click", onClick);

  const host = (dom.querySelector("[data-resize-wrapper]") as HTMLElement | null) ?? dom;
  host.appendChild(button);

  const originalDestroy = view.destroy?.bind(view);
  view.destroy = () => {
    button.removeEventListener("mousedown", stop);
    button.removeEventListener("click", onClick);
    button.remove();
    originalDestroy?.();
  };

  return view;
}

const NewsletterImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      assetId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-asset-id"),
        renderHTML: (attributes) => {
          if (attributes.assetId == null || String(attributes.assetId).trim() === "") {
            return {};
          }
          return { "data-asset-id": String(attributes.assetId) };
        },
      },
    };
  },
  addNodeView() {
    const parent = this.parent?.();
    if (!parent) return null;

    return (props) => {
      return attachImageRemoveControl(parent(props), props.getPos, props.editor);
    };
  },
});

export type NewsletterUploadedImage = string | { url: string; assetId?: number | string };

export interface NewsletterEditorProps {
  editorKey: string;
  initialContent: string;
  onChange: (html: string) => void;
  onUploadImage: (file: File) => Promise<NewsletterUploadedImage>;
  onDeleteImageAsset?: (assetId: string) => void | Promise<void>;
  placeholder?: string;
  disabled?: boolean;
}

function MainToolbar({
  isMobile,
  onHighlighterClick,
  onLinkClick,
}: {
  isMobile: boolean;
  onHighlighterClick: () => void;
  onLinkClick: () => void;
}) {
  return (
    <>
      <Spacer />
      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <HeadingDropdownMenu modal={false} levels={[1, 2, 3]} />
        <ListDropdownMenu modal={false} types={["bulletList", "orderedList"]} />
        <BlockquoteButton />
        <TableDropdownMenu modal={false} />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover colors={NEWSLETTER_HIGHLIGHT_COLORS} useColorValue />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <ImageUploadButton text="Image" />
        <ImageRemoveButton text="Remove" />
      </ToolbarGroup>
      <Spacer />
    </>
  );
}

function MobileToolbar({
  type,
  onBack,
}: {
  type: "highlighter" | "link";
  onBack: () => void;
}) {
  return (
    <>
      <ToolbarGroup>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeftIcon className="tiptap-button-icon" />
          {type === "highlighter" ? (
            <HighlighterIcon className="tiptap-button-icon" />
          ) : (
            <LinkIcon className="tiptap-button-icon" />
          )}
        </Button>
      </ToolbarGroup>
      <ToolbarSeparator />
      {type === "highlighter" ? (
        <ColorHighlightPopoverContent colors={NEWSLETTER_HIGHLIGHT_COLORS} useColorValue />
      ) : (
        <LinkContent />
      )}
    </>
  );
}

export function NewsletterEditor({
  editorKey,
  initialContent,
  onChange,
  onUploadImage,
  onDeleteImageAsset,
  disabled = false,
}: NewsletterEditorProps) {
  const isMobile = useIsBreakpoint();
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">("main");
  const toolbarRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onUploadRef = useRef(onUploadImage);
  onUploadRef.current = onUploadImage;
  const onDeleteImageAssetRef = useRef(onDeleteImageAsset);
  onDeleteImageAssetRef.current = onDeleteImageAsset;
  const knownAssetIdsRef = useRef<Set<string>>(new Set());
  const urlToAssetIdRef = useRef<Map<string, string>>(new Map());

  const uploadHandler = useCallback(
    async (file: File, onProgress?: (event: { progress: number }) => void, abortSignal?: AbortSignal) => {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      }
      if (abortSignal?.aborted) throw new Error("Upload cancelled");
      onProgress?.({ progress: 30 });
      const result = await onUploadRef.current(file);
      onProgress?.({ progress: 100 });
      if (typeof result === "string") {
        if (!result) throw new Error("Upload did not return a URL");
        return result;
      }
      if (!result?.url) throw new Error("Upload did not return a URL");
      if (result.assetId != null && String(result.assetId).trim() !== "") {
        urlToAssetIdRef.current.set(result.url, String(result.assetId));
      }
      return result;
    },
    []
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      editable: !disabled,
      content: initialContent,
      editorProps: {
        attributes: {
          autocomplete: "off",
          autocorrect: "off",
          autocapitalize: "off",
          "aria-label": "Newsletter content",
          class: "simple-editor",
        },
      },
      extensions: [
        StarterKit.configure({
          horizontalRule: false,
          heading: { levels: [1, 2, 3, 4] },
          link: {
            openOnClick: false,
            enableClickSelection: true,
          },
        }),
        HorizontalRule,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Highlight.configure({ multicolor: true }),
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
        NewsletterImage.configure({
          resize: {
            enabled: true,
            directions: ["bottom-right", "bottom-left", "top-right", "top-left"],
            minWidth: 80,
            minHeight: 80,
            alwaysPreserveAspectRatio: true,
          },
        }),
        Typography,
        Selection,
        ImageUploadNode.configure({
          accept: "image/*",
          maxSize: MAX_FILE_SIZE,
          limit: 10,
          upload: uploadHandler,
          onError: (error) => console.error("Newsletter image upload failed:", error),
        }),
      ],
      onCreate: ({ editor: ed }) => {
        knownAssetIdsRef.current = new Set(collectImageAssetIds(ed.state.doc, urlToAssetIdRef.current));
      },
      onUpdate: ({ editor: ed }) => {
        const nextIds = collectImageAssetIds(ed.state.doc, urlToAssetIdRef.current);
        const gone = removedAssetIds(knownAssetIdsRef.current, nextIds);
        knownAssetIdsRef.current = new Set(nextIds);
        onChangeRef.current(ed.getHTML());
        gone.forEach((assetId) => {
          void onDeleteImageAssetRef.current?.(assetId);
        });
      },
    },
    [editorKey]
  );

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main");
    }
  }, [isMobile, mobileView]);

  if (!editor || editor.isDestroyed) return null;

  return (
    <div className="newsletter-simple-editor">
      <div className="simple-editor-wrapper">
        <EditorContext.Provider value={{ editor }}>
          <Toolbar ref={toolbarRef}>
            {mobileView === "main" ? (
              <MainToolbar
                isMobile={isMobile}
                onHighlighterClick={() => setMobileView("highlighter")}
                onLinkClick={() => setMobileView("link")}
              />
            ) : (
              <MobileToolbar
                type={mobileView === "highlighter" ? "highlighter" : "link"}
                onBack={() => setMobileView("main")}
              />
            )}
          </Toolbar>
          <EditorContent editor={editor} role="presentation" className="simple-editor-content" />
        </EditorContext.Provider>
      </div>
    </div>
  );
}
