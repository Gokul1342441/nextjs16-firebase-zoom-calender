import { NextRequest, NextResponse } from 'next/server'
import * as jsrsasign from 'jsrsasign'

export async function POST(request: NextRequest) {
  try {
    const { topic = 'My Session', role_type = 0 } = await request.json()
    const { KJUR } = jsrsasign

    const sdkKey = process.env.NEXT_PUBLIC_ZOOM_SDK_KEY?.trim()
    const sdkSecret = process.env.ZOOM_SDK_SECRET?.trim()

    if (!sdkKey || !sdkSecret)
      return NextResponse.json({ error: 'Missing Zoom SDK credentials' }, { status: 500 })

    const iat = Math.floor(Date.now() / 1000) - 30
    const exp = iat + 60 * 60 * 2

    const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' })
    const payload = JSON.stringify({
      app_key: sdkKey,
      tpc: topic,
      role_type,
      version: 1,
      iat,
      exp,
    })

    const signature = KJUR.jws.JWS.sign('HS256', header, payload, sdkSecret)
    return NextResponse.json({ signature })
  } catch (err: any) {
    console.error('Zoom signature error:', err)
    return NextResponse.json({ error: 'Failed to generate signature' }, { status: 500 })
  }
}
