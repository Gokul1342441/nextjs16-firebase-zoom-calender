'use client'

import { useParams } from 'next/navigation'
import ZoomMeetingClient from '@/components/zoom/ZoomMeetingClient'

export default function MeetingPage() {
  const params = useParams()
  const meetingId = params.meetingId as string
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <ZoomMeetingClient meetingId={meetingId} />
    </div>
  )
}