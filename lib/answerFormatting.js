// Reader-এ (components/LessonMarkdown.js) টেক্সট-লেভেলে প্রয়োগ হওয়া দুটো
// সহায়ক রূপান্তর — framework/DOM-independent, তাই plain node দিয়ে সরাসরি
// regression টেস্ট করা যায় (scripts/test-text-pipeline.mjs)।

/* =========================================================
   INLINE NUMBERED/LETTERED LISTS
   ========================================================= */

// সংখ্যাভিত্তিক মার্কার (১. ২. ৩. / 1. 2. 3.) আর বাংলা অক্ষরভিত্তিক MCQ
// অপশন মার্কার (ক) খ) গ) / ক. খ. গ.) — একই লাইনে পরপর একাধিকবার থাকলে
// প্রতিটাকে আলাদা লাইনে ভেঙে দেয়, নাহলে টেবিল/প্যারাগ্রাফের ভেতরে
// "ক) ... খ) ... গ)..." এক লাইনেই থেকে যায়।
export function breakInlineListMarkers(text) {
  if (typeof text !== "string" || !text) return text;

  const markerPattern = /(?:[০-৯]{1,3}|[0-9]{1,3}|[ক-হড়ঢ়য়])[.)][ \t]+/g;

  return text
    .split("\n")
    .map((line) => {
      const matches = Array.from(line.matchAll(markerPattern)).filter(
        (match) => match.index === 0 || /[ \t]/.test(line[match.index - 1])
      );

      // একটিমাত্র নম্বর থাকলে অনুচ্ছেদ ভাঙবে না।
      if (matches.length < 2) return line;

      const prefix = line.slice(0, matches[0].index).trimEnd();

      const items = matches.map((match, index) => {
        const next = matches[index + 1];
        const end = next ? next.index : line.length;
        return line.slice(match.index, end).trim();
      });

      return prefix ? `${prefix}\n\n${items.join("\n")}` : items.join("\n");
    })
    .join("\n");
}

/* =========================================================
   "উত্তর: ... ব্যাখ্যা: ..." / "ভুল: ... সঠিক: ..." —
   গুরুত্বপূর্ণ অংশ বোল্ড + আলাদা লাইনে
   ========================================================= */

// boldFirst ঠিক করে দেয় কোন অংশটা (গুরুত্বপূর্ণ/সঠিক তথ্যটা) বোল্ড হবে —
// উত্তর/ব্যাখ্যার ক্ষেত্রে "উত্তর" অংশ, ভুল/সঠিকের ক্ষেত্রে "সঠিক" অংশ।
export const LABELED_PAIR_PATTERNS = [
  { first: "প্রশ্ন", second: "উত্তর", boldFirst: false },
  { first: "উত্তর", second: "ব্যাখ্যা", boldFirst: true },
  { first: "ভুল", second: "সঠিক", boldFirst: false },
];

// মোবাইল কিবোর্ড/ChatGPT থেকে বাংলা লেখা কপি করলে মাঝে মাঝে চোখে অদৃশ্য
// ZWJ/ZWNJ ক্যারেক্টার ঢুকে থাকে — তাই লেবেলের প্রতিটা অক্ষরের মাঝে সেগুলো
// ঐচ্ছিকভাবে থাকতে পারে ধরে নিয়েই প্যাটার্ন বানানো হচ্ছে।
export function flexibleLabelPattern(label) {
  return label
    .split("")
    .map((ch) => ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[\\u200B\\u200C\\u200D]*");
}

export function formatAnswerExplanation(text) {
  if (typeof text !== "string" || !text) return text;

  const boldPart = (part) => {
    const trimmed = part.trim();
    if (!trimmed) return trimmed;
    if (/^\*\*[^*]+\*\*$/.test(trimmed)) return trimmed; // আগে থেকেই বোল্ড
    return `**${trimmed}**`;
  };

  return text
    .split("\n")
    .map((line) => {
      // বুলেট ("- "/"* ") বা নম্বর ("1. ") লিস্ট-মার্কার থাকলে সেটা
      // আলাদা করে রাখা হচ্ছে, যাতে ভাঙার পরও লিস্ট আইটেমটা ভেঙে না যায়।
      const prefixMatch = line.match(/^(\s*(?:[-*+]|\d+\.)\s+)/);
      const prefix = prefixMatch ? prefixMatch[1] : "";
      const rest = prefix ? line.slice(prefix.length) : line;

      for (const { first, second, boldFirst } of LABELED_PAIR_PATTERNS) {
        const firstLabel = flexibleLabelPattern(first);
        const secondLabel = flexibleLabelPattern(second);
        const pattern = new RegExp(
          `^(\\s*${firstLabel}\\s*[:ঃ][^]*?)(\\s*${secondLabel}\\s*[:ঃ].*)$`
        );
        const inlineMatch = rest.match(pattern);

        if (inlineMatch) {
          const firstPart = inlineMatch[1].trim();
          const secondPart = inlineMatch[2].trim();

          if (firstPart && secondPart) {
            const formattedFirst = boldFirst ? boldPart(firstPart) : firstPart;
            const formattedSecond = boldFirst
              ? secondPart
              : boldPart(secondPart);

            return `${prefix}${formattedFirst}\n${formattedSecond}`;
          }
        }
      }

      // জোড়া ছাড়া একা থাকা লাইনেও গুরুত্বপূর্ণ অংশটা বোল্ড করে দেওয়া হচ্ছে।
      for (const { first, second, boldFirst } of LABELED_PAIR_PATTERNS) {
        const standaloneLabel = flexibleLabelPattern(
          boldFirst ? first : second
        );
        const otherLabel = flexibleLabelPattern(boldFirst ? second : first);
        const standalonePattern = new RegExp(`^\\s*${standaloneLabel}\\s*[:ঃ]`);
        const otherPattern = new RegExp(`${otherLabel}\\s*[:ঃ]`);

        if (standalonePattern.test(rest) && !otherPattern.test(rest)) {
          return `${prefix}${boldPart(rest)}`;
        }
      }

      return line;
    })
    .join("\n");
}
