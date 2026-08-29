export default function ClientPlaceholder() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 flex h-16 items-center border-b border-[var(--color-neutral-200)] bg-white px-4">
        <div className="font-bold text-lg">FitSnap Platform</div>
      </header>
      <main className="flex-1 w-full max-w-5xl mx-auto p-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-[var(--color-neutral-200)] max-w-md mx-auto mt-10">
          <h1 className="text-xl font-bold mb-4">Welcome to FitSnap</h1>
          <p className="text-[var(--color-neutral-600)] mb-6">
            We are setting up your account experience. Please contact support if you remain on this page.
          </p>
          <form action={async () => {
            "use server"
            const { cookies } = await import("next/headers")
            ;(await cookies()).delete("session_token")
          }}>
            <button type="submit" className="w-full bg-[var(--color-primary-600)] text-white py-2 rounded-md hover:bg-[var(--color-primary-700)]">
              Log Out
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
