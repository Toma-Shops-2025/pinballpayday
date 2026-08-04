import { createFileRoute } from "@tanstack/react-router";
import { PinballGame } from "@/components/PinballGame";

export const Route = createFileRoute("/")({
  component: () => (
    <div className="h-screen w-full flex flex-col bg-slate-900 overflow-hidden">
      <PinballGame />
    </div>
  ),
});
