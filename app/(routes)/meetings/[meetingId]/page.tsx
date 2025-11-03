'use client'

import { useParams } from 'next/navigation'
import ZoomMeetingClient from '@/components/zoom/ZoomMeetingClient'

export default function MeetingPage() {
  const params = useParams()
  const meetingId = params.meetingId as string
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-xl font-semibold">Meeting ID: {meetingId}</h1>
      <ZoomMeetingClient meetingId={meetingId} />
    </div>
  )
}