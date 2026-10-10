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
  const bengaliOptionMarker =
    "[\\u0995-\\u09B9\\u09DC\\u09DD\\u09DF][.)]";
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
    // চারপাশে ফাঁকা লাইন (blank line) বসে — এতে টেবিলের সারিগুলো একে
    // অপরের থেকে ফাঁকা লাইনে আলাদা হয়ে যায়, আর Markdown টেবিল চেনার জন্য
    // (header → delimiter → সারি) সবগুলো লাইন *একটানা* (ফাঁকা লাইন ছাড়া)
    // পরপর থাকা জরুরি — নাহলে remark-gfm সেটাকে টেবিল হিসেবে চেনে না,
    // "| --- | --- |" লাইনটা উল্টো plain লেখা হিসেবে দেখিয়ে দেয় (এটাই
    // এতক্ষণের সমস্যা)।
    //
    // তাই এখানে <p> থেকে শুধু ১টা নতুন লাইন (\n) রাখা হচ্ছে, ২টা না —
    // ফলে পরপর পেস্ট করা লাইনগুলো Markdown-এ একটানাই থেকে যায় (টেবিল
    // ঠিকভাবে চেনা যায়), আর remarkBreaks প্লাগিন (নিচে ReactMarkdown-এ
    // ব্যবহার করা হয়েছে) প্রতিটা একক নতুন লাইনকেও আলাদা লাইন হিসেবেই
    // দেখায় (<br>), তাই সাধারণ লেখার লাইন-বিন্যাসও আগের মতোই দেখতে লাগে।
    // (heading/list/blockquote/table — এগুলোর নিজস্ব আলাদা নিয়ম আছে,
    // এই পরিবর্তন শুধু সাধারণ <p> প্যারাগ্রাফের জন্য প্রযোজ্য।)
    turndownService.addRule("paragraph", {
      filter: "p",
      replacement: function (content) {
        return content ? content + "\n" : "";
      },
    });
  }
  return turndownService;
}

export default function LessonMarkdown({ html }) {
  const markdown = useMemo(() => {
    if (!html || !html.replace(/<[^>]*>/g, "").trim()) return "";
    let md;
    try {
      md = getTurndownService().turndown(html);
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
