"use client";

import ProtectedRoute from "@/components/ProtectedRoutes";
import DashboardSidebar from "@/components/SideBar";
import MobileBottomBar from "@/components/MobilebottomBar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-zinc-950 text-white">

        <DashboardSidebar />

        <main className="flex flex-1 flex-col overflow-hidden">

          <div className="flex-1 overflow-y-auto pb-24 md:pb-0">
            {children}
          </div>
          <MobileBottomBar />
        </main>
      </div>
    </ProtectedRoute>
  );
}