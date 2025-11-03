'use client'

import { useEffect, useRef, useState } from 'react'
import ZoomVideo from '@zoom/videosdk'
import { Button } from '@/components/ui/button'
import { PhoneOff } from 'lucide-react'

interface Props {
  meetingId: string
}

export default function ZoomMeetingClient({ meetingId }: Props) {
  const [joined, setJoined] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const clientRef = useRef<any>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const handlersRef = useRef<{
    onPeerVideo?: (payload: any) => void
    onPeerAudio?: (payload: any) => void
    onUserAdded?: (payload: any) => void
    onUserRemoved?: (payload: any) => void
  }>({})

  useEffect(() => {
    return () => {
      if (clientRef.current) {
        try {
          // Remove listeners if any were registered
          const client = clientRef.current
          const { onPeerVideo, onPeerAudio, onUserAdded, onUserRemoved } = handlersRef.current
          if (onPeerVideo) client.off('peer-video-state-change', onPeerVideo)
          if (onPeerAudio) client.off('peer-audio-state-change', onPeerAudio)
          if (onUserAdded) client.off('user-added', onUserAdded)
          if (onUserRemoved) client.off('user-removed', onUserRemoved)
        } catch {}
        clientRef.current.leave().catch(console.error)
      }
    }
  }, [])

  const joinMeeting = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/zoom/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: meetingId, role_type: 1 }),
      })

      const { signature } = await res.json()
      if (!signature) throw new Error('Failed to get signature')

      const client = ZoomVideo.createClient()
      clientRef.current = client

      const supportsGetDisplayMedia = typeof navigator !== 'undefined' &&
        typeof (navigator as any).mediaDevices !== 'undefined' &&
        typeof (navigator as any).mediaDevices.getDisplayMedia === 'function'

      await client.init('en-US', 'Global', { patchJsMedia: supportsGetDisplayMedia })
      await client.join(meetingId, signature, userName)

      const mediaStream = client.getMediaStream()
      await mediaStream.startAudio()
      await mediaStream.startVideo()

      const user = client.getCurrentUserInfo()
      const VideoQuality = await import('@zoom/videosdk').then(m => m.VideoQuality)
      const videoElement = await mediaStream.attachVideo(user.userId, VideoQuality.Video_360P)
      
      if (videoElement instanceof HTMLElement) {
        videoContainerRef.current?.appendChild(videoElement)
      }

      // Render existing participants and subscribe to their audio
      const existingUsers = client.getAllUser()
      const ms: any = mediaStream
      for (const u of existingUsers) {
        if (u.userId === user.userId) continue
        try {
          await ms.subscribeAudio(u.userId)
        } catch {}
        if (u.bVideoOn) {
          const remoteEl = await mediaStream.attachVideo(u.userId, VideoQuality.Video_360P)
          if (remoteEl instanceof HTMLElement) {
            videoContainerRef.current?.appendChild(remoteEl)
          }
        }
      }

      // Event handlers
      const onPeerVideo = async (payload: any) => {
        if (payload.action === 'Start') {
          const remoteVideo = await mediaStream.attachVideo(payload.userId, VideoQuality.Video_360P)
          if (remoteVideo instanceof HTMLElement) {
            videoContainerRef.current?.appendChild(remoteVideo)
          }
        } else if (payload.action === 'Stop') {
          const elements = await mediaStream.detachVideo(payload.userId)
          if (Array.isArray(elements)) {
            elements.forEach((el) => {
              if (el instanceof HTMLElement) {
                el.remove()
              }
            })
          } else if (elements instanceof HTMLElement) {
            elements.remove()
          }
        }
      }

      const onPeerAudio = async (payload: any) => {
        const msAny: any = mediaStream
        if (payload.action === 'Start') {
          try { await msAny.subscribeAudio(payload.userId) } catch {}
        } else if (payload.action === 'Stop') {
          try { await msAny.unsubscribeAudio(payload.userId) } catch {}
        }
      }

      const onUserAdded = async (payload: any) => {
        const msAny: any = mediaStream
        if (payload.userId === user.userId) return
        try { await msAny.subscribeAudio(payload.userId) } catch {}
        if (payload.bVideoOn) {
          const el = await mediaStream.attachVideo(payload.userId, VideoQuality.Video_360P)
          if (el instanceof HTMLElement) {
            videoContainerRef.current?.appendChild(el)
          }
        }
      }

      const onUserRemoved = async (payload: any) => {
        const msAny: any = mediaStream
        const elements = await mediaStream.detachVideo(payload.userId)
        if (Array.isArray(elements)) {
          elements.forEach((el) => {
            if (el instanceof HTMLElement) el.remove()
          })
        } else if (elements instanceof HTMLElement) {
          elements.remove()
        }
        try { await msAny.unsubscribeAudio(payload.userId) } catch {}
      }

      client.on('peer-video-state-change', onPeerVideo)
      client.on('peer-audio-state-change', onPeerAudio)
      client.on('user-added', onUserAdded)
      client.on('user-removed', onUserRemoved)

      handlersRef.current.onPeerVideo = onPeerVideo
      handlersRef.current.onPeerAudio = onPeerAudio
      handlersRef.current.onUserAdded = onUserAdded
      handlersRef.current.onUserRemoved = onUserRemoved


      setJoined(true)
    } catch (err: any) {
      console.error('Join error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const leaveMeeting = async () => {
    try {
      const client = clientRef.current
      if (!client) return

      const mediaStream = client.getMediaStream()
      const msAny: any = mediaStream
      try {
        const allUsers = client.getAllUser()
        for (const u of allUsers) {
          try { await mediaStream.detachVideo(u.userId) } catch {}
          try { await msAny.unsubscribeAudio(u.userId) } catch {}
        }
      } catch {}

      const { onPeerVideo, onPeerAudio, onUserAdded, onUserRemoved } = handlersRef.current
      if (onPeerVideo) client.off('peer-video-state-change', onPeerVideo)
      if (onPeerAudio) client.off('peer-audio-state-change', onPeerAudio)
      if (onUserAdded) client.off('user-added', onUserAdded)
      if (onUserRemoved) client.off('user-removed', onUserRemoved)

      await client.leave()
      setJoined(false)
      window.location.href = '/'
    } catch (err) {
      console.error('Leave error:', err)
    }
  }

  if (error) return <p className="text-red-500 text-center mt-10">{error}</p>

  return (
    <>
      <div
        ref={videoContainerRef}
      />

      {!joined ? (
        <Button onClick={joinMeeting} disabled={loading}>
          {loading ? 'Joining...' : 'Join Meeting'}
        </Button>
      ) : (
        <Button variant="destructive" onClick={leaveMeeting}>
          <PhoneOff className="mr-2 h-4 w-4" /> Leave Meeting
        </Button>
      )}
    </>
  )
}

const userName = `User-${new Date().getTime().toString().slice(8)}`