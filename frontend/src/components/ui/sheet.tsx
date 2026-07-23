import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

export function SheetContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Dialog.Content>) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[1px]" />
      <Dialog.Content
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col border-l border-slate-200 bg-white shadow-panel",
          className
        )}
        {...props}
      >
        {children}
        <Dialog.Close className="absolute right-4 top-4 rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
          <X className="h-4 w-4" />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export const SheetTitle = Dialog.Title;
export const SheetDescription = Dialog.Description;

