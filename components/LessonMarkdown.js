"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

/*
 * ChatGPT থেকে কপি করা লেখায় "#", "##", "**", "|" ইত্যাদি Markdown চিহ্ন
 * থাকে। আগে এগুলো raw HTML হিসেবে দেখানো হতো বলে চিহ্নগুলো আক্ষরিকভাবে
 * (literally) দেখা যেত। এই কম্পোনেন্ট সেই টেক্সট আসল Markdown হিসেবে পার্স
 * করে শিরোনাম (#, ##), বোল্ড (**text**), তালিকা, এবং GFM টেবিল
 * (remark-gfm) সঠিকভাবে রেন্ডার করে — dangerouslySetInnerHTML ছাড়াই,
 * শুধু react-markdown-এর নিজস্ব নিরাপদ React element রেন্ডারিং দিয়ে।
 *
 * remark-breaks: পেস্ট করা লেখায় একটা লাইন থেকে আরেকটায় গেলে (একবার Enter)
 * সেটা যেন নতুন লাইন হিসেবেই দেখায় (সাধারণ Markdown-এ একবার Enter করলে
 * লাইন জোড়া লেগে যায়, যেটা আমাদের case-এ অস্বাভাবিক দেখাবে)।
 *
 * এখানে ইচ্ছা করেই কোনো custom styling নেই — আউটপুট h1/h2/p/ul/ol/li/
 * blockquote/table/strong/em ইত্যাদি ট্যাগগুলো ব্যবহার করে, যেগুলো
 * app/globals.css-এর ".lesson-content" ক্লাসে আগে থেকেই স্টাইল করা আছে।
 * তাই আগের মতোই দেখতে/অনুভূত হবে, শুধু Markdown এখন সঠিকভাবে পার্স হবে।
 */
export default function LessonMarkdown({ text }) {
  if (!text || !text.trim()) return null;

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
      {text}
    </ReactMarkdown>
  );
}
