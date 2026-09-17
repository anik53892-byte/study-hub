"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import IntroScreen from "@/components/IntroScreen";

export default function RootPage() {
  const router = useRouter();
  const [showIntro, setShowIntro] = useState(true);
  const [destination, setDestination] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setDestination(data.session ? "/home" : "/login");
    });
  }, []);

  useEffect(() => {
    if (!showIntro && destination) {
      router.replace(destination);
    }
  }, [showIntro, destination, router]);

  return <IntroScreen name="Pollobi" onDone={() => setShowIntro(false)} />;
}
