"use client";

import { useMemo, createElement } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import TurndownService from "turndown";
import { gfm as turndownGfm } from "turndown-plugin-gfm";
import {
  breakInlineListMarkers,
  formatAnswerExplanation,
} from "@/lib/answerFormatting";

/* =========================================================
   RECOVER HTML TAGS THAT WERE PASTED AS TEXT
   ========================================================= */

function recoverEscapedHtmlTables(html) {
  if (!html || typeof html !== "string") return html;

  return html.replace(
    /&(?:amp;)*lt;(\/?(?:table|colgroup|col|thead|tbody|tfoot|tr|th|td|p)\b)([\s\S]*?)(?:&(?:amp;)*gt;|>)/gi,
    (_match, tag, attributes) => `<${tag}${attributes}>`
  );
}

/* =========================================================
   FLATTEN PARAGRAPHS INSIDE TABLE CELLS
   ========================================================= */

function flattenTableCellParagraphs(html) {
  if (
    typeof DOMParser === "undefined" ||
    !html ||
    !/<table\b/i.test(html)
  ) {
    return html;
  }

  try {
    const doc = new DOMParser().parseFromString(html, "text/html");

    doc.querySelectorAll("td, th").forEach((cell) => {
      const paragraphs = Array.from(cell.children).filter(
        (child) => child.tagName === "P"
      );

      if (paragraphs.length <= 1) return;

      const merged = paragraphs
        .map((paragraph) => paragraph.innerHTML.trim())
        .filter(Boolean)
        .join(" ");

      cell.innerHTML = "";

      if (merged) {
        const paragraph = doc.createElement("p");
        paragraph.innerHTML = merged;
        cell.appendChild(paragraph);
      }
    });

    return doc.body.innerHTML;
  } catch {
    return html;
  }
}

/* =========================================================
   TABLE DATA EXTRACTION
   ========================================================= */

function extractTables(html) {
  if (typeof DOMParser === "undefined") {
    return { html, tables: [] };
  }

  const tables = [];

  try {
    const doc = new DOMParser().parseFromString(html, "text/html");

    Array.from(doc.querySelectorAll("table")).forEach((table) => {
      const rows = Array.from(table.querySelectorAll("tr")).map(
        (row) =>
          Array.from(row.children)
            .filter(
              (cell) =>
                cell.tagName === "TH" || cell.tagName === "TD"
            )
            .map((cell) => ({
              // টেবিলের সেলগুলো turndown/markdown pipeline-এর বাইরে, সরাসরি
              // DOM থেকে টেক্সট হিসেবে বের করা হয় — তাই এখানে আলাদা করে
              // breakInlineListMarkers() চালাতে হচ্ছে, নাহলে সেলের ভেতরের
              // "ক) ... খ) ... গ)..." এক লাইনেই থেকে যেত।
              text: formatAnswerExplanation(
                breakInlineListMarkers(cell.textContent || "")
              ),
              header: cell.tagName === "TH",
              colSpan: Math.max(
                1,
                Number(cell.getAttribute("colspan")) || 1
              ),
              rowSpan: Math.max(
                1,
                Number(cell.getAttribute("rowspan")) || 1
              ),
            }))
      );

      if (!rows.length) return;

      const tableIndex = tables.length;
      tables.push({ rows });

      const placeholder = doc.createElement("p");
      placeholder.textContent = `LESSONTABLEPLACEHOLDER${tableIndex}`;

      table.replaceWith(placeholder);
    });

    return {
      html: doc.body.innerHTML,
      tables,
    };
  } catch {
    return { html, tables: [] };
  }
}

/* =========================================================
   TURNDOWN CONFIGURATION
   ========================================================= */

let turndownService = null;

function getTurndownService() {
  if (turndownService) return turndownService;

  turndownService = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
  });

  turndownService.use(turndownGfm);

  // Preserve intentionally typed Markdown markers.
  turndownService.escape = (text) => text;

  turndownService.addRule("paragraph", {
    filter: "p",

    replacement(content, node) {
      const parentTag = node.parentNode?.nodeName;

      if (parentTag === "TD" || parentTag === "TH") {
        return content;
      }

      if (/^LESSONTABLEPLACEHOLDER\d+$/.test(content.trim())) {
        return `\n\n${content.trim()}\n\n`;
      }

      // যখন টেবিল আসল <table> element না হয়ে, ChatGPT থেকে সরাসরি
      // Markdown-এর "| ... |" লেখা হিসেবে পেস্ট হয়, তখন সেই পাইপ-লাইনগুলো
      // আর তার ঠিক পরের সাধারণ বাক্যটা — দুটোই আলাদা <p> হিসেবে আসে, আর
      // উপরের নিয়মে দুটোর মাঝে মাত্র ১টা নতুন লাইন থাকে (টেবিলের সারিগুলো
      // একটানা রাখার জন্যই এটা দরকার)। কিন্তু remark-gfm-কে স্পষ্টভাবে
      // বোঝাতে হয় টেবিলটা কোথায় শেষ হচ্ছে, নাহলে পরের সাধারণ বাক্যটাও
      // টেবিলের আরেকটা (ভাঙা) সারি হিসেবে ধরে নেয় — এটাই "লম্বা সারি"
      // সমস্যাটার কারণ। তাই পাইপযুক্ত (টেবিলের মতো) লাইনের ঠিক পরে যদি
      // পাইপবিহীন (সাধারণ) লাইন আসে, তাদের মাঝে একটা ফাঁকা লাইন জোর
      // করে বসানো হচ্ছে, যাতে টেবিলটা ওখানেই স্পষ্টভাবে শেষ হয়।
      const trimmed = content.trim();
      const prevSibling = node.previousElementSibling;
      const prevText =
        prevSibling && prevSibling.nodeName === "P"
          ? prevSibling.textContent
          : "";
      const prevLooksLikeTableRow = /\|/.test(prevText);
      const thisLooksLikeTableRow = /\|/.test(trimmed);

      if (prevLooksLikeTableRow && !thisLooksLikeTableRow) {
        return content ? `\n${content}\n` : "";
      }

      return content ? `${content}\n` : "";
    },
  });

  turndownService.remove(["colgroup", "col"]);

  return turndownService;
}

/* =========================================================
   TABLE CELL INLINE FORMATTING (**বোল্ড** + লাইন-ব্রেক)
   ========================================================= */

function renderInlineCellText(text, keyPrefix) {
  if (typeof text !== "string" || !text) return text;

  // টেবিলের সেল রেন্ডার হয় সরাসরি DOM টেক্সট থেকে (ReactMarkdown/remark-gfm
  // পার্স করে না), তাই formatAnswerExplanation() যে "**...**" বসিয়ে দেয়
  // সেটা এমনিতে প্লেইন টেক্সট হিসেবেই দেখাতো (তারকাচিহ্নসহ)। এখানে
  // "**...**" অংশটুকু <strong> হিসেবে আর "\n" অংশটুকু <br> হিসেবে
  // আলাদা করে রেন্ডার করা হচ্ছে।
  const lines = text.split("\n");

  return lines.flatMap((line, lineIndex) => {
    const parts = line
      .split(/(\*\*[^*]+\*\*)/g)
      .filter((part) => part !== "");

    const nodes = parts.map((part, partIndex) => {
      const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
      if (boldMatch) {
        return createElement(
          "strong",
          { key: `${keyPrefix}-b-${lineIndex}-${partIndex}` },
          boldMatch[1]
        );
      }
      return part;
    });

    if (lineIndex < lines.length - 1) {
      nodes.push(
        createElement("br", { key: `${keyPrefix}-br-${lineIndex}` })
      );
    }

    return nodes;
  });
}

/* =========================================================
   TABLE RENDERER
   ========================================================= */

function renderTable(table, tableIndex) {
  return createElement(
    "div",
    {
      key: `lesson-table-wrapper-${tableIndex}`,
      className: "lesson-table-wrapper",
    },
    createElement(
      "table",
      { className: "lesson-table" },
      createElement(
        "tbody",
        null,
        table.rows.map((row, rowIndex) =>
          createElement(
            "tr",
            { key: `row-${rowIndex}` },
            row.map((cell, cellIndex) => {
              const tag = cell.header ? "th" : "td";

              return createElement(
                tag,
                {
                  key: `cell-${rowIndex}-${cellIndex}`,
                  colSpan: cell.colSpan,
                  rowSpan: cell.rowSpan,
                },
                renderInlineCellText(
                  cell.text,
                  `cell-${rowIndex}-${cellIndex}`
                )
              );
            })
          )
        )
      )
    )
  );
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function LessonMarkdown({ html }) {
  const { markdown, tables } = useMemo(() => {
    if (!html || typeof html !== "string") {
      return { markdown: "", tables: [] };
    }

    try {
      const recovered = recoverEscapedHtmlTables(html);
      const flattened = flattenTableCellParagraphs(recovered);
      const extracted = extractTables(flattened);
      const converted = getTurndownService().turndown(extracted.html);

      return {
        markdown: formatAnswerExplanation(breakInlineListMarkers(converted)),
        tables: extracted.tables,
      };
    } catch (err) {
      // স্বাভাবিক turndown/টেবিল-এক্সট্র্যাকশন পাইপলাইনে কোনো কারণে সমস্যা
      // হলে (যেমন কিছু অপ্রত্যাশিত HTML গঠন), আগে এখানে পুরো ফরম্যাটিং
      // (ভুল/সঠিক বোল্ড+ভাঙা, ক)/খ)/গ) আলাদা লাইনে) বাদ দিয়ে শুধু ট্যাগ
      // মুছে কাঁচা টেক্সট দেখানো হতো — এটাই "এক লাইনে, ফরম্যাট ছাড়া"
      // দেখানোর একটা সম্ভাব্য কারণ। এখন fallback-এও একই ফরম্যাটিং পাস
      // চালানো হচ্ছে, যাতে মূল pipeline ব্যর্থ হলেও ভুল/সঠিক অন্তত
      // বোল্ড+আলাদা লাইনে দেখা যায়।
      if (typeof window !== "undefined" && window.console) {
        console.error("LessonMarkdown: falling back to plain text render", err);
      }
      const stripped = html.replace(/<[^>]*>/g, " ").trim();
      return {
        markdown: formatAnswerExplanation(breakInlineListMarkers(stripped)),
        tables: [],
      };
    }
  }, [html]);

  if (!markdown.trim() && tables.length === 0) {
    return null;
  }

  return createElement(
    "div",
    {
      className: "lesson-content-scroll",
      role: "region",
      "aria-label": "পাঠের সম্পূর্ণ কনটেন্ট",
      tabIndex: 0,
    },
    createElement(
      "div",
      {
        className: "lesson-content",
      },
      createElement(
        ReactMarkdown,
        {
          remarkPlugins: [remarkGfm, remarkBreaks],

          components: {
            p({ children, ...props }) {
              if (typeof children === "string") {
                const match = children.match(
                  /^LESSONTABLEPLACEHOLDER(\d+)$/
                );

                if (match) {
                  const index = Number(match[1]);
                  const table = tables[index];

                  if (table) {
                    return renderTable(table, index);
                  }
                }
              }

              return createElement("p", props, children);
            },

            // কিছু টেবিল আসল HTML <table> হিসেবে না এসে, ChatGPT থেকে
            // সরাসরি Markdown-এর "| ... |" লেখা হিসেবে পেস্ট হয় (কোনো
            // real <table> element থাকে না)। সেগুলো extractTables()-এর
            // হাত এড়িয়ে সরাসরি remark-gfm দিয়ে পার্স হয়ে এখানে আসে —
            // তখন এই "table" component-টা চলে, যেটা একই "lesson-table"
            // ক্লাস আর স্ক্রল-wrapper বসিয়ে দেয়, যাতে HTML থেকে আসা আর
            // Markdown থেকে আসা — দুই ধরনের টেবিলই একই রকম দেখতে লাগে।
            table({ children }) {
              return createElement(
                "div",
                { className: "lesson-table-wrapper" },
                createElement(
                  "table",
                  { className: "lesson-table" },
                  children
                )
              );
            },
          },
        },
        markdown
      )
    )
  );
}
