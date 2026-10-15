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
import { DOMParser as ProseMirrorDOMParser } from "@tiptap/pm/model";
import { markdownPlainTextToHtml } from "@/lib/pasteFormatting";
import {
  breakInlineListMarkers,
  formatAnswerExplanation,
} from "@/lib/answerFormatting";
import { useEffect, useRef } from "react";

// কখনো কখনো ChatGPT থেকে টেবিল কপি করলে আসল (রেন্ডার করা) টেবিলের বদলে
// তার HTML সোর্স কোডটাই (<table>...</table>) প্লেইন টেক্সট হিসেবে
// ক্লিপবোর্ডে চলে আসে। স্বাভাবিকভাবে পেস্ট হলে এটা পেজে হুবহু ট্যাগ
// আকারেই দেখা যায়। এই ফাংশন পেস্ট হওয়ার মুহূর্তেই সেই প্যাটার্নটা ধরে,
// আর পাওয়া গেলে সেটাকে আসল টেবিলে রূপান্তর করে বসিয়ে দেয় — Tiptap-এর
// নিজস্ব schema-bound HTML পার্সার (ProseMirrorDOMParser) দিয়ে, যা দিয়ে
// এমনিতেও সব পেস্ট করা HTML পার্স হয়; dangerouslySetInnerHTML কোথাও
// ব্যবহার হচ্ছে না। টেবিলের আগে/পরে অন্য কোনো লেখা থাকলে সেটা সাধারণ
// প্যারাগ্রাফ (প্লেইন টেক্সট) হিসেবেই থেকে যায়।
function handleTableSourcePaste(view, event) {
  if (typeof window === "undefined" || !event.clipboardData) return false;

  const text = event.clipboardData.getData("text/plain");
  if (!text) return false;

  const tableMatch = /<table[\s>][\s\S]*?<\/table>/i.exec(text);
  if (!tableMatch) return false;

  const before = text.slice(0, tableMatch.index).trim();
  const after = text
    .slice(tableMatch.index + tableMatch[0].length)
    .trim();

  const container = document.createElement("div");

  const addPlainLines = (chunk) => {
    chunk.split(/\n+/).forEach((line) => {
      if (!line.trim()) return;
      const p = document.createElement("p");
      p.textContent = line;
      container.appendChild(p);
    });
  };

  if (before) addPlainLines(before);

  const tableHost = document.createElement("div");
  tableHost.innerHTML = tableMatch[0];
  const tableEl = tableHost.querySelector("table");
  if (!tableEl) return false; // ভাঙা/অসম্পূর্ণ HTML — স্বাভাবিক পেস্টেই ছেড়ে দেওয়া হোক
  container.appendChild(tableEl);

  if (after) addPlainLines(after);

  try {
    const slice = ProseMirrorDOMParser.fromSchema(view.state.schema).parseSlice(
      container,
      { preserveWhitespace: true }
    );
    view.dispatch(view.state.tr.replaceSelection(slice).scrollIntoView());
  } catch {
    return false;
  }

  event.preventDefault();
  return true;
}

// ChatGPT থেকে লেখা কপি করলে অনেক সময় ক্লিপবোর্ডে আসল ফরম্যাট করা HTML না
// এসে শুধু প্লেইন টেক্সট আসে, যার মধ্যে "# ", "**...**", "- " এর মতো
// মার্কডাউন চিহ্নগুলো সরাসরি লেখা অবস্থায় থাকে। সেই টেক্সট পেস্ট করলে
// এডিটরে ওই চিহ্নগুলোই হুবহু দেখা যায় (হেডিং/বোল্ড/লিস্ট হিসেবে রেন্ডার
// হয় না) — কিন্তু "Done" চাপার পর রিডার পেজ যখন HTML থেকে markdown বানিয়ে
// আবার render করে, তখন ওই একই চিহ্নগুলো ঠিকভাবে হেডিং/বোল্ড/লিস্ট হিসেবে
// দেখায়। ফলে এডিটর আর রিডারে দুই রকম দেখা যেত। এই ফাংশন-দুটো পেস্ট হওয়ার
// মুহূর্তেই চিহ্নগুলো ধরে, সত্যিকারের হেডিং/বোল্ড/লিস্ট element বানিয়ে
// বসিয়ে দেয় — যাতে এডিটরেও ঠিক একই রকম ফরম্যাট করা অবস্থায় দেখা যায়।

function htmlLooksAlreadyFormatted(htmlData) {
  if (!htmlData || !htmlData.trim()) return false;
  if (typeof DOMParser === "undefined") return true; // নিশ্চিত না হলে, স্বাভাবিক পেস্টেই ছেড়ে দেওয়া নিরাপদ

  try {
    const doc = new DOMParser().parseFromString(htmlData, "text/html");
    return !!doc.querySelector(
      "h1, h2, h3, h4, h5, h6, strong, b, em, i, ul, ol, table"
    );
  } catch {
    return true;
  }
}

function handleMarkdownTextPaste(view, event) {
  if (typeof window === "undefined" || !event.clipboardData) return false;

  const htmlData = event.clipboardData.getData("text/html");
  if (htmlLooksAlreadyFormatted(htmlData)) return false; // আগে থেকেই ফরম্যাট করা — স্বাভাবিক পেস্টই যথেষ্ট

  const text = event.clipboardData.getData("text/plain");
  if (!text) return false;

  // Reader mode-এ (components/LessonMarkdown.js) "ক) খ) গ)" আর
  // "উত্তর/ব্যাখ্যা", "ভুল/সঠিক"-এর মতো প্যাটার্ন স্বয়ংক্রিয়ভাবে আলাদা
  // লাইনে ভেঙে বোল্ড হয়ে যায়। Editor আর Reader-এ একই কাঠামো দেখানোর
  // জন্য, পেস্ট করার সময়েই এখানে একই রূপান্তর চালানো হচ্ছে — যাতে Done
  // চাপার আগে-পরে ফরম্যাট না বদলায়।
  const preformatted = formatAnswerExplanation(breakInlineListMarkers(text));

  const html = markdownPlainTextToHtml(preformatted);
  if (!html) return false;

  const container = document.createElement("div");
  container.innerHTML = html;

  try {
    const slice = ProseMirrorDOMParser.fromSchema(view.state.schema).parseSlice(
      container,
      { preserveWhitespace: true }
    );
    view.dispatch(view.state.tr.replaceSelection(slice).scrollIntoView());
  } catch {
    return false;
  }

  event.preventDefault();
  return true;
}

export default function LessonEditor({ content, onChange }) {
  // Tracks the content we last pushed INTO the editor (either on load, or a
  // moment ago when this exact prop arrived). Used to tell "the parent gave us
  // a different lesson's text" apart from "the user is typing and onUpdate
  // echoed back through the content prop" — those must be handled differently,
  // or switching lessons/folders without a full remount can leave stale text
  // from the previous one sitting in the editor.
  const lastSyncedRef = useRef(content ?? "");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
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

      handlePaste(view, event) {
        if (handleTableSourcePaste(view, event)) return true;
        return handleMarkdownTextPaste(view, event);
      },
    },

    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastSyncedRef.current = html;
      onChange(html, editor.getText());
    },

    immediatelyRender: false,
  });

  // Whenever the `content` prop changes to something we didn't just write
  // ourselves (i.e. a different lesson/folder was loaded, not our own typing
  // echoing back), replace the editor's content — regardless of whether the
  // editor currently looks "empty". This is what prevents one lesson's text
  // from lingering when you switch to another without the component remounting.
  useEffect(() => {
    if (!editor) return;
    const next = content ?? "";
    if (next !== lastSyncedRef.current) {
      lastSyncedRef.current = next;
      editor.commands.setContent(next, false);
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

      {/* H3 */}
      <button
        type="button"
        className={btn(
          editor.isActive("heading", {
            level: 3,
          })
        )}
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleHeading({
              level: 3,
            })
            .run()
        }
      >
        H3
      </button>

      {/* Strikethrough — StarterKit-এ এক্সটেনশনটা এমনিতেই আছে, শুধু বাটন ছিল না */}
      <button
        type="button"
        className={btn(editor.isActive("strike"))}
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleStrike()
            .run()
        }
      >
        <span style={{ textDecoration: "line-through" }}>S</span>
      </button>

      {/* Inline code — StarterKit-এ এক্সটেনশনটা এমনিতেই আছে, শুধু বাটন ছিল না */}
      <button
        type="button"
        className={btn(editor.isActive("code"))}
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleCode()
            .run()
        }
      >
        {"</>"}
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
          
