import { NextRequest, NextResponse } from "next/server"

// API для получения userpic пользователя Twitch по username
// Использует Twitch Helix API с Client Credentials Grant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get("username")

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      )
    }

    const clientId = process.env.TWITCH_CLIENT_ID
    const clientSecret = process.env.TWITCH_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json({ userpicUrl: null })
    }

    try {
      // Получаем access token через Client Credentials Grant
      const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "client_credentials",
        }),
      })

      if (!tokenResponse.ok) {
        console.error("Failed to get Twitch access token:", await tokenResponse.text())
        return NextResponse.json({ userpicUrl: null })
      }

      const tokenData = await tokenResponse.json()
      const accessToken = tokenData.access_token

      // Получаем информацию о пользователе через Helix API
      const userResponse = await fetch(
        `https://api.twitch.tv/helix/users?login=${encodeURIComponent(username)}`,
        {
          headers: {
            "Client-ID": clientId,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (userResponse.ok) {
        const userData = await userResponse.json()
        if (userData.data && userData.data.length > 0) {
          const user = userData.data[0]
          // Twitch возвращает profile_image_url в поле profile_image_url
          return NextResponse.json({
            userpicUrl: user.profile_image_url || null,
          })
        }
      } else {
        console.error("Failed to get Twitch user:", await userResponse.text())
      }
    } catch (error) {
      console.error("Error fetching Twitch userpic:", error)
    }

    return NextResponse.json({ userpicUrl: null })
  } catch (error) {
    console.error("Error in twitch-userpic route:", error)
    return NextResponse.json(
      { error: "Failed to fetch userpic" },
      { status: 500 }
    )
  }
}
