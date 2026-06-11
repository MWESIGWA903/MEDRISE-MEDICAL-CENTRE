import React, { useEffect } from "react";
import { useTheme } from "@/lib/theme";

export function StaffLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "noindex,nofollow");
    return () => {
      meta?.setAttribute("content", "index,follow");
    };
  }, []);

  return (
    <div className={`min-h-screen bg-background text-foreground${theme === "dark" ? " dark" : ""}`}>
      {children}
    </div>
  );
}
