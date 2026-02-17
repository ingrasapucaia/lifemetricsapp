import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="md:ml-56 pt-12 md:pt-0 min-h-screen">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
