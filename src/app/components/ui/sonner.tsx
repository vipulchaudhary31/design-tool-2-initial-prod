"use client";

import { Toaster as SonnerToaster } from "sonner";
import type { ToasterProps } from "sonner";
import { cn } from "@/app/components/ui/utils";

const Toaster = ({ theme, className, ...props }: ToasterProps) => {
  return (
    <SonnerToaster
      theme={theme}
      className={cn("toaster group", className)}
      {...props}
    />
  );
};

export { Toaster };
