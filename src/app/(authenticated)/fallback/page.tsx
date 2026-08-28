import { ClientLayout } from "@/components/layout/client-layout"

export default function ClientPlaceholder() {
  return (
    <ClientLayout header={<div className="font-bold text-lg">Fallback</div>} bottomNav={<div />}>
      <div className="container mx-auto px-4 py-20 max-w-2xl text-center space-y-4">
        <h1 className="text-[var(--text-h2-size)] font-bold">Fallback Placeholder</h1>
        <p className="text-[var(--color-neutral-600)]">
          This is an internal fallback page. You should not normally be routed here.
        </p>
      </div>
    </ClientLayout>
  )
}
