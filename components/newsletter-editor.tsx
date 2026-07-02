"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
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

import "@/components/tiptap-templates/simple/simple-editor.scss";
import "./newsletter-editor.scss";

const NEWSLETTER_HIGHLIGHT_COLORS = pickHighlightColorsByValue([
  "var(--tt-color-highlight-yellow)",
  "var(--tt-color-highlight-green)",
  "var(--tt-color-highlight-blue)",
  "var(--tt-color-highlight-purple)",
  "var(--tt-color-highlight-red)",
]);

export interface NewsletterEditorProps {
  editorKey: string;
  initialContent: string;
  onChange: (html: string) => void;
  onUploadImage: (file: File) => Promise<string>;
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
  disabled = false,
}: NewsletterEditorProps) {
  const isMobile = useIsBreakpoint();
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">("main");
  const toolbarRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onUploadRef = useRef(onUploadImage);
  onUploadRef.current = onUploadImage;

  const uploadHandler = useCallback(
    async (file: File, onProgress?: (event: { progress: number }) => void, abortSignal?: AbortSignal) => {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      }
      if (abortSignal?.aborted) throw new Error("Upload cancelled");
      onProgress?.({ progress: 30 });
      const url = await onUploadRef.current(file);
      onProgress?.({ progress: 100 });
      if (!url) throw new Error("Upload did not return a URL");
      return url;
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
        Image.configure({
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
      onUpdate: ({ editor: ed }) => {
        onChangeRef.current(ed.getHTML());
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
