'use client'

import { useState, useCallback } from 'react'
import { CalendarView, EventDialog } from '@/components/calendar'
import type { CalendarEvent, EventFormData } from '@/components/calendar'
import { useCalendarEvents } from '@/hooks/use-calendar-events'
import { useUser } from '@/hooks/use-user'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'


export default function CalendarPage() {
  const { user, loading: userLoading } = useUser()
  const {
    events,
    loading: eventsLoading,
    saveEvent,
    deleteEvent,
  } = useCalendarEvents(user?.uid || null)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [initialFormData, setInitialFormData] = useState<EventFormData | null>(null)

  const handleDateClick = useCallback((startTime: string, endTime: string) => {
    setSelectedEvent(null)
    setInitialFormData({ title: '', startTime, endTime })
    setIsDialogOpen(true)
  }, [])

  const handleTimeRangeSelect = useCallback((startTime: string, endTime: string) => {
    setSelectedEvent(null)
    setInitialFormData({ title: '', startTime, endTime })
    setIsDialogOpen(true)
  }, [])

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsDialogOpen(true)
  }, [])

  const handleEventSave = useCallback(
    async (event: CalendarEvent) => {
      try {
        await saveEvent(event)
        setIsDialogOpen(false)
        setSelectedEvent(null)
        setInitialFormData(null)
      } catch (error) {
        console.error('Error saving event:', error)
        // Error is handled by the hook, but you could show a toast here
      }
    },
    [saveEvent]
  )

  const handleEventDelete = useCallback(
    async (eventId: string) => {
      const event = events.find((e) => e.id === eventId)
      if (!event) return

      try {
        await deleteEvent(eventId, event.userId)
        setSelectedEvent(null)
      } catch (error) {
        console.error('Error deleting event:', error)
        // Error is handled by the hook, but you could show a toast here
      }
    },
    [events, deleteEvent]
  )

  const handleEventDrop = useCallback(
    async (event: CalendarEvent) => {
      try {
        await saveEvent(event)
      } catch (error: any) {
        toast.error('Failed to Drop Event', {
          description: error.message || 'Could not drop the event. Please try again.',
        })
      }
    },
    [saveEvent]
  )

  const handleEventResize = useCallback(
    async (event: CalendarEvent) => {
      try {
        await saveEvent(event)
      } catch (error: any) {
        toast.error('Failed to Resize Event', {
          description: error.message || 'Could not resize the event. Please try again.',
        })
      }
    },
    [saveEvent]
  )

  // Show loading state
  if (userLoading || eventsLoading) {
    return (
      <div className="w-full h-full p-6 flex items-center justify-center">
        <div className="text-center flex flex-col items-center justify-center">
          <Spinner className="w-7 h-7 items-center justify-center mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading calendar...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="w-full h-full p-6">
      <CalendarView
        events={events}
        onDateClick={handleDateClick}
        onSelect={handleTimeRangeSelect}
        onEventClick={handleEventClick}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        currentUserId={user?.uid || null}
      />

      <EventDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setSelectedEvent(null)
            setInitialFormData(null)
          }
        }}
        event={selectedEvent}
        initialFormData={initialFormData || undefined}
        userId={user?.uid || 'unknown'}
        onSave={handleEventSave}
        onDelete={handleEventDelete}
      />
    </div>
  )
}
