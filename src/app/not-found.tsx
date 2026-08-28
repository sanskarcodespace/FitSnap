import { MarketingLayout } from "@/components/layout/marketing-layout"
import { EmptyState } from "@/components/ui/states"
import { Search } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <MarketingLayout>
      <div className="container mx-auto px-4 py-32 max-w-2xl">
        <EmptyState 
          icon={<Search className="w-8 h-8" />}
          title="Page Not Found"
          description="We couldn't find the page you were looking for. If you followed a link for 'Log In' or 'Sign Up', those features are currently being built."
          action={
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          }
        />
      </div>
    </MarketingLayout>
  )
}
