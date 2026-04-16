import { BottomNav } from '@/components/agent/BottomNav'

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-md mx-auto flex flex-col min-h-screen">
        <main className="flex-1 flex items-center justify-center px-4 pb-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-forest mb-2">Messages coming soon</h1>
            <p className="text-sm text-muted-brand">Direct messages with your field lead will appear here.</p>
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
