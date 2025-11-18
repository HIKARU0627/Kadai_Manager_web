import { SignupForm } from "@/components/auth/SignupForm"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export default async function SignupPage() {
  const session = await getServerSession(authOptions)

  // If user is already logged in, redirect to dashboard
  if (session?.user) {
    redirect("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <SignupForm />
    </div>
  )
}
