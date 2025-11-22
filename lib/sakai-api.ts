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
  props?: Record<string, any> // Additional properties that might contain schedule info
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
  status?: string // Assignment status (e.g., "Submitted", "Graded", "Open", etc.)
  graded?: boolean // Whether the assignment has been graded
  draft?: boolean // Whether submission is in draft
  dropped?: boolean // Whether student has dropped
  userSubmission?: boolean // Whether user has submitted
  closeTime?: {
    time: number
  }
  openTime?: {
    time: number
  }
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
  // Try to get user's sites with no limit
  const result = await fetchSakaiAPI<{ site_collection: SakaiSite[] }>(
    "/direct/site/user.json?_limit=1000",
    cookie
  )

  // If that fails, fall back to the default endpoint
  if (!result.success || !result.data?.site_collection) {
    return fetchSakaiAPI<{ site_collection: SakaiSite[] }>("/direct/site.json?_limit=1000", cookie)
  }

  return result
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

/**
 * Parse schedule information from course title or description
 * Japanese universities often include schedule in format like:
 * - "数学A (月1)" → Monday, Period 1
 * - "物理学 月曜1限" → Monday, Period 1
 * - "化学 (火2-3)" → Tuesday, Period 2 (for double periods, take first)
 */
export interface ScheduleInfo {
  dayOfWeek: number | null // 1=月, 2=火, 3=水, 4=木, 5=金, 6=土, 0=日
  period: number | null
  type: "regular" | "other" // regular if schedule found, other if not
  year: number | null // Academic year (e.g., 2025, 2024)
  semesterName: string | null // Semester name (e.g., "春1期", "秋2期")
}

export function parseScheduleFromTitle(title: string, description?: string): ScheduleInfo {
  const text = `${title} ${description || ""}`

  // Extract academic year and semester: "(2025年度秋１期/水１限)" or "(2024年度春/火５限)"
  const yearSemesterPattern = /[（(](\d{4})年度(春|秋)([１２1２]期)?/
  const yearSemesterMatch = text.match(yearSemesterPattern)

  let year: number | null = null
  let semesterName: string | null = null

  if (yearSemesterMatch) {
    year = parseInt(yearSemesterMatch[1], 10)
    const season = yearSemesterMatch[2] // "春" or "秋"
    const quarterStr = yearSemesterMatch[3] // "１期" or "２期" or undefined

    // Normalize quarter - convert full-width to half-width
    let quarter = "1期" // Default to first quarter if not specified
    if (quarterStr) {
      quarter = quarterStr.replace(/[１２]/g, (ch) => {
        if (ch === "１") return "1"
        if (ch === "２") return "2"
        return ch
      })
    }

    semesterName = `${season}${quarter}`
  }

  // Primary pattern: "(2025年度秋１期/水１限)" or "(2024年度春/火５限)"
  // Also handles multiple periods: "(2025年度秋１期/月３限,月４限)" - takes first period
  const schedulePattern = /[（(][^/]*\/([月火水木金土日])([０-９0-9]+)限/

  const match = text.match(schedulePattern)
  if (match) {
    const dayChar = match[1]
    const periodStr = match[2]

    // Convert full-width numbers to half-width
    const normalizedPeriod = periodStr.replace(/[０-９]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
    )
    const period = parseInt(normalizedPeriod, 10)

    // Map day character to day number
    const dayMap: { [key: string]: number } = {
      月: 1,
      火: 2,
      水: 3,
      木: 4,
      金: 5,
      土: 6,
      日: 0,
    }

    const dayOfWeek = dayMap[dayChar]

    if (dayOfWeek !== undefined && !isNaN(period) && period >= 1 && period <= 10) {
      return {
        dayOfWeek,
        period,
        type: "regular",
        year,
        semesterName,
      }
    }
  }

  // Fallback: Try simpler patterns like "月1" or "月曜1限"
  const fallbackPatterns = [
    { pattern: /[（(]?月[曜)）]?[・\s]*([０-９0-9]+)[限\-)）]?/i, day: 1 },
    { pattern: /[（(]?火[曜)）]?[・\s]*([０-９0-9]+)[限\-)）]?/i, day: 2 },
    { pattern: /[（(]?水[曜)）]?[・\s]*([０-９0-9]+)[限\-)）]?/i, day: 3 },
    { pattern: /[（(]?木[曜)）]?[・\s]*([０-９0-9]+)[限\-)）]?/i, day: 4 },
    { pattern: /[（(]?金[曜)）]?[・\s]*([０-９0-9]+)[限\-)）]?/i, day: 5 },
    { pattern: /[（(]?土[曜)）]?[・\s]*([０-９0-9]+)[限\-)）]?/i, day: 6 },
    { pattern: /[（(]?日[曜)）]?[・\s]*([０-９0-9]+)[限\-)）]?/i, day: 0 },
  ]

  for (const { pattern, day } of fallbackPatterns) {
    const fallbackMatch = text.match(pattern)
    if (fallbackMatch && fallbackMatch[1]) {
      // Convert full-width numbers to half-width
      const normalizedPeriod = fallbackMatch[1].replace(/[０-９]/g, (ch) =>
        String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
      )
      const period = parseInt(normalizedPeriod, 10)

      if (!isNaN(period) && period >= 1 && period <= 10) {
        return {
          dayOfWeek: day,
          period,
          type: "regular",
          year,
          semesterName,
        }
      }
    }
  }

  // If semester info was found but no schedule, still return semester info
  if (year !== null && semesterName !== null) {
    return {
      dayOfWeek: null,
      period: null,
      type: "other",
      year,
      semesterName,
    }
  }

  // No schedule or semester information found
  return {
    dayOfWeek: null,
    period: null,
    type: "other",
    year: null,
    semesterName: null,
  }
}
