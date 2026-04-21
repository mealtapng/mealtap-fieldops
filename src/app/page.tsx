export default function Home() {
  return (
    <main
      className="flex min-h-screen items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #0D1B0E 0%, #0a2e0c 45%, #0d1f10 100%)' }}
    >
      <div className="text-center">
        <h1 className="font-display font-extrabold" style={{ fontSize: '3rem', color: '#ffffff' }}>
          Power<span style={{ color: '#25D366' }}>Chat</span>
        </h1>
        <p className="mt-2 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Field Ops Portal
        </p>
      </div>
    </main>
  );
}
