"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Image as ImageIcon,
  Delete,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  onDelete?: () => void;
  showDelete?: boolean;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  const buttons = [
    {
      icon: Italic,
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
    },
    {
      icon: Bold,
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
    },
    { icon: Underline, action: () => {}, isActive: false }, // Placeholder for actual underline ext if needed
    {
      icon: Strikethrough,
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive("strike"),
    },
    { icon: LinkIcon, action: () => {}, isActive: false },
    { icon: AlignLeft, action: () => {}, isActive: false },
    { icon: AlignCenter, action: () => {}, isActive: false },
    { icon: AlignRight, action: () => {}, isActive: false },
    { icon: AlignJustify, action: () => {}, isActive: false },
    {
      icon: ListOrdered,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList"),
    },
    {
      icon: List,
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
    },
    { icon: ImageIcon, action: () => {}, isActive: false },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50/50 p-2 rounded-t-lg">
      {buttons.map((btn, index) => {
        const Icon = btn.icon;
        return (
          <button
            key={index}
            onClick={(e) => {
              e.preventDefault();
              btn.action();
            }}
            className={cn(
              "p-1.5 rounded hover:bg-gray-200 text-gray-500 transition-colors",
              btn.isActive && "bg-gray-200 text-gray-900",
            )}
            type="button"
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
};

export const RichTextEditor = ({
  value,
  onChange,
  placeholder = "Type here",
  error,
  onDelete,
  showDelete = true,
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[120px] p-4 text-sm",
      },
    },
  });

  // Keep content synced if updated externally (like when changing selected question)
  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="w-full flex flex-col gap-1.5 relative group">
      <div
        className={cn(
          "rounded-lg border border-gray-300 bg-white shadow-sm overflow-hidden",
          error && "border-red-500 ring-1 ring-red-500",
        )}
      >
        <MenuBar editor={editor} />
        <div className="relative">
          <EditorContent editor={editor} />
          {showDelete && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Delete className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      {error && <span className="text-sm text-red-500">{error}</span>}
      <style jsx global>{`
        .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror p {
          margin-top: 0;
          margin-bottom: 0.5em;
        }
      `}</style>
    </div>
  );
};
