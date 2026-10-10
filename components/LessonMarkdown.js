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
 *    এটা editor-এ ঠিকই দেখা যায়, কিন্তু আগে আমরা শুধু plain text
 *    (content_text) থেকে Markdown রেন্ডার করছিলাম, যেখানে bold/italic/
 *    heading-এর আসল চিহ্নই ছিল না (ওগুলো তো কখনো "**" হিসেবে টাইপ হয়নি,
 *    সরাসরি bold হয়েই এসেছিল) — তাই রিডার মোডে সব plain দেখাচ্ছিল।
 *
 * ২) টেক্সট সিলেক্ট করে/অন্য কোনোভাবে কপি করলে শুধু plain text আসে,
 *    যেখানে "#", "**" আক্ষরিক চিহ্ন হিসেবেই থেকে যায়।
 *
 * সমাধান: content_text এর বদলে এখন lesson-এর আসল HTML (content) নিয়ে,
 * সেটাকে turndown দিয়ে Markdown টেক্সটে রূপান্তর করা হচ্ছে। turndown
 * আসল HTML ট্যাগ (h1/strong/em/table) পেলে সেটাকে Markdown চিহ্নে
 * (#, **, |) বদলে দেয়; আর যেখানে এমনিতেই plain text-এ "#", "**" লেখা
 * আছে, সেটা তো এমনিই থেকে যায়। এরপর react-markdown সেই Markdown টেক্সট
 * পড়ে আসল heading/bold/italic/table হিসেবে দেখায় — dangerouslySetInnerHTML
 * ছাড়াই, নিরাপদ React element রেন্ডারিং দিয়ে। এভাবে দুই ধরনের paste-ই
 * (rich copy এবং plain text copy) সঠিকভাবে দেখা যায়।
 */

let turndownService = null;
function getTurndownService() {
  if (!turndownService) {
    turndownService = new TurndownService({
      headingStyle: "atx",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
    });
    turndownService.use(turndownGfm);
  }
  return turndownService;
}

export default function LessonMarkdown({ html }) {
  const markdown = useMemo(() => {
    if (!html || !html.replace(/<[^>]*>/g, "").trim()) return "";
    try {
      return getTurndownService().turndown(html);
    } catch {
      // turndown কোনো কারণে ব্যর্থ হলে অন্তত সাধারণ লেখাটা দেখাই, একদম খালি না রেখে।
      return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    }
  }, [html]);

  if (!markdown.trim()) return null;

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
      {markdown}
    </ReactMarkdown>
  );
}
