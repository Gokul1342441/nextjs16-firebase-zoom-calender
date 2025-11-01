'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from '@/components/ui/field'
import type { CalendarEvent, EventFormData, EventFormErrors } from './types'
import { validateEventForm, eventToFormData } from './utils'

type EventDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: CalendarEvent | null
  initialFormData?: EventFormData
  userId: string
  onSave: (event: CalendarEvent) => void | Promise<void>
  onDelete?: (eventId: string) => void
}

export function EventDialog({
  open,
  onOpenChange,
  event,
  initialFormData,
  userId,
  onSave,
  onDelete,
}: EventDialogProps) {
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    startTime: '',
    endTime: '',
  })
  const [errors, setErrors] = useState<EventFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!event

  // Reset form when dialog opens/closes or event changes
  useEffect(() => {
    if (open) {
      if (event) {
        setFormData(eventToFormData(event))
      } else if (initialFormData) {
        setFormData(initialFormData)
      } else {
        setFormData({
          title: '',
          startTime: '',
          endTime: '',
        })
      }
      setErrors({})
    } else {
      // Reset on close
      setFormData({
        title: '',
        startTime: '',
        endTime: '',
      })
      setErrors({})
    }
  }, [open, event, initialFormData])

  const handleSave = async () => {
    const validation = validateEventForm(formData)
    
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setIsSubmitting(true)

    try {
      const now = new Date().toISOString()
      const calendarEvent: CalendarEvent = {
        id: event?.id || String(Date.now()),
        title: formData.title.trim(),
        start: new Date(formData.startTime).toISOString(),
        end: new Date(formData.endTime).toISOString(),
        userId,
        createdAt: event?.createdAt || now,
        updatedAt: now,
        // Preserve optional fields when updating
        allDay: event?.allDay,
        backgroundColor: event?.backgroundColor,
        borderColor: event?.borderColor,
        textColor: event?.textColor,
      }

      await onSave(calendarEvent)
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving event:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = () => {
    if (!event || !onDelete) return
    if (event.userId !== userId) {
      console.error('User can only delete their own events')
      return
    }
    onDelete(event.id)
    onOpenChange(false)
  }

  const updateField = (field: keyof EventFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the event details below.'
              : 'Fill in the details to create a new calendar event.'}
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="event-title">Event Title</FieldLabel>
            <Input
              id="event-title"
              placeholder="Enter event title"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              disabled={isSubmitting}
              aria-invalid={!!errors.title}
            />
            {errors.title && <FieldError>{errors.title}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="start-time">Start Date & Time</FieldLabel>
            <Input
              id="start-time"
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => updateField('startTime', e.target.value)}
              disabled={isSubmitting}
              aria-invalid={!!errors.startTime}
            />
            {errors.startTime && <FieldError>{errors.startTime}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="end-time">End Date & Time</FieldLabel>
            <Input
              id="end-time"
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => updateField('endTime', e.target.value)}
              disabled={isSubmitting}
              aria-invalid={!!errors.endTime}
            />
            {errors.endTime && <FieldError>{errors.endTime}</FieldError>}
            <FieldDescription>
              The end time must be after the start time.
            </FieldDescription>
          </Field>
        </FieldGroup>

        <DialogFooter className="gap-2 sm:gap-0">
          {isEditing && onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="sm:mr-auto"
            >
              Delete
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Saving...'
              : isEditing
                ? 'Update'
                : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

