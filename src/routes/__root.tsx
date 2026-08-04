import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useTheme } from "@/hooks/use-theme";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
});

function RootComponent() {
  useTheme();

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden select-none">
      <Outlet />
      <Toaster position="top-center" richColors theme="dark" />
    </div>
  );
}
