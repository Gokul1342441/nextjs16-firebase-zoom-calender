"use client"

import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config/config"

/**
 * Hook to fetch a user's name by their userId
 */
export function useUserName(userId: string | null) {
  const [userName, setUserName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) {
      setUserName(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const fetchUserName = async () => {
      try {
        const userDocRef = doc(db, "users", userId)
        const userDocSnap = await getDoc(userDocRef)

        if (userDocSnap.exists()) {
          const data = userDocSnap.data()
          setUserName(data.name || "Unknown User")
        } else {
          setUserName("Unknown User")
        }
      } catch (err) {
        console.error("Error fetching user name:", err)
        setUserName("Unknown User")
      } finally {
        setLoading(false)
      }
    }

    fetchUserName()
  }, [userId])

  return { userName, loading }
}

