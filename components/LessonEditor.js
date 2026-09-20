"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import { useEffect } from "react";

export default function LessonEditor({ content, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),

      Underline,

      Link.configure({
        openOnClick: false,
        autolink: true,
      }),

      Placeholder.configure({
        placeholder: "Start writing your lesson…",
      }),

      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),

      Table.configure({
        resizable: true,
      }),

      TableRow,
      TableHeader,
      TableCell,
    ],

    content: content || "",

    editorProps: {
      attributes: {
        class:
          "lesson-content px-4 py-4 focus:outline-none",
      },

      transformPastedHTML(html) {
        return html;
      },
    },

    onUpdate: ({ editor }) => {
      onChange(
        editor.getHTML(),
        editor.getText()
      );
    },

    immediatelyRender: false,
  });

  useEffect(() => {
    if (
      editor &&
      content != null &&
      editor.getHTML() !== content &&
      editor.isEmpty
    ) {
      editor.commands.setContent(
        content,
        false
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, content]);

  if (!editor) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#111113",
        border: "1px solid #242428",
        boxShadow:
          "0 8px 30px rgba(0, 0, 0, 0.35)",
      }}
    >
      <Toolbar editor={editor} />

      <div
        className="max-h-[65vh] overflow-y-auto"
        style={{
          background: "#111113",
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({ editor }) {
  const btn = (active) =>
    [
      "w-9",
      "h-9",
      "rounded-lg",
      "flex",
      "items-center",
      "justify-center",
      "text-sm",
      "font-medium",
      "shrink-0",
      "transition-colors",
      active
        ? "bg-violet-500 text-white"
        : "bg-[#1B1B20] text-[#D7D7DF] hover:bg-[#25252B]",
    ].join(" ");

  return (
    <div
      className="flex gap-1.5 overflow-x-auto p-2"
      style={{
        borderBottom: "1px solid #29292F",
        background: "#18181C",
      }}
    >
      {/* Bold */}
      <button
        type="button"
        className={btn(
          editor.isActive("bold")
        )}
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleBold()
            .run()
        }
      >
        B
      </button>

      {/* Italic */}
      <button
        type="button"
        className={btn(
          editor.isActive("italic")
        )}
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleItalic()
            .run()
        }
      >
        I
      </button>

      {/* Underline */}
      <button
        type="button"
        className={btn(
          editor.isActive("underline")
        )}
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleUnderline()
            .run()
        }
      >
        U
      </button>

      {/* H1 */}
      <button
        type="button"
        className={btn(
          editor.isActive("heading", {
            level: 1,
          })
        )}
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleHeading({
              level: 1,
            })
            .run()
        }
      >
        H1
      </button>

      {/* H2 */}
      <button
        type="button"
        className={btn(
          editor.isActive("heading", {
            level: 2,
          })
        )}
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleHeading({
              level: 2,
            })
            .run()
        }
      >
        H2
      </button>

      {/* Bullet List */}
      <button
        type="button"
        className={btn(
          editor.isActive("bulletList")
        )}
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleBulletList()
            .run()
        }
      >
        • List
      </button>

      {/* Ordered List */}
      <button
        type="button"
        className={btn(
          editor.isActive("orderedList")
        )}
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleOrderedList()
            .run()
        }
      >
        1. List
      </button>

      {/* Blockquote */}
      <button
        type="button"
        className={btn(
          editor.isActive("blockquote")
        )}
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleBlockquote()
            .run()
        }
      >
        "
      </button>

      {/* Link */}
      <button
        type="button"
        className={btn(false)}
        onClick={() => {
          const url = window.prompt(
            "Link URL"
          );

          if (url) {
            editor
              .chain()
              .focus()
              .setLink({
                href: url,
              })
              .run();
          }
        }}
      >
        🔗
      </button>

      {/* Table */}
      <button
        type="button"
        className={btn(false)}
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({
              rows: 3,
              cols: 3,
              withHeaderRow: true,
            })
            .run()
        }
      >
        ▦
      </button>

      {/* Align Left */}
      <button
        type="button"
        className={btn(
          editor.isActive({
            textAlign: "left",
          })
        )}
        onClick={() =>
          editor
            .chain()
            .focus()
            .setTextAlign("left")
            .run()
        }
      >
        ⯇
      </button>

      {/* Align Center */}
      <button
        type="button"
        className={btn(
          editor.isActive({
            textAlign: "center",
          })
        )}
        onClick={() =>
          editor
            .chain()
            .focus()
            .setTextAlign("center")
            .run()
        }
      >
        ⯀
      </button>

      {/* Align Right */}
      <button
        type="button"
        className={btn(
          editor.isActive({
            textAlign: "right",
          })
        )}
        onClick={() =>
          editor
            .chain()
            .focus()
            .setTextAlign("right")
            .run()
        }
      >
        ⯈
      </button>

      {/* Undo */}
      <button
        type="button"
        className={btn(false)}
        onClick={() =>
          editor
            .chain()
            .focus()
            .undo()
            .run()
        }
      >
        ↺
      </button>

      {/* Redo */}
      <button
        type="button"
        className={btn(false)}
        onClick={() =>
          editor
            .chain()
            .focus()
            .redo()
            .run()
        }
      >
        ↻
      </button>
    </div>
  );
}
