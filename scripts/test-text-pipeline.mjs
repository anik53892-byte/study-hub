// ChatGPT থেকে পেস্ট করা টেক্সটের ফরম্যাটিং ঠিকভাবে কাজ করছে কিনা — তার
// জন্য একটা হালকা, কোনো npm package ছাড়াই চলা regression টেস্ট।
//
// চালানোর নিয়ম (কম্পিউটারে, প্রজেক্ট ফোল্ডারের ভেতর থেকে):
//   node scripts/test-text-pipeline.mjs
//
// এটা শুধু lib/pasteFormatting.js আর lib/answerFormatting.js-এর ভিতরের
// বিশুদ্ধ (DOM/React ছাড়া) ফাংশনগুলো টেস্ট করে — পুরো অ্যাপ (Tiptap
// এডিটর, Supabase, ব্রাউজার) এখানে চালানো যায় না, তার জন্য আসল অ্যাপে
// গিয়েই পেস্ট করে পরীক্ষা করতে হবে। এই স্ক্রিপ্টটা শুধু টেক্সট-রূপান্তরের
// নিয়মগুলো (regex/লজিক) ভবিষ্যতে কেউ ভেঙে ফেললে সেটা ধরিয়ে দেওয়ার জন্য।

import { markdownPlainTextToHtml } from "../lib/pasteFormatting.js";
import {
  breakInlineListMarkers,
  formatAnswerExplanation,
} from "../lib/answerFormatting.js";

let pass = 0;
let fail = 0;

function check(name, actual, expected) {
  const ok =
    typeof expected === "function" ? expected(actual) : actual === expected;
  if (ok) {
    pass += 1;
    console.log(`✔ ${name}`);
  } else {
    fail += 1;
    console.log(`✘ ${name}`);
    console.log(`  input →  ${JSON.stringify(actual)}`);
    if (typeof expected !== "function") {
      console.log(`  expect → ${JSON.stringify(expected)}`);
    }
  }
}

console.log("=== markdownPlainTextToHtml (editor paste-time conversion) ===\n");

check(
  "heading #",
  markdownPlainTextToHtml("# বড় শিরোনাম"),
  "<h1>বড় শিরোনাম</h1>"
);

check(
  "heading ## এবং ###",
  markdownPlainTextToHtml("## উপশিরোনাম\n### সাব-উপশিরোনাম"),
  "<h2>উপশিরোনাম</h2><h3>সাব-উপশিরোনাম</h3>"
);

check(
  "bold **text**",
  markdownPlainTextToHtml("এটা **গুরুত্বপূর্ণ** কথা।"),
  "<p>এটা <strong>গুরুত্বপূর্ণ</strong> কথা।</p>"
);

check(
  "italic *text*",
  markdownPlainTextToHtml("এটা *জোর দেওয়া* কথা।"),
  "<p>এটা <em>জোর দেওয়া</em> কথা।</p>"
);

check(
  "strikethrough ~~text~~",
  markdownPlainTextToHtml("এটা ~~ভুল~~ বাতিল।"),
  "<p>এটা <s>ভুল</s> বাতিল।</p>"
);

check(
  "inline code `text`",
  markdownPlainTextToHtml("এখানে `code` আছে।"),
  "<p>এখানে <code>code</code> আছে।</p>"
);

check(
  "fenced code block",
  markdownPlainTextToHtml("```\nline one\nline two\n```"),
  "<pre><code>line one\nline two</code></pre>"
);

check(
  "blockquote >",
  markdownPlainTextToHtml("> উক্তিটা এখানে।"),
  "<blockquote><p>উক্তিটা এখানে।</p></blockquote>"
);

check(
  "flat bullet list",
  markdownPlainTextToHtml("- প্রথম\n- দ্বিতীয়"),
  "<ul><li><p>প্রথম</p></li><li><p>দ্বিতীয়</p></li></ul>"
);

check(
  "nested bullet list",
  markdownPlainTextToHtml("- মূল\n  - সাব১\n  - সাব২\n- পরের মূল"),
  (html) =>
    html.includes("<li><p>মূল</p><ul><li><p>সাব১</p></li><li><p>সাব২</p></li></ul></li>") &&
    html.includes("<li><p>পরের মূল</p></li>")
);

check(
  "numbered list",
  markdownPlainTextToHtml("1. প্রথম\n2. দ্বিতীয়"),
  "<ol><li><p>প্রথম</p></li><li><p>দ্বিতীয়</p></li></ol>"
);

check(
  "checklist markers pass through as list text (GFM renders the checkbox on the reader side)",
  markdownPlainTextToHtml("- [ ] কাজ ১\n- [x] কাজ ২"),
  "<ul><li><p>[ ] কাজ ১</p></li><li><p>[x] কাজ ২</p></li></ul>"
);

check(
  "plain prose with no markdown signal returns null (left to normal paste)",
  markdownPlainTextToHtml("এটা শুধুই সাধারণ একটা লাইন।"),
  null
);

check(
  "markdown pipe table becomes a real <table> (not left as raw '| ... |' text)",
  markdownPlainTextToHtml(
    ["| নাম | মান |", "|---|---|", "| ক | ১ |", "| খ | ২ |"].join("\n")
  ),
  "<table><thead><tr><th>নাম</th><th>মান</th></tr></thead><tbody>" +
    "<tr><td>ক</td><td>১</td></tr><tr><td>খ</td><td>২</td></tr></tbody></table>"
);

check(
  "text before/after a pasted pipe table survives alongside the table",
  markdownPlainTextToHtml(
    ["ভূমিকা", "| A | B |", "|---|---|", "| ১ | ২ |", "শেষ কথা"].join("\n")
  ),
  (html) =>
    html.startsWith("<p>ভূমিকা</p><table>") &&
    html.endsWith("</table><p>শেষ কথা</p>") &&
    html.includes("<td>১</td><td>২</td>")
);

console.log("\n=== breakInlineListMarkers (ক) খ) গ) একই লাইনে থাকলে ভাঙা) ===\n");

check(
  "Bengali lettered MCQ options split onto separate lines",
  breakInlineListMarkers("ক) প্রথম খ) দ্বিতীয় গ) তৃতীয়"),
  "ক) প্রথম\nখ) দ্বিতীয়\nগ) তৃতীয়"
);

check(
  "single marker left untouched",
  breakInlineListMarkers("ক) একটাই অপশন"),
  "ক) একটাই অপশন"
);

console.log("\n=== formatAnswerExplanation (উত্তর/ব্যাখ্যা, ভুল/সঠিক) ===\n");

check(
  "উত্তর/ব্যাখ্যা splits and bolds উত্তর",
  formatAnswerExplanation("উত্তর: খ) গণের নাম। ব্যাখ্যা: প্রথম অংশ গণের নাম।"),
  "**উত্তর: খ) গণের নাম।**\nব্যাখ্যা: প্রথম অংশ গণের নাম।"
);

check(
  "ভুল/সঠিক splits and bolds সঠিক (not ভুল)",
  formatAnswerExplanation(
    "ভুল: ভাইরাস একটি পূর্ণাঙ্গ কোষ। সঠিক: ভাইরাস কোষবিহীন সংক্রামক সত্তা।"
  ),
  "ভুল: ভাইরাস একটি পূর্ণাঙ্গ কোষ।\n**সঠিক: ভাইরাস কোষবিহীন সংক্রামক সত্তা।**"
);

check(
  "ভুল/সঠিক inside a bullet list item keeps the '- ' marker and doesn't break the list",
  formatAnswerExplanation(
    "- ভুল: সব ব্যাকটেরিয়া রোগ সৃষ্টি করে। সঠিক: অনেক ব্যাকটেরিয়া উপকারী বা নিরীহ।"
  ),
  "- ভুল: সব ব্যাকটেরিয়া রোগ সৃষ্টি করে।\n**সঠিক: অনেক ব্যাকটেরিয়া উপকারী বা নিরীহ।**"
);

check(
  "multiple ভুল/সঠিক bullet lines each split independently",
  formatAnswerExplanation(
    [
      "- ভুল: ক। সঠিক: খ।",
      "- ভুল: গ। সঠিক: ঘ।",
    ].join("\n")
  ),
  ["- ভুল: ক।", "**সঠিক: খ।**", "- ভুল: গ।", "**সঠিক: ঘ।**"].join("\n")
);

check(
  "প্রশ্ন/উত্তর splits and bolds উত্তর (not প্রশ্ন)",
  formatAnswerExplanation(
    "প্রশ্ন: বাংলাদেশের রাজধানী কোনটি? উত্তর: ঢাকা।"
  ),
  "প্রশ্ন: বাংলাদেশের রাজধানী কোনটি?\n**উত্তর: ঢাকা।**"
);

console.log(
  "\n=== editor paste pipeline: formatAnswerExplanation + markdownPlainTextToHtml composed ==="
);

check(
  "ভুল/সঠিক pasted directly into the editor now also gets bolded (not just in Reader mode)",
  markdownPlainTextToHtml(
    formatAnswerExplanation(
      breakInlineListMarkers(
        "- ভুল: ভাইরাস একটি পূর্ণাঙ্গ কোষ। সঠিক: ভাইরাস কোষবিহীন সংক্রামক সত্তা।"
      )
    )
  ),
  (html) =>
    html.includes("<li><p>ভুল: ভাইরাস একটি পূর্ণাঙ্গ কোষ।</p></li>") &&
    html.includes("<strong>সঠিক: ভাইরাস কোষবিহীন সংক্রামক সত্তা।</strong>")
);

console.log(`\n${pass} passed, ${fail} failed.`);
if (fail > 0) process.exit(1);
