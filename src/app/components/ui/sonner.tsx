import { Toaster as SonnerToaster } from "sonner";
import type { ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <SonnerToaster
      theme="light"
      className="toaster group"
      {...props}
    />
  );
};

export { Toaster };
