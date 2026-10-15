// ChatGPT থেকে বিসিএসের পাঠ কপি করলে ক্লিপবোর্ডে অনেক সময় ফরম্যাট করা HTML
// না এসে প্লেইন টেক্সট আসে, যার ভিতরে "# ", "**...**", "- ", "> " ইত্যাদি
// মার্কডাউন চিহ্নগুলো লেখা অবস্থায় থাকে। এই ফাইলটা সেই প্লেইন টেক্সটকে
// আসল HTML (হেডিং/বোল্ড/ইটালিক/স্ট্রাইক/কোড/ব্লককোট/নেস্টেড লিস্ট)-এ
// রূপান্তর করে — editor-এ পেস্ট করার মুহূর্তে ব্যবহারের জন্য
// (components/LessonEditor.js থেকে)।
//
// এটা framework-independent প্লেইন ফাংশন, তাই কোনো React/DOM/browser ছাড়াই
// সরাসরি node দিয়ে regression টেস্ট করা যায় (scripts/test-text-pipeline.mjs)।

// একটা লাইন বুলেট/নম্বর লিস্টের আইটেম কি না, আর থাকলে কতটা ইনডেন্ট করা
// (সাব-লিস্টের গভীরতা বোঝার জন্য) — সেটা বের করে।
export function matchListMarker(line) {
  const bullet = line.match(/^([ \t]*)[-*+][ \t]+(.*)$/);
  if (bullet) {
    return {
      indent: bullet[1].replace(/\t/g, "  ").length,
      ordered: false,
      content: bullet[2],
    };
  }

  const ordered = line.match(/^([ \t]*)\d+\.[ \t]+(.*)$/);
  if (ordered) {
    return {
      indent: ordered[1].replace(/\t/g, "  ").length,
      ordered: true,
      content: ordered[2],
    };
  }

  return null;
}

// একটা লাইনে কমপক্ষে একটা "|" থাকলে সেটা টেবিলের সারি হতে পারে।
function isTableRow(line) {
  return /\|/.test(line) && line.trim().length > 0;
}

// GFM টেবিলের দ্বিতীয় লাইন — "|---|:---:|---|" এর মতো শুধু -, :, | আর
// স্পেস দিয়ে তৈরি সেপারেটর সারি, যেটা দেখে বোঝা যায় আগের লাইনটা হেডার।
function isTableSeparatorRow(line) {
  const trimmed = line.trim();
  return (
    /^\|?[ \t]*:?-{3,}:?[ \t]*(\|[ \t]*:?-{3,}:?[ \t]*)*\|?$/.test(trimmed) &&
    /-/.test(trimmed)
  );
}

function splitTableRow(line) {
  let trimmed = line.trim();
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
  return trimmed.split("|").map((cell) => cell.trim());
}

export function markdownPlainTextToHtml(text) {
  const signalLines = text.split("\n");
  const hasPipeTable = signalLines.some(
    (line, idx) =>
      isTableRow(line) &&
      idx + 1 < signalLines.length &&
      isTableSeparatorRow(signalLines[idx + 1])
  );

  const hasMarkdownSignal =
    /(^|\n)[ \t]{0,3}#{1,3}[ \t]+\S/.test(text) || // # হেডিং
    /\*\*[^*\n]+\*\*/.test(text) || // **বোল্ড**
    /~~[^~\n]+~~/.test(text) || // ~~স্ট্রাইকথ্রু~~
    /`[^`\n]+`/.test(text) || // `ইনলাইন কোড`
    /(^|\n)[ \t]*[-*+][ \t]+\S/.test(text) || // - বা * বুলেট/সাব-লিস্ট
    /(^|\n)[ \t]*\d+\.[ \t]+\S/.test(text) || // ১. ২. নম্বর/সাব-লিস্ট
    /(^|\n)[ \t]{0,3}>[ \t]?\S/.test(text) || // > ব্লককোট
    /(^|\n)```/.test(text) || // ```কোড ব্লক```
    /(?:^|[^*])\*[^*\n]+\*(?!\*)/.test(text) || // *ইটালিক*
    /\b_[^_\n]+_\b/.test(text) || // _ইটালিক_
    hasPipeTable; // | ... | মার্কডাউন টেবিল

  if (!hasMarkdownSignal) return null;

  const escapeHtml = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const inline = (s) => {
    let out = escapeHtml(s);
    out = out.replace(/`([^`\n]+)`/g, "<code>$1</code>");
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/~~([^~]+)~~/g, "<s>$1</s>");
    out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
    out = out.replace(/\b_([^_\n]+)_\b/g, "<em>$1</em>");
    return out;
  };

  // নেস্টেড বুলেট/নম্বর লিস্ট তৈরি করে — ইনডেন্টেশন (লিডিং স্পেস) অনুযায়ী
  // সাব-লিস্ট ধরা হয়, যাতে ChatGPT-র "- মূল পয়েন্ট\n  - সাব পয়েন্ট" মতো
  // গঠন এডিটরেও আসল নেস্টেড লিস্ট হিসেবে বসে, ফ্ল্যাট হয়ে না যায়।
  function buildList(listLines) {
    if (!listLines.length) return "";

    const baseIndent = matchListMarker(listLines[0]).indent;
    const items = [];
    let ordered = null;
    let i = 0;

    while (i < listLines.length) {
      const m = matchListMarker(listLines[i]);
      if (!m || m.indent < baseIndent) break;

      if (m.indent === baseIndent) {
        if (ordered === null) ordered = m.ordered;
        items.push({ content: m.content, childLines: [] });
        i += 1;
      } else {
        items[items.length - 1].childLines.push(listLines[i]);
        i += 1;
      }
    }

    const itemsHtml = items
      .map((item) => {
        const childHtml = item.childLines.length
          ? buildList(item.childLines)
          : "";
        return `<li><p>${inline(item.content.trim())}</p>${childHtml}</li>`;
      })
      .join("");

    const tag = ordered ? "ol" : "ul";
    return `<${tag}>${itemsHtml}</${tag}>`;
  }

  const lines = text.split("\n");
  const htmlParts = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    const headingMatch = line.match(/^[ \t]{0,3}(#{1,3})[ \t]+(.*)$/);
    if (headingMatch) {
      // এডিটরে H1/H2/H3 সাপোর্ট করা আছে (StarterKit-এ levels: [1, 2, 3])
      const level = Math.min(headingMatch[1].length, 3);
      const tag = `h${level}`;
      htmlParts.push(`<${tag}>${inline(headingMatch[2].trim())}</${tag}>`);
      i += 1;
      continue;
    }

    // ``` ... ``` কোড ব্লক — ভিতরের লেখায় বোল্ড/ইটালিক প্রয়োগ হবে না,
    // কোড যেমন আছে হুবহু তেমন থাকবে।
    if (/^[ \t]{0,3}```/.test(line)) {
      const codeLines = [];
      i += 1;
      while (i < lines.length && !/^[ \t]{0,3}```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1; // ক্লোজিং ``` বাদ দেওয়া
      htmlParts.push(
        `<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`
      );
      continue;
    }

    // > ব্লককোট — টানা একাধিক "> " লাইন একসাথে একটা blockquote-এ যাবে।
    if (/^[ \t]{0,3}>[ \t]?/.test(line)) {
      const quoteLines = [];
      while (i < lines.length && /^[ \t]{0,3}>[ \t]?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^[ \t]{0,3}>[ \t]?/, ""));
        i += 1;
      }
      htmlParts.push(
        `<blockquote>${quoteLines
          .map((l) => `<p>${inline(l.trim())}</p>`)
          .join("")}</blockquote>`
      );
      continue;
    }

    // | ... | মার্কডাউন টেবিল — হেডার সারির ঠিক পরে "|---|---|" সেপারেটর
    // থাকলেই এটাকে আসল টেবিল হিসেবে ধরা হয়, টেক্সট হিসেবে না রেখে।
    // এতে editor-এও একটা real, এডিট-করা-যায় এমন টেবিল হিসেবে বসে —
    // আগে এটা শুধু Reader mode-এ (remark-gfm দিয়ে) টেবিল হয়ে দেখাত,
    // editor-এ কাঁচা "| ... |" লেখাই থেকে যেত।
    if (
      isTableRow(line) &&
      i + 1 < lines.length &&
      isTableSeparatorRow(lines[i + 1])
    ) {
      const headerCells = splitTableRow(line)
        .map((cell) => `<th>${inline(cell)}</th>`)
        .join("");
      i += 2; // হেডার + সেপারেটর সারি বাদ

      const bodyRows = [];
      while (
        i < lines.length &&
        isTableRow(lines[i]) &&
        !isTableSeparatorRow(lines[i])
      ) {
        const cells = splitTableRow(lines[i])
          .map((cell) => `<td>${inline(cell)}</td>`)
          .join("");
        bodyRows.push(`<tr>${cells}</tr>`);
        i += 1;
      }

      htmlParts.push(
        `<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows.join(
          ""
        )}</tbody></table>`
      );
      continue;
    }

    if (matchListMarker(line)) {
      const listLines = [];
      while (i < lines.length && matchListMarker(lines[i])) {
        listLines.push(lines[i]);
        i += 1;
      }
      htmlParts.push(buildList(listLines));
      continue;
    }

    if (!line.trim()) {
      i += 1;
      continue;
    }

    htmlParts.push(`<p>${inline(line)}</p>`);
    i += 1;
  }

  return htmlParts.join("");
}
