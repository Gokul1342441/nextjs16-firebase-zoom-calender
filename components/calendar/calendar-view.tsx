'use client'

import { useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import type {
  EventClickArg,
  EventDropArg,
  EventChangeArg,
} from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import type { CalendarEvent } from './types'
import { formatDateForInput, getDefaultEndTime } from './utils'

type CalendarViewProps = {
  events: CalendarEvent[]
  onDateClick: (startTime: string, endTime: string) => void
  onEventClick: (event: CalendarEvent) => void
  onEventDrop: (event: CalendarEvent) => void
  onEventResize: (event: CalendarEvent) => void
  initialView?: string
  height?: string | number
  aspectRatio?: number
}

export function CalendarView({
  events,
  onDateClick,
  onEventClick,
  onEventDrop,
  onEventResize,
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
    (info: EventDropArg) => {
      const event = events.find((e) => e.id === info.event.id)
      if (event && info.event.start && info.event.end) {
        const updatedEvent: CalendarEvent = {
          ...event,
          start: info.event.start.toISOString(),
          end: info.event.end.toISOString(),
        }
        onEventDrop(updatedEvent)
      }
    },
    [events, onEventDrop]
  )

  const handleEventResize = useCallback(
    (info: EventChangeArg) => {
      const event = events.find((e) => e.id === info.event.id)
      if (event && info.event.start && info.event.end) {
        const updatedEvent: CalendarEvent = {
          ...event,
          start: info.event.start.toISOString(),
          end: info.event.end.toISOString(),
        }
        onEventResize(updatedEvent)
      }
    },
    [events, onEventResize]
  )

  return (
    <div className="w-full h-full">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView={initialView}
        editable={true}
        selectable={true}
        eventResizableFromStart={true}
        events={events}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        dateClick={handleDateClick}
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

