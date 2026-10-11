"use client";

import { useEffect } from "react";

/*
 * App-টা PWA হওয়ায় একটা service worker পুরনো JS/CSS ফাইল ক্যাশ করে রাখে
 * (অফলাইনেও যেন কাজ করে, সেজন্য)। এর ফলে GitHub-এ নতুন fix কমিট করে
 * Vercel-এ deploy হয়ে যাওয়ার পরও, ফোনে আগে থেকে ইনস্টল করা app-টা
 * মাঝে মাঝে এখনও পুরনো, ক্যাশ করা কোড দিয়ে চলতে থাকে — বিশেষ করে
 * নেটওয়ার্ক স্লো থাকলে। এটাই এতদিনের অনেক "fix দিলাম তবু কাজ করে না"
 * সমস্যার আসল কারণ হতে পারে — কোড ভুল না, পুরনো কোড-ই দেখাচ্ছিল।
 *
 * এই কম্পোনেন্টটা নতুন একটা service worker activate (চালু) হলেই পেজটা
 * নিজে থেকে একবার রিলোড করে দেয়, যাতে সবসময় নতুন কোডই ব্যবহার হয় —
 * ম্যানুয়ালি app বন্ধ করে আবার খোলার, বা cache মোছার দরকার না পড়ে।
 */
export default function SWUpdateReload() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let reloaded = false;
    function onControllerChange() {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    }

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
