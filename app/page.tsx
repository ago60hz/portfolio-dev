import { Sidebar } from "@/components/sidebar/Sidebar";
import { SidebarDrawer } from "@/components/sidebar/SidebarDrawer";
import { KitchenWindow } from "@/components/kitchen/KitchenWindow";

export default function Home() {
  return (
    <main className="flex h-dvh w-full gap-2 bg-kitchen-purple p-2">
      {/* Desktop: fixed-width rail. Below md it collapses into a drawer. */}
      <aside className="hidden w-[clamp(272px,24.7vw,380px)] shrink-0 md:block">
        <Sidebar />
      </aside>

      <div className="relative min-w-0 flex-1">
        <KitchenWindow />
        <div className="absolute bottom-4 left-4 z-30 md:hidden">
          <SidebarDrawer />
        </div>
      </div>
    </main>
  );
}
