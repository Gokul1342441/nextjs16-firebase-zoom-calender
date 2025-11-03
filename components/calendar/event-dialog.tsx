'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Edit2, Video } from 'lucide-react'
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
import { useUserName } from '@/hooks/use-user-name'

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
  const router = useRouter()
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    startTime: '',
    endTime: '',
  })
  const [errors, setErrors] = useState<EventFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  const isViewingEvent = !!event
  const isCreator = event ? event.userId === userId : false
  const { userName: creatorName, loading: creatorLoading } = useUserName(event?.userId || null)

  // When opening an event, start in view mode. For new events, start in edit mode.
  const isFormReadOnly = isViewingEvent && !isEditMode

  const handleJoinMeeting = () => {
    if (event?.id) {
      router.push(`/meetings/${event.id}`)
      onOpenChange(false)
    }
  }

  // Reset form when dialog opens/closes or event changes
  useEffect(() => {
    if (open) {
      if (event) {
        setFormData(eventToFormData(event))
        setIsEditMode(false) // Start in view mode for existing events
      } else if (initialFormData) {
        setFormData(initialFormData)
        setIsEditMode(true) // Start in edit mode for new events
      } else {
        setFormData({
          title: '',
          startTime: '',
          endTime: '',
        })
        setIsEditMode(true) // Start in edit mode for new events
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
      setIsEditMode(false)
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
        // Use event's userId if updating, otherwise use current user's id for new events
        userId: event?.userId || userId,
        createdAt: event?.createdAt || now,
        updatedAt: now,
        // Preserve optional fields when updating
        allDay: event?.allDay,
        backgroundColor: event?.backgroundColor,
        borderColor: event?.borderColor,
        textColor: event?.textColor,
      }

      await onSave(calendarEvent)
      // If editing existing event, go back to view mode, otherwise close
      if (isViewingEvent) {
        setIsEditMode(false)
      } else {
        onOpenChange(false)
      }
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
          <div className="flex items-center justify-between pr-3">
            <DialogTitle>
              {isViewingEvent 
                ? isEditMode 
                  ? 'Edit Event' 
                  : 'Event Details'
                : 'Create New Event'}
            </DialogTitle>
            {isViewingEvent && !isEditMode && isCreator && (
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => setIsEditMode(true)}
                className="gap-2"
              >
                <Edit2 className="h-3 w-3 cursor-pointer underline" />
              </Button>
            )}
          </div>
          <DialogDescription>
            {isViewingEvent ? (
              <>
                {creatorLoading ? (
                  'Loading...'
                ) : (
                  <>
                    {creatorName && (
                      <span className="block mb-1">
                        Created by: <span className="font-medium">{creatorName}</span>
                      </span>
                    )}
                    {!isEditMode && !isCreator && (
                      <span className="block text-sm text-muted-foreground">
                        Only the creator can edit or delete this event.
                      </span>
                    )}
                    {isEditMode && (
                      <span>Update the event details below.</span>
                    )}
                  </>
                )}
              </>
            ) : (
              'Fill in the details to create a new calendar event.'
            )}
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="event-title">Event Title</FieldLabel>
            {isFormReadOnly ? (
              <div className="px-3 py-2 text-sm border border-input rounded-md bg-muted">
                {formData.title || '—'}
              </div>
            ) : (
              <>
                <Input
                  id="event-title"
                  placeholder="Enter event title"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  disabled={isSubmitting || isFormReadOnly}
                  aria-invalid={!!errors.title}
                />
                {errors.title && <FieldError>{errors.title}</FieldError>}
              </>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="start-time">Start Date & Time</FieldLabel>
            {isFormReadOnly ? (
              <div className="px-3 py-2 text-sm border border-input rounded-md bg-muted">
                {formData.startTime 
                  ? new Date(formData.startTime).toLocaleString()
                  : '—'}
              </div>
            ) : (
              <>
                <Input
                  id="start-time"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => updateField('startTime', e.target.value)}
                  disabled={isSubmitting || isFormReadOnly}
                  aria-invalid={!!errors.startTime}
                />
                {errors.startTime && <FieldError>{errors.startTime}</FieldError>}
              </>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="end-time">End Date & Time</FieldLabel>
            {isFormReadOnly ? (
              <div className="px-3 py-2 text-sm border border-input rounded-md bg-muted">
                {formData.endTime 
                  ? new Date(formData.endTime).toLocaleString()
                  : '—'}
              </div>
            ) : (
              <>
                <Input
                  id="end-time"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => updateField('endTime', e.target.value)}
                  disabled={isSubmitting || isFormReadOnly}
                  aria-invalid={!!errors.endTime}
                />
                {errors.endTime && <FieldError>{errors.endTime}</FieldError>}
                <FieldDescription>
                  The end time must be after the start time.
                </FieldDescription>
              </>
            )}
          </Field>
        </FieldGroup>

        <DialogFooter className="gap-2 sm:gap-0">
          {isViewingEvent && isEditMode && onDelete && isCreator && (
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
          {isFormReadOnly ? (
            // View mode footer - Join Meeting button and close button
            <>
              <Button
                type="button"
                onClick={handleJoinMeeting}
                className="gap-2"
              >
                <Video className="h-4 w-4" />
                Join Meeting
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </>
          ) : (
            // Edit mode footer
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (isViewingEvent) {
                    setIsEditMode(false) // Cancel edit, go back to view mode
                  } else {
                    onOpenChange(false) // Close dialog for new events
                  }
                }}
                disabled={isSubmitting}
              >
                {isViewingEvent ? 'Cancel' : 'Close'}
              </Button>
              {isEditMode && (
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Saving...'
                    : isViewingEvent
                      ? 'Update'
                      : 'Create'}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

