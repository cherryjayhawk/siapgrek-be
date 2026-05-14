import Sidebar from "../../components/Sidebar"
import Navbar from "../../components/Navbar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-gray-100 overflow-hidden">
      <div className="flex flex-col h-full p-2 sm:p-3 lg:p-5 gap-2 sm:gap-3 lg:gap-5">
        <Navbar />
        <div className="flex flex-1 gap-2 sm:gap-3 lg:gap-5 overflow-hidden min-h-0">
          <Sidebar />
          <main className="flex-1 bg-white rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 overflow-y-auto min-h-0 pb-20 md:pb-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
