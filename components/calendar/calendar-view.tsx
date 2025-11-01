'use client'

import { useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import { toast } from 'sonner'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import type {
  EventClickArg,
  EventDropArg,
  EventChangeArg,
  DateSelectArg,
} from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import type { CalendarEvent } from './types'
import { formatDateForInput, getDefaultEndTime } from './utils'

type CalendarViewProps = {
  events: CalendarEvent[]
  onDateClick: (startTime: string, endTime: string) => void
  onSelect?: (startTime: string, endTime: string) => void
  onEventClick: (event: CalendarEvent) => void
  onEventDrop: (event: CalendarEvent) => Promise<void>
  onEventResize: (event: CalendarEvent) => Promise<void>
  currentUserId: string | null
  initialView?: string
  height?: string | number
  aspectRatio?: number
}

export function CalendarView({
  events,
  onDateClick,
  onSelect,
  onEventClick,
  onEventDrop,
  onEventResize,
  currentUserId,
  initialView = 'timeGridWeek',
  height = 'auto',
  aspectRatio = 1.8,
}: CalendarViewProps) {
  const handleDateClick = useCallback(
    (info: DateClickArg) => {
      const clickedDate = info.date
      const startTime = formatDateForInput(clickedDate)
      const endTime = getDefaultEndTime(clickedDate)
      onDateClick(startTime, endTime)
    },
    [onDateClick]
  )

  const handleSelect = useCallback(
    (info: DateSelectArg) => {
      if (onSelect && info.start && info.end) {
        // Format the selected time range
        const startTime = formatDateForInput(info.start)
        const endTime = formatDateForInput(info.end)
        onSelect(startTime, endTime)
        // Unselect the range to allow clicking again
        info.view.calendar.unselect()
      }
    },
    [onSelect]
  )

  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      const event = events.find((e) => e.id === info.event.id)
      if (event) {
        onEventClick(event)
      }
    },
    [events, onEventClick]
  )

  const handleEventDrop = useCallback(
    async (info: EventDropArg) => {
      const event = events.find((e) => e.id === info.event.id)
      if (!event || !info.event.start || !info.event.end) {
        return
      }

      // Check if current user is the creator
      if (event.userId !== currentUserId) {
        // Revert the event position
        info.revert()
        toast.error('Permission Denied', {
          description: 'You can only move events that you created.',
        })
        return
      }

      try {
        const updatedEvent: CalendarEvent = {
          ...event,
          start: info.event.start.toISOString(),
          end: info.event.end.toISOString(),
        }
        await onEventDrop(updatedEvent)
      } catch (error: any) {
        // Revert the event position on error
        info.revert()
        toast.error('Failed to Update Event', {
          description: error.message || 'Could not move the event. Please try again.',
        })
      }
    },
    [events, onEventDrop, currentUserId]
  )

  const handleEventResize = useCallback(
    async (info: EventChangeArg) => {
      const event = events.find((e) => e.id === info.event.id)
      if (!event || !info.event.start || !info.event.end) {
        return
      }

      // Check if current user is the creator
      if (event.userId !== currentUserId) {
        // Revert the event size
        info.revert()
        toast.error('Permission Denied', {
          description: 'You can only resize events that you created.',
        })
        return
      }

      try {
        const updatedEvent: CalendarEvent = {
          ...event,
          start: info.event.start.toISOString(),
          end: info.event.end.toISOString(),
        }
        await onEventResize(updatedEvent)
      } catch (error: any) {
        // Revert the event size on error
        info.revert()
        toast.error('Failed to Resize Event', {
          description: error.message || 'Could not resize the event. Please try again.',
        })
      }
    },
    [events, onEventResize, currentUserId]
  )

  return (
    <div className="w-full h-full">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView={initialView}
        editable={true}
        selectable={true}
        selectMirror={true}
        eventResizableFromStart={true}
        events={events}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        dateClick={handleDateClick}
        select={handleSelect}
        eventClick={handleEventClick}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
        }}
        height={height}
        aspectRatio={aspectRatio}
      />
    </div>
  )
}

