'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Video } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { useSearchParams } from 'next/navigation'

interface Props {
  meetingId: string
}

export default function ZoomMeetingClient({ meetingId }: Props) {
  const [joined, setJoined] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sessionContainerRef = useRef<HTMLDivElement>(null)
  const uitRef = useRef<any>(null)
  const { userDetails } = useUser()
  const styleElementRef = useRef<HTMLStyleElement | null>(null)
  const searchParams = useSearchParams()
  const name = searchParams.get('name')

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      try {
        if (uitRef.current) {
          uitRef.current.closeSession()
        }
        // Remove injected styles
        if (styleElementRef.current && styleElementRef.current.parentNode) {
          styleElementRef.current.parentNode.removeChild(styleElementRef.current)
        }
      } catch (err) {
        console.error('Cleanup error:', err)
      }
    }
  }, [])

  const injectZoomStyles = async () => {
    const response = await fetch('https://source.zoom.us/uitoolkit/2.2.10-1/videosdk-ui-toolkit.css')
    const css = await response.text()
    
    // No need to modify - the CSS is already scoped to .zoom-ui-toolkit-root
    // Just inject it as-is
    const styleElement = document.createElement('style')
    styleElement.setAttribute('data-zoom-sdk', 'true')
    styleElement.textContent = css
    document.head.appendChild(styleElement)
    styleElementRef.current = styleElement
  }

  const joinMeeting = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get JWT signature from your API
      const res = await fetch('/api/zoom/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic: meetingId, 
          role_type: 1,
          videoWebRtcMode: 1 
        }),
      })

      const { signature } = await res.json()
      if (!signature) throw new Error('Failed to get signature')

      const container = sessionContainerRef.current
      if (!container) throw new Error('Session container not found')

      // Inject Zoom styles (already scoped)
      await injectZoomStyles()

      // Dynamically import UI Toolkit
      const uitoolkit = (await import('@zoom/videosdk-ui-toolkit')).default
      uitRef.current = uitoolkit

      // Configure UI Toolkit
      const config = {
        videoSDKJWT: signature,
        sessionName: meetingId,
        userName: userDetails?.name as string,
        sessionPasscode: '',
        featuresOptions: {
          preview: {
            enable: true,
          },
          virtualBackground: {
            enable: true,
            virtualBackgrounds: [
              {
                url: 'https://images.unsplash.com/photo-1715490187538-30a365fa05bd?q=80&w=1945&auto=format&fit=crop',
              },
            ],
          },
          toolbar: {
            enable: true,
          },
          video: {
            enable: true,
          },
          audio: {
            enable: true,
          },
          share: {
            enable: true,
          },
          chat: {
            enable: true,
            enableEmoji: true,
          },
          feedback: {
            enable: false,
          },
          theme: {
            enable: false,
            defaultTheme: "light" as "light" | "dark" | "blue" | "green" | undefined,
          },
        },
      }

      // Join session
      await uitoolkit.joinSession(container, config)

      // Setup session event listeners
      uitoolkit.onSessionClosed(() => {
        console.log('Session closed')
        setJoined(false)
      })

      uitoolkit.onSessionDestroyed(() => {
        console.log('Session destroyed')
        try { 
          uitoolkit.destroy() 
          // Remove styles when session ends
          if (styleElementRef.current && styleElementRef.current.parentNode) {
            styleElementRef.current.parentNode.removeChild(styleElementRef.current)
          }
        } catch {}
        setJoined(false)
      })

      setJoined(true)
    } catch (err: any) {
      console.error('Join error:', err)
      setError(err.message || 'Failed to join meeting')
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-red-500 text-center">{error}</p>
        <Button onClick={() => setError(null)} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      {!joined && (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <h2 className="text-2xl font-bold">Zoom Video SDK Meeting</h2>
          <p className="text-gray-600">Session: {name}</p>
          <Button onClick={joinMeeting} disabled={loading} size="lg">
            <Video className="mr-2 h-5 w-5" />
            {loading ? 'Joining...' : 'Join Meeting'}
          </Button>
        </div>
      )}
      
      {/* IMPORTANT: Use .zoom-ui-toolkit-root instead of .zoom-meeting-wrapper */}
      <div className="zoom-ui-toolkit-root">
        <div
          ref={sessionContainerRef}
          className="w-full h-[calc(100vh-100px)]"
        />
      </div>
    </div>
  )
}