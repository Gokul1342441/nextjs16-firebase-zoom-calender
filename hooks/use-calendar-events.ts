"use client"

import { useState, useEffect, useCallback } from "react"
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config/config"
import type { CalendarEvent } from "@/components/calendar"

export function useCalendarEvents(userId: string | null) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch events from Firestore
  useEffect(() => {
    // Only fetch if user is authenticated (required by Firestore rules)
    if (!userId) {
      setEvents([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Query all events (shared calendar) - all authenticated users can see all events
    // Note: Firestore rules require authentication, so userId must be provided
    const eventsQuery = query(
      collection(db, "calendarEvents")
    )

    const unsubscribe = onSnapshot(
      eventsQuery,
      (snapshot) => {
        const eventsData: CalendarEvent[] = []
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data()
          // Convert Firestore Timestamps to ISO strings
          eventsData.push({
            id: docSnapshot.id,
            title: data.title,
            start: data.start instanceof Timestamp 
              ? data.start.toDate().toISOString() 
              : data.start,
            end: data.end instanceof Timestamp 
              ? data.end.toDate().toISOString() 
              : data.end,
            allDay: data.allDay || false,
            backgroundColor: data.backgroundColor,
            borderColor: data.borderColor,
            textColor: data.textColor,
            userId: data.userId,
            createdAt: data.createdAt instanceof Timestamp 
              ? data.createdAt.toDate().toISOString() 
              : data.createdAt,
            updatedAt: data.updatedAt instanceof Timestamp 
              ? data.updatedAt.toDate().toISOString() 
              : data.updatedAt,
          })
        })
        // Sort events by start time in memory (no index needed)
        eventsData.sort((a, b) => {
          return new Date(a.start).getTime() - new Date(b.start).getTime()
        })
        setEvents(eventsData)
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching calendar events:", err)
        setError(err.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [userId])

  // Create a new event
  const createEvent = useCallback(
    async (event: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">) => {
      if (!userId) {
        throw new Error("User must be authenticated to create events")
      }

      try {
        const now = Timestamp.now()
        const eventData: Record<string, any> = {
          title: event.title,
          userId,
          createdAt: now,
          updatedAt: now,
          start: Timestamp.fromDate(new Date(event.start)),
          end: Timestamp.fromDate(new Date(event.end)),
          allDay: event.allDay || false,
        }

        // Only include optional fields if they are defined
        if (event.backgroundColor !== undefined) {
          eventData.backgroundColor = event.backgroundColor
        }
        if (event.borderColor !== undefined) {
          eventData.borderColor = event.borderColor
        }
        if (event.textColor !== undefined) {
          eventData.textColor = event.textColor
        }

        await addDoc(collection(db, "calendarEvents"), eventData)
      } catch (err: any) {
        console.error("Error creating event:", err)
        throw err
      }
    },
    [userId]
  )

  // Update an existing event
  const updateEvent = useCallback(
    async (event: CalendarEvent) => {
      if (!userId) {
        throw new Error("User must be authenticated to update events")
      }

      if (event.userId !== userId) {
        throw new Error("User can only update their own events")
      }

      try {
        const eventRef = doc(db, "calendarEvents", event.id)
        const updateData: Record<string, any> = {
          title: event.title,
          start: Timestamp.fromDate(new Date(event.start)),
          end: Timestamp.fromDate(new Date(event.end)),
          allDay: event.allDay || false,
          updatedAt: Timestamp.now(),
        }

        // Only include optional fields if they are defined
        if (event.backgroundColor !== undefined) {
          updateData.backgroundColor = event.backgroundColor
        }
        if (event.borderColor !== undefined) {
          updateData.borderColor = event.borderColor
        }
        if (event.textColor !== undefined) {
          updateData.textColor = event.textColor
        }

        await updateDoc(eventRef, updateData)
      } catch (err: any) {
        console.error("Error updating event:", err)
        throw err
      }
    },
    [userId]
  )

  // Delete an event
  const deleteEvent = useCallback(
    async (eventId: string, eventUserId: string) => {
      if (!userId) {
        throw new Error("User must be authenticated to delete events")
      }

      if (eventUserId !== userId) {
        throw new Error("User can only delete their own events")
      }

      try {
        await deleteDoc(doc(db, "calendarEvents", eventId))
      } catch (err: any) {
        console.error("Error deleting event:", err)
        throw err
      }
    },
    [userId]
  )

  // Save or update event (convenience method)
  const saveEvent = useCallback(
    async (event: CalendarEvent) => {
      if (event.id && events.some((e) => e.id === event.id)) {
        // Event exists, update it
        await updateEvent(event)
      } else {
        // New event, create it
        const { id, createdAt, updatedAt, ...eventData } = event
        await createEvent(eventData)
      }
    },
    [events, createEvent, updateEvent]
  )

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    saveEvent,
  }
}

