/**
 * Sakai (TACT) API Client
 * Communicates with Nagoya University's TACT portal using Sakai Direct API
 */

const TACT_BASE_URL = "https://tact.ac.thers.ac.jp"

export interface SakaiSite {
  id: string
  title: string
  description?: string
  entityReference?: string
}

export interface SakaiAssignment {
  id: string
  title: string
  instructions?: string
  dueTimeString?: string
  dueTime?: {
    time: number
  }
  context?: string // site ID
  entityReference?: string
}

export interface SakaiAnnouncement {
  id: string
  title: string
  body?: string
  createdOn?: string
  siteId?: string
  entityReference?: string
}

export interface SakaiAPIResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Fetch data from Sakai Direct API
 */
async function fetchSakaiAPI<T>(
  endpoint: string,
  cookie: string
): Promise<SakaiAPIResponse<T>> {
  try {
    const response = await fetch(`${TACT_BASE_URL}${endpoint}`, {
      headers: {
        Cookie: cookie,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: "認証に失敗しました。Cookieが無効または期限切れの可能性があります。",
        }
      }
      return {
        success: false,
        error: `APIエラー: ${response.status} ${response.statusText}`,
      }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error("Sakai API error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "不明なエラーが発生しました",
    }
  }
}

/**
 * Get all sites (courses) for the authenticated user
 */
export async function getSites(
  cookie: string
): Promise<SakaiAPIResponse<{ site_collection: SakaiSite[] }>> {
  return fetchSakaiAPI<{ site_collection: SakaiSite[] }>("/direct/site.json", cookie)
}

/**
 * Get assignments for the authenticated user
 */
export async function getAssignments(
  cookie: string
): Promise<SakaiAPIResponse<{ assignment_collection: SakaiAssignment[] }>> {
  return fetchSakaiAPI<{ assignment_collection: SakaiAssignment[] }>(
    "/direct/assignment/my.json",
    cookie
  )
}

/**
 * Get announcements for the authenticated user
 */
export async function getAnnouncements(
  cookie: string
): Promise<SakaiAPIResponse<{ announcement_collection: SakaiAnnouncement[] }>> {
  return fetchSakaiAPI<{ announcement_collection: SakaiAnnouncement[] }>(
    "/direct/announcement/user.json",
    cookie
  )
}

/**
 * Test if the cookie is valid by making a simple API call
 */
export async function testConnection(cookie: string): Promise<SakaiAPIResponse<boolean>> {
  const result = await getSites(cookie)
  if (result.success) {
    return { success: true, data: true }
  }
  return { success: false, error: result.error }
}
