import { Button } from "@/components/ui/button" 
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center p-6 md:p-10">
      <h1 className="text-2xl">404 - Not Found</h1>
      <p className="text-sm text-muted-foreground">The page you are looking for does not exist.</p>
      <Button asChild className="mt-4">
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  )
}