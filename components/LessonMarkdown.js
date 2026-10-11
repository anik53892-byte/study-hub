"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import TurndownService from "turndown";
import { gfm as turndownGfm } from "turndown-plugin-gfm";

/*
 * সমস্যাটা দুই রকম হতে পারে, আর দুটোই এখানে একসাথে সামলানো হচ্ছে:
 *
 * ১) ChatGPT-এর "Copy" বাটনে চাপ দিয়ে কপি করলে, সেটা rich (HTML)
 *    ফরম্যাট নিয়ে আসে — Tiptap তখন আসল <h1>, <strong>, <table> বানায়।
 *    এটা editor-এ ঠিকই দেখা যায়, কিন্তু শুধু plain text (content_text)
 *    থেকে Markdown রেন্ডার করলে bold/italic/heading-এর আসল চিহ্নই
 *    থাকে না (ওগুলো তো কখনো "**" হিসেবে টাইপ হয়নি, সরাসরি bold হয়েই
 *    এসেছিল) — তাই রিডার মোডে সব plain দেখাতো।
 *
 * ২) টেক্সট সিলেক্ট করে/অন্য কোনোভাবে কপি করলে শুধু plain text আসে,
 *    যেখানে "#", "**" আক্ষরিক চিহ্ন হিসেবেই থেকে যায়।
 *
 * সমাধান: lesson-এর আসল HTML (content) নিয়ে, সেটাকে turndown দিয়ে
 * Markdown টেক্সটে রূপান্তর করা হয়। turndown আসল HTML ট্যাগ
 * (h1/strong/em/table) পেলে সেটাকে Markdown চিহ্নে (#, **, |) বদলে
 * দেয়; আর যেখানে এমনিতেই plain text-এ "#", "**" লেখা আছে, সেটা তো
 * এমনিই থেকে যায়। এরপর react-markdown সেই Markdown টেক্সট পড়ে আসল
 * heading/bold/italic/table হিসেবে দেখায় — dangerouslySetInnerHTML
 * ছাড়াই, নিরাপদ React element রেন্ডারিং দিয়ে। এভাবে দুই ধরনের
 * paste-ই (rich copy এবং plain text copy) সঠিকভাবে দেখা যায়।
 *
 * lesson.content (Supabase-এ যা সংরক্ষিত আছে) এখানে একদমই বদলানো হয়
 * না — শুধু *দেখানোর* সময় Markdown-এ রূপান্তর করা হয়, তাই পুরনো
 * lesson-গুলোও ঠিকভাবে দেখা যাবে, কোনো migration লাগবে না।
 */

// বাংলা সংখ্যা (১. ২. ৩. ...) ও বাংলা অক্ষরভিত্তিক MCQ অপশন (ক) খ) গ) ...)
// Markdown-এর নিজস্ব কোনো নিয়মে লিস্ট হিসেবে ধরা পড়ে না — Markdown শুধু
// ইংরেজি সংখ্যা (1. 2. 3.)-কে list marker হিসেবে চেনে। এছাড়া অনেক সময়
// পুরো লেখাটা (১ থেকে ১২ পর্যন্ত) মূল উৎসেই একটামাত্র প্যারাগ্রাফ/লাইনে
// জোড়া লাগানো থাকে। এই ফাংশন সেই মার্কারগুলো খুঁজে বের করে প্রতিটার
// ঠিক আগে একটা নতুন লাইন বসিয়ে দেয়, যাতে প্রতিটা আইটেম নিজের লাইনে
// আলাদাভাবে দেখায়। দশমিক সংখ্যা (যেমন "৩৭.৫ ডিগ্রি") ভুলভাবে ভেঙে না
// যায় তাই শুধু তখনই মার্কার ধরা হয় যখন বিন্দু/বন্ধনীর ঠিক পরে স্পেস আছে
// (দশমিকে বিন্দুর পরপরই আরেকটা অঙ্ক থাকে, স্পেস থাকে না)।
function breakInlineListMarkers(text) {
  const bengaliNumberMarker = "[০-৯]{1,3}\\.";
  // MCQ অপশন কখনো বন্ধনী দিয়ে লেখা হয় (ক), খ)), কখনো বিন্দু দিয়ে (ক., খ.) —
  // দুটোই ধরা হচ্ছে।
  const bengaliOptionMarker = "[\\u0995-\\u09B9\\u09DC\\u09DD\\u09DF][.)]";
  const markerPattern = new RegExp(
    `(${bengaliNumberMarker}|${bengaliOptionMarker})(?=\\s)`,
    "g"
  );

  return text.replace(markerPattern, (match, _g, offset, full) => {
    const before = full.slice(0, offset);
    // শুরুতে বা আগে থেকেই নতুন লাইনে থাকলে আর নতুন করে ভাঙার দরকার নেই।
    if (before === "" || /\n[ \t]*$/.test(before)) return match;
    return "\n" + match;
  });
}

// কখনো কখনো ChatGPT থেকে টেবিল কপি করার সময় আসল (রেন্ডার করা) টেবিলের
// বদলে তার HTML সোর্স কোডটাই (<table>...</table>) প্লেইন টেক্সট হিসেবে
// পেস্ট হয়ে যায়। তখন Tiptap সেটাকে প্রতি লাইনে একটা করে আলাদা <p>-তে
// সাধারণ টেক্সট হিসেবে রেখে দেয় (আসল <table> element হিসেবে না), আর
// পর্দায়ও সেটা হুবহু ট্যাগ আকারেই ("<table...>", "<colgroup>"...) দেখা
// যায় — editor-এও আর reader mode-এও। এই ফাংশন সেই প্যাটার্নটা (একটা
// প্যারাগ্রাফ "<table" দিয়ে শুরু, পরের কয়েকটা প্যারাগ্রাফ মিলিয়ে
// "</table>" দিয়ে শেষ) খুঁজে বের করে, পুরো টেক্সটটুকু আবার আসল HTML
// হিসেবে পার্স করে একটা সত্যিকারের <table> element দিয়ে বদলে দেয় —
// যাতে তারপর স্বাভাবিক টেবিলের মতোই রেন্ডার হয়। কিছু না মিললে মূল
// HTML-টা অপরিবর্তিত থেকে যায়, কোনো ঝুঁকি নেই।
function recoverEscapedHtmlTables(html) {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html;
  }
  if (!html || !/&lt;table[\s>]/i.test(html)) return html;

  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const nodes = Array.from(doc.body.childNodes);

    let i = 0;
    while (i < nodes.length) {
      const node = nodes[i];
      const text = node.nodeType === 1 ? node.textContent : "";

      if (node.nodeType === 1 && /^\s*<table[\s>]/i.test(text)) {
        let combined = "";
        let endIndex = -1;

        for (let j = i; j < nodes.length && j < i + 500; j++) {
          if (nodes[j].nodeType !== 1) break;
          combined += nodes[j].textContent;
          if (/<\/table\s*>/i.test(combined)) {
            endIndex = j;
            break;
          }
        }

        if (endIndex !== -1) {
          const tableDoc = new DOMParser().parseFromString(combined, "text/html");
          const table = tableDoc.querySelector("table");
          if (table) {
            const imported = doc.importNode(table, true);
            node.parentNode.insertBefore(imported, node);
            for (let k = i; k <= endIndex; k++) {
              if (nodes[k] && nodes[k].parentNode) {
                nodes[k].parentNode.removeChild(nodes[k]);
              }
            }
            i = endIndex + 1;
            continue;
          }
        }
      }

      i++;
    }

    return doc.body.innerHTML;
  } catch {
    return html;
  }
}

// Tiptap-এর Table এক্সটেনশনে প্রতিটা সেল (<td>/<th>)-এর ভেতরের টেক্সট
// সবসময় একটা <p>-তে মোড়ানো থাকে, আর কেউ সেলের ভেতর Enter চাপলে একাধিক
// <p>-ও তৈরি হতে পারে। একটা Markdown টেবিলের সেল কখনোই একাধিক লাইনে
// থাকতে পারে না — তাই turndown-এ পাঠানোর *আগেই*, প্রতিটা সেলের সব
// <p>-কে একটা স্পেস দিয়ে জোড়া লাগিয়ে একটামাত্র প্যারাগ্রাফ বানিয়ে
// নেওয়া হচ্ছে। এতে সেলের ভেতর কোনো লুকানো নতুন-লাইন থাকেই না, ফলে
// table সবসময় ঠিক গঠন নিয়ে বের হয় — turndown/turndown-plugin-gfm
// সেলের ভেতরের নতুন-লাইন ঠিক কীভাবে সামলায় তার ওপর নির্ভর করতে হয় না।
function flattenTableCellParagraphs(html) {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html;
  }
  if (!html || html.indexOf("<table") === -1) return html;

  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("td, th").forEach((cell) => {
      const paragraphs = cell.querySelectorAll(":scope > p");
      if (paragraphs.length <= 1) return;

      const merged = Array.from(paragraphs)
        .map((p) => p.innerHTML.trim())
        .filter(Boolean)
        .join(" ");

      cell.innerHTML = "";
      const p = doc.createElement("p");
      p.innerHTML = merged;
      cell.appendChild(p);
    });
    return doc.body.innerHTML;
  } catch {
    // ব্যর্থ হলে মূল HTML-টাই পাঠিয়ে দেওয়া হোক, অন্তত কিছু একটা দেখাবে।
    return html;
  }
}

let turndownService = null;
function getTurndownService() {
  if (!turndownService) {
    turndownService = new TurndownService({
      headingStyle: "atx",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
    });
    turndownService.use(turndownGfm);

    // turndown ডিফল্টভাবে "#", "**", "_" ইত্যাদি চিহ্ন plain text-এ পেলে
    // সেগুলোর আগে "\" বসিয়ে escape করে দেয় (যেমন "### কথা" → "\### কথা"),
    // যাতে সাধারণ ডকুমেন্টে ভুলবশত এগুলো Markdown হিসেবে পার্স না হয়।
    // কিন্তু আমাদের দরকার ঠিক উল্টোটা — ChatGPT থেকে পেস্ট করা plain
    // টেক্সটে থাকা "#"/"**" আসলে intentional Markdown, ওগুলো escape না
    // হয়ে বরং আসল heading/bold হিসেবেই পার্স হওয়া দরকার। তাই escaping
    // পুরোপুরি বন্ধ করে দেওয়া হলো।
    turndownService.escape = (str) => str;

    // Tiptap প্রতিটা পেস্ট করা লাইনকে (যেমন একটা Markdown টেবিলের প্রতিটা
    // সারি) আলাদা <p> হিসেবে রাখে। turndown-এর ডিফল্ট নিয়মে প্রতিটা <p>-র
    // চারপাশে ফাঁকা লাইন (blank line) বসে — এতে পরপর লাইনগুলো একে
    // অপরের থেকে ফাঁকা লাইনে আলাদা হয়ে যায়, আর Markdown টেবিল চেনার জন্য
    // (header → delimiter → সারি) সবগুলো লাইন *একটানা* (ফাঁকা লাইন ছাড়া)
    // পরপর থাকা জরুরি — নাহলে remark-gfm সেটাকে টেবিল হিসেবে চেনে না।
    //
    // আর টেবিলের ভেতরের <p> (সেলের লেখা) আগেই flattenTableCellParagraphs()
    // দিয়ে একটামাত্র <p>-তে মিলিয়ে ফেলা হয়েছে, তাই সেখানে এই নিয়মে আলাদা
    // করে কিছু করার দরকার নেই — turndown-plugin-gfm নিজেই সেই একটামাত্র
    // <p>-র লেখা ধরে সেলটা বানাবে।
    turndownService.addRule("paragraph", {
      filter: "p",
      replacement: function (content, node) {
        const parentTag = node.parentNode && node.parentNode.nodeName;
        if (parentTag === "TD" || parentTag === "TH") {
          return content;
        }
        // ২টা newline না রেখে ১টা রাখা হচ্ছে, ফলে পরপর পেস্ট করা লাইনগুলো
        // Markdown-এ একটানাই থেকে যায় (টেবিল ঠিকভাবে চেনা যায়), আর
        // remarkBreaks প্লাগিন (নিচে ReactMarkdown-এ ব্যবহার করা হয়েছে)
        // প্রতিটা একক নতুন লাইনকেও আলাদা লাইন হিসেবেই দেখায় (<br>), তাই
        // সাধারণ লেখার লাইন-বিন্যাসও আগের মতোই দেখতে লাগে।
        return content ? content + "\n" : "";
      },
    });

    // Tiptap-এর টেবিলে কলামের width রাখার জন্য অদৃশ্য <colgroup>/<col>
    // ট্যাগ থাকে — এগুলো Markdown-এ কোনো কাজেই লাগে না, বাদ দেওয়া হলো।
    turndownService.remove(["colgroup", "col"]);
  }
  return turndownService;
}

export default function LessonMarkdown({ html }) {
  const markdown = useMemo(() => {
    if (!html || !html.replace(/<[^>]*>/g, "").trim()) return "";
    let md;
    try {
      const recovered = recoverEscapedHtmlTables(html);
      const flattened = flattenTableCellParagraphs(recovered);
      md = getTurndownService().turndown(flattened);
    } catch {
      // turndown কোনো কারণে ব্যর্থ হলে অন্তত সাধারণ লেখাটা দেখাই, একদম খালি না রেখে।
      md = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    }
    return breakInlineListMarkers(md);
  }, [html]);

  if (!markdown.trim()) return null;

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
      {markdown}
    </ReactMarkdown>
  );
}
