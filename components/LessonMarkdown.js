"use client";

import { useMemo, createElement } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import TurndownService from "turndown";
import { gfm as turndownGfm } from "turndown-plugin-gfm";

/* =========================================================
   BANGLA LIST MARKERS
   ========================================================= */

function breakInlineListMarkers(text) {
  const bengaliNumberMarker = "[০-৯]{1,3}\\.";
  const bengaliOptionMarker = "[\\u0995-\\u09B9\\u09DC\\u09DD\\u09DF][.)]";

  const markerPattern = new RegExp(
    `(${bengaliNumberMarker}|${bengaliOptionMarker})(?=\\s)`,
    "g"
  );

  return text.replace(markerPattern, (match, _group, offset, full) => {
    const before = full.slice(0, offset);

    if (before === "" || /\n[ \t]*$/.test(before)) {
      return match;
    }

    return "\n" + match;
  });
}

/* =========================================================
   RECOVER HTML TAGS THAT WERE PASTED AS TEXT

   Handles:
   &lt;table>...</table>
   &lt;table&gt;...&lt;/table&gt;
   &amp;lt;table&amp;gt;...&amp;lt;/table&amp;gt;
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

   Extract real HTML tables before converting the remaining
   content to Markdown. This prevents Turndown from flattening
   the HTML tables into ordinary text.
   ========================================================= */

function extractTables(html) {
  if (typeof DOMParser === "undefined") {
    return {
      html,
      tables: [],
    };
  }

  const tables = [];

  try {
    const doc = new DOMParser().parseFromString(html, "text/html");

    // Extract each actual table separately.
    Array.from(doc.querySelectorAll("table")).forEach((table) => {
      const rows = Array.from(table.querySelectorAll("tr")).map(
        (row) => {
          const cells = Array.from(row.children)
            .filter(
              (cell) =>
                cell.tagName === "TH" || cell.tagName === "TD"
            )
            .map((cell) => ({
              text: cell.textContent || "",
              header: cell.tagName === "TH",
              colSpan: Math.max(1, Number(cell.getAttribute("colspan")) || 1),
              rowSpan: Math.max(1, Number(cell.getAttribute("rowspan")) || 1),
            }));

          return cells;
        }
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
    return {
      html,
      tables: [],
    };
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

  // Preserve Markdown markers that were intentionally typed.
  turndownService.escape = (text) => text;

  turndownService.addRule("paragraph", {
    filter: "p",

    replacement(content, node) {
      const parentTag = node.parentNode?.nodeName;

      if (parentTag === "TD" || parentTag === "TH") {
        return content;
      }

      // Keep table placeholders in separate Markdown blocks.
      if (/^LESSONTABLEPLACEHOLDER\d+$/.test(content.trim())) {
        return `\n\n${content.trim()}\n\n`;
      }

      // Keep consecutive pasted lines together.
      return content ? `${content}\n` : "";
    },
  });

  turndownService.remove(["colgroup", "col"]);

  return turndownService;
}

/* =========================================================
   SAFE REACT TABLE RENDERER

   Table content is rendered as React elements.
   No dangerouslySetInnerHTML is used.
   ========================================================= */

function renderTable(table, tableIndex) {
  return createElement(
    "table",
    {
      key: `lesson-table-${tableIndex}`,
    },
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
              cell.text
            );
          })
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
      // Step 1: Recover escaped table HTML.
      const recovered = recoverEscapedHtmlTables(html);

      // Step 2: Normalize paragraphs within table cells.
      const flattened = flattenTableCellParagraphs(recovered);

      // Step 3: Extract actual tables before Markdown conversion.
      const extracted = extractTables(flattened);

      // Step 4: Convert only the remaining content to Markdown.
      const converted = getTurndownService().turndown(extracted.html);

      return {
        markdown: breakInlineListMarkers(converted),
        tables: extracted.tables,
      };
    } catch {
      // Keep a fallback rather than crashing the reader.
      return {
        markdown: html.replace(/<[^>]*>/g, " ").trim(),
        tables: [],
      };
    }
  }, [html]);

  if (!markdown.trim() && tables.length === 0) {
    return null;
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      components={{
        p({ children, ...props }) {
          // Replace standalone table placeholders with real React tables.
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
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}
