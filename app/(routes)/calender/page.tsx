'use client'

import { useState, useCallback } from 'react'
import { CalendarView, EventDialog } from '@/components/calendar'
import type { CalendarEvent, EventFormData } from '@/components/calendar'

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Team Meeting',
      start: '2025-11-01T10:00:00',
      end: '2025-11-01T11:00:00',
    },
    {
      id: '2',
      title: 'Doctor Appointment',
      start: '2025-11-02T09:00:00',
      end: '2025-11-02T09:30:00',
    },
    {
      id: '3',
      title: 'Zoom Client Call',
      start: '2025-11-04T15:00:00',
      end: '2025-11-04T15:30:00',
    },
  ])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [initialFormData, setInitialFormData] = useState<EventFormData | null>(null)

  const handleDateClick = useCallback((startTime: string, endTime: string) => {
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
      if (selectedEvent) {
        // Update existing event
        setEvents((prev) =>
          prev.map((ev) => (ev.id === event.id ? event : ev))
        )
      } else {
        // Create new event
        setEvents((prev) => [...prev, event])
      }
    },
    [selectedEvent]
  )

  const handleEventDelete = useCallback((eventId: string) => {
    setEvents((prev) => prev.filter((ev) => ev.id !== eventId))
    setSelectedEvent(null)
  }, [])

  const handleEventDrop = useCallback((event: CalendarEvent) => {
    setEvents((prev) => prev.map((ev) => (ev.id === event.id ? event : ev)))
  }, [])

  const handleEventResize = useCallback((event: CalendarEvent) => {
    setEvents((prev) => prev.map((ev) => (ev.id === event.id ? event : ev)))
  }, [])

  return (
    <div className="w-full h-full p-6">
      <CalendarView
        events={events}
        onDateClick={handleDateClick}
        onEventClick={handleEventClick}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
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
        onSave={handleEventSave}
        onDelete={handleEventDelete}
      />
    </div>
  )
}
