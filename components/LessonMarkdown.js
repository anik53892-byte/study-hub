
"use client";

import {
  useMemo,
  useEffect,
  useRef,
  useState,
  createElement,
} from "react";
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
    return {
      html,
      tables: [],
    };
  }

  const tables = [];

  try {
    const doc = new DOMParser().parseFromString(html, "text/html");

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
              colSpan: Math.max(
                1,
                Number(cell.getAttribute("colspan")) || 1
              ),
              rowSpan: Math.max(
                1,
                Number(cell.getAttribute("rowspan")) || 1
              ),
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
   REACT TABLE RENDERER
   Table itself does not have a separate scroll container.
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
      {
        className: "lesson-table",
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
    )
  );
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function LessonMarkdown({ html }) {
  const scrollRef = useRef(null);
  const contentRef = useRef(null);
  const [contentWidth, setContentWidth] = useState(null);

  const { markdown, tables } = useMemo(() => {
    if (!html || typeof html !== "string") {
      return { markdown: "", tables: [] };
    }

    try {
      // Step 1: Recover escaped table HTML.
      const recovered = recoverEscapedHtmlTables(html);

      // Step 2: Normalize paragraphs within table cells.
      const flattened = flattenTableCellParagraphs(recovered);

      // Step 3: Extract tables before Markdown conversion.
      const extracted = extractTables(flattened);

      // Step 4: Convert remaining content to Markdown.
      const converted = getTurndownService().turndown(extracted.html);

      return {
        markdown: breakInlineListMarkers(converted),
        tables: extracted.tables,
      };
    } catch {
      return {
        markdown: html.replace(/<[^>]*>/g, " ").trim(),
        tables: [],
      };
    }
  }, [html]);

  /*
   * Measure the natural width of the tables.
   * If a table is wider than the visible Reader area,
   * expand the entire Reader content to that width.
   */
  useEffect(() => {
    const scrollElement = scrollRef.current;
    const contentElement = contentRef.current;

    if (!scrollElement || !contentElement) return;

    let animationFrame = 0;

    const updateContentWidth = () => {
      cancelAnimationFrame(animationFrame);

      animationFrame = requestAnimationFrame(() => {
        const availableWidth = scrollElement.clientWidth;

        const tableWidths = Array.from(
          contentElement.querySelectorAll(".lesson-table")
        ).map((table) => table.getBoundingClientRect().width);

        const widestTable = Math.max(0, ...tableWidths);
        const nextWidth = Math.ceil(
          Math.max(availableWidth, widestTable)
        );

        setContentWidth((previousWidth) =>
          previousWidth === nextWidth ? previousWidth : nextWidth
        );
      });
    };

    updateContentWidth();

    let resizeObserver;

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateContentWidth);

      resizeObserver.observe(scrollElement);

      contentElement
        .querySelectorAll(".lesson-table")
        .forEach((table) => resizeObserver.observe(table));
    } else {
      window.addEventListener("resize", updateContentWidth);
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateContentWidth);
    };
  }, [html, markdown, tables]);

  if (!markdown.trim() && tables.length === 0) {
    return null;
  }

  return createElement(
    "div",
    {
      ref: scrollRef,
      className: "lesson-content-scroll",
      role: "region",
      "aria-label": "পাঠের সম্পূর্ণ কনটেন্ট",
      tabIndex: 0,
    },
    createElement(
      "div",
      {
        ref: contentRef,
        className: "lesson-content",
        style: {
          width: contentWidth ? `${contentWidth}px` : "100%",
          maxWidth: "none",
        },
      },
      createElement(
        ReactMarkdown,
        {
          remarkPlugins: [remarkGfm, remarkBreaks],
          components: {
            p({ children, ...props }) {
              // Replace standalone table placeholders with React tables.
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
          },
        },
        markdown
      )
    )
  );
}
