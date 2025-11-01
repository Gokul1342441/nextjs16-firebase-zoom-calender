export type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string
  allDay?: boolean
  backgroundColor?: string
  borderColor?: string
  textColor?: string
}

export type EventFormData = {
  title: string
  startTime: string
  endTime: string
}

export type EventFormErrors = {
  title?: string
  startTime?: string
  endTime?: string
}

export type CalendarViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listMonth'

