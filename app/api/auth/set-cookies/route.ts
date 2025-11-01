import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await request.json();

    const response = NextResponse.json({ success: true });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    // If tokens are empty strings, clear the cookies
    if (!accessToken || !refreshToken) {
      response.cookies.set('accessToken', '', {
        ...cookieOptions,
        maxAge: 0,
      });
      response.cookies.set('refreshToken', '', {
        ...cookieOptions,
        maxAge: 0,
      });
      return response;
    }

    // Set cookies with httpOnly, secure, and sameSite flags for security
    response.cookies.set('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24, // 24 hours
    });

    response.cookies.set('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error('Error setting cookies:', error);
    return NextResponse.json(
      { error: 'Failed to set cookies' },
      { status: 500 }
    );
  }
}

