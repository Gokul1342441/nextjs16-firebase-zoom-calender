import type { CalendarEvent, EventFormData } from './types'

/**
 * Formats a date to ISO string for datetime-local input
 * Uses local timezone instead of UTC to preserve the correct date
 */
export function formatDateForInput(date: Date): string {
  // Get local date components
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  // Format as YYYY-MM-DDTHH:mm for datetime-local input
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Creates a default end time (30 minutes after start)
 */
export function getDefaultEndTime(startDate: Date): string {
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000)
  return formatDateForInput(endDate)
}

/**
 * Validates event form data
 */
export function validateEventForm(formData: EventFormData): {
  isValid: boolean
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}

  if (!formData.title.trim()) {
    errors.title = 'Event title is required'
  }

  if (!formData.startTime) {
    errors.startTime = 'Start date and time is required'
  }

  if (!formData.endTime) {
    errors.endTime = 'End date and time is required'
  }

  if (formData.startTime && formData.endTime) {
    const start = new Date(formData.startTime)
    const end = new Date(formData.endTime)

    if (end <= start) {
      errors.endTime = 'End time must be after start time'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Converts form data to calendar event
 */
export function formDataToEvent(
  formData: EventFormData,
  userId: string,
  eventId?: string
): CalendarEvent {
  const now = new Date().toISOString()
  return {
    id: eventId || String(Date.now()),
    title: formData.title.trim(),
    start: new Date(formData.startTime).toISOString(),
    end: new Date(formData.endTime).toISOString(),
    userId,
    createdAt: eventId ? undefined : now, // Only set on create
    updatedAt: now,
  }
}

/**
 * Converts calendar event to form data
 */
export function eventToFormData(event: CalendarEvent): EventFormData {
  return {
    title: event.title,
    startTime: formatDateForInput(new Date(event.start)),
    endTime: formatDateForInput(new Date(event.end)),
  }
}

