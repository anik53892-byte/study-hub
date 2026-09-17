"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import IntroScreen from "@/components/IntroScreen";

export default function RootPage() {
  const router = useRouter();
  const [showIntro, setShowIntro] = useState(true);

  return (
    <IntroScreen
      name="Pollobi"
      onDone={() => {
        setShowIntro(false);
        router.replace("/home");
      }}
    />
  );
}
