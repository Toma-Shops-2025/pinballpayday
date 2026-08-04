import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { PinballGame } from "@/components/PinballGame";

export const Route = createFileRoute("/game/$tableId")({
  component: GameContainer,
});

function GameContainer() {
  const { tableId } = useParams({ from: "/game/$tableId" });

  return (
    <div className="h-screen w-full flex flex-col bg-slate-950 overflow-hidden">
      <PinballGame tableId={tableId} />
    </div>
  );
}
