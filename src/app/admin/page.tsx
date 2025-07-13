import { requireAdmin } from '@/lib/auth'
import { Header } from '@/components/Header'
import { AdminDashboard } from './AdminDashboard'

export default async function AdminPage() {
  await requireAdmin()

  return (
    <div className="h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 relative">
        <AdminDashboard />
      </main>
    </div>
  )
} 