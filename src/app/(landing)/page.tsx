import { HydrateClient } from "@/trpc/server";
import CurrentDateTime from "./current-datetime";
import { LandingPage } from "./landing";

export default async function Home() {
  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col bg-white">
        <header className="flex h-16 items-center justify-between border-b px-6">
          <div className="flex items-center gap-2">
            <div className="text-xl font-medium">Meerkat</div>
          </div>
          <div className="flex items-center gap-4">
            <CurrentDateTime />
            <div className="flex items-center gap-2">
              <button className="rounded-full p-2 hover:bg-gray-100">
                <span className="i-lucide-help-circle h-5 w-5 text-gray-600" />
              </button>
              <button className="rounded-full p-2 hover:bg-gray-100">
                <span className="i-lucide-settings h-5 w-5 text-gray-600" />
              </button>
              <button className="rounded-full p-2 hover:bg-gray-100">
                <span className="i-lucide-menu h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </header>
        <div className="flex flex-1 items-center px-48">
          <LandingPage />
        </div>
      </main>
    </HydrateClient>
  );
}
