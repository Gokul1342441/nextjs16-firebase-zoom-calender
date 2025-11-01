"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase/config/config"

export interface UserDetails {
  uid: string
  name: string
  email: string
  avatar?: string
  createdAt?: string
  lastLogin?: string
}

export function useUser() {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        try {
          // Fetch user details from Firestore
          const userDocRef = doc(db, "users", firebaseUser.uid)
          const userDocSnap = await getDoc(userDocRef)

          if (userDocSnap.exists()) {
            const data = userDocSnap.data()
            setUserDetails({
              uid: firebaseUser.uid,
              name: data.name || firebaseUser.displayName || "",
              email: data.email || firebaseUser.email || "",
              avatar: data.avatar || firebaseUser.photoURL || undefined,
              createdAt: data.createdAt,
              lastLogin: data.lastLogin,
            })
          } else {
            // If no Firestore doc exists, use Firebase Auth data
            setUserDetails({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || "",
              email: firebaseUser.email || "",
              avatar: firebaseUser.photoURL || undefined,
            })
          }
          setError(null)
        } catch (err: any) {
          console.error("Error fetching user details:", err)
          setError(err.message)
        } finally {
          setLoading(false)
        }
      } else {
        setUser(null)
        setUserDetails(null)
        setLoading(false)
        setError(null)
      }
    })

    return () => unsubscribe()
  }, [])

  return { user, userDetails, loading, error }
}

