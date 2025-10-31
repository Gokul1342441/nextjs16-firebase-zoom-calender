"use client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { doc, setDoc } from "firebase/firestore"
import { signInWithEmailAndPassword } from "firebase/auth"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase/admin/config"

export function LoginCard() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const handleLogin = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log(userCredential);
      // Get tokens
      const idToken = await user.getIdToken(); // access token
      const refreshToken = user.refreshToken;

      // Save to Firestore (e.g., in users collection)
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: user.displayName || "",
        email: user.email,
        accessToken: idToken,
        refreshToken: refreshToken,
        lastLogin: new Date().toISOString(),
      }, { merge: true });

      // Set cookies for tokens
      await fetch('/api/auth/set-cookies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: idToken,
          refreshToken: refreshToken,
        }),
      });

      console.log("User logged in and saved to Firestore ✅");
      
      // Redirect to home after successful login
      router.push('/dashboard');

    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
        <CardAction>
          <Button variant="link"><Link href="/signup">Sign Up</Link></Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
              <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            </div>
          </div>
          {error && <p className="text-red-500">{error}</p>}
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button onClick={(e:any) => handleLogin(e)} type="submit" className="w-full">
          {loading ? 'Logging in...' : 'Login'}
        </Button>
        <Button variant="outline" className="w-full">
          Login with Google
        </Button>
      </CardFooter>
    </Card>
  )
}
