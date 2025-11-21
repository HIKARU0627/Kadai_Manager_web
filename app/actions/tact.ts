"use server"

import { prisma } from "@/lib/prisma"
import {
  getSites,
  getAssignments,
  getAnnouncements,
  testConnection,
  type SakaiSite,
  type SakaiAssignment,
  type SakaiAnnouncement,
} from "@/lib/sakai-api"
import { revalidatePath } from "next/cache"

/**
 * Convert HTML to plain text
 * Removes HTML tags and decodes HTML entities
 */
function htmlToPlainText(html: string | undefined | null): string {
  if (!html) return ""

  let text = html

  // Replace <br>, <br/>, <br /> with line breaks first (before removing tags)
  text = text.replace(/<br\s*\/?>/gi, "\n")

  // Replace closing paragraph and div tags with line breaks
  text = text.replace(/<\/(p|div)>/gi, "\n")

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]*>/g, "")

  // Decode common HTML entities
  const entities: { [key: string]: string } = {
    "&nbsp;": " ",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
  }

  for (const [entity, char] of Object.entries(entities)) {
    text = text.replace(new RegExp(entity, "g"), char)
  }

  // Decode numeric entities (e.g., &#8217;)
  text = text.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))

  // Trim whitespace and normalize line breaks
  text = text.trim().replace(/\n\s*\n+/g, "\n\n")

  return text
}

/**
 * Save TACT cookie to user settings
 */
export async function saveTactCookie(userId: string, cookie: string) {
  try {
    if (!cookie || cookie.trim().length === 0) {
      return { success: false, error: "Cookieを入力してください" }
    }

    // Test if cookie is valid
    const testResult = await testConnection(cookie.trim())
    if (!testResult.success) {
      return { success: false, error: testResult.error || "Cookieが無効です" }
    }

    // Save cookie
    await prisma.user.update({
      where: { id: userId },
      data: { tactCookie: cookie.trim() },
    })

    revalidatePath("/settings")

    return { success: true }
  } catch (error) {
    console.error("Save TACT cookie error:", error)
    return { success: false, error: "Cookieの保存に失敗しました" }
  }
}

/**
 * Get TACT cookie from user settings
 */
export async function getTactCookie(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tactCookie: true, lastSyncAt: true },
    })

    if (!user) {
      return { success: false, error: "ユーザーが見つかりません" }
    }

    return {
      success: true,
      data: {
        hasCookie: !!user.tactCookie,
        lastSyncAt: user.lastSyncAt,
      },
    }
  } catch (error) {
    console.error("Get TACT cookie error:", error)
    return { success: false, error: "Cookie情報の取得に失敗しました" }
  }
}

/**
 * Delete TACT cookie from user settings
 */
export async function deleteTactCookie(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { tactCookie: null, lastSyncAt: null },
    })

    revalidatePath("/settings")

    return { success: true }
  } catch (error) {
    console.error("Delete TACT cookie error:", error)
    return { success: false, error: "Cookieの削除に失敗しました" }
  }
}

/**
 * Sync subjects from TACT
 */
async function syncSubjects(userId: string, cookie: string, sites: SakaiSite[]) {
  let syncedCount = 0
  let errorCount = 0

  for (const site of sites) {
    try {
      // Check if subject already exists
      const existing = await prisma.subject.findFirst({
        where: {
          userId,
          sakaiId: site.id,
        },
      })

      if (existing) {
        // Update existing subject
        await prisma.subject.update({
          where: { id: existing.id },
          data: {
            name: site.title,
            type: "other", // TACT courses are typically "other" type
            updatedAt: new Date(),
          },
        })
      } else {
        // Create new subject
        await prisma.subject.create({
          data: {
            userId,
            sakaiId: site.id,
            name: site.title,
            type: "other",
            color: "#3B82F6", // Default blue color
          },
        })
      }
      syncedCount++
    } catch (error) {
      console.error(`Error syncing subject ${site.id}:`, error)
      errorCount++
    }
  }

  return { syncedCount, errorCount }
}

/**
 * Sync assignments (tasks) from TACT
 */
async function syncAssignments(
  userId: string,
  cookie: string,
  assignments: SakaiAssignment[]
) {
  let syncedCount = 0
  let errorCount = 0

  for (const assignment of assignments) {
    try {
      // Find corresponding subject
      const subject = assignment.context
        ? await prisma.subject.findFirst({
            where: {
              userId,
              sakaiId: assignment.context,
            },
          })
        : null

      // Parse due date
      let dueDate = new Date()
      if (assignment.dueTime?.time) {
        dueDate = new Date(assignment.dueTime.time)
      } else if (assignment.dueTimeString) {
        dueDate = new Date(assignment.dueTimeString)
      }

      // Convert HTML to plain text
      const plainDescription = htmlToPlainText(assignment.instructions)

      // Check if task already exists
      const existing = await prisma.task.findFirst({
        where: {
          userId,
          sakaiId: assignment.id,
        },
      })

      if (existing) {
        // Update existing task
        await prisma.task.update({
          where: { id: existing.id },
          data: {
            title: assignment.title,
            description: plainDescription || null,
            dueDate,
            subjectId: subject?.id || null,
            updatedAt: new Date(),
          },
        })
      } else {
        // Create new task
        await prisma.task.create({
          data: {
            userId,
            sakaiId: assignment.id,
            title: assignment.title,
            description: plainDescription || null,
            dueDate,
            subjectId: subject?.id || null,
            taskType: "assignment",
            status: "not_started",
          },
        })
      }
      syncedCount++
    } catch (error) {
      console.error(`Error syncing assignment ${assignment.id}:`, error)
      errorCount++
    }
  }

  return { syncedCount, errorCount }
}

/**
 * Sync announcements from TACT
 */
async function syncAnnouncements(
  userId: string,
  cookie: string,
  announcements: SakaiAnnouncement[]
) {
  let syncedCount = 0
  let errorCount = 0

  for (const announcement of announcements) {
    try {
      // Find corresponding subject
      const subject = announcement.siteId
        ? await prisma.subject.findFirst({
            where: {
              userId,
              sakaiId: announcement.siteId,
            },
          })
        : null

      // Skip if no subject found
      if (!subject) {
        continue
      }

      // Convert HTML to plain text
      const plainTitle = htmlToPlainText(announcement.title)
      const plainContent = htmlToPlainText(announcement.body)

      // Check if note already exists
      const existing = await prisma.note.findFirst({
        where: {
          userId,
          sakaiId: announcement.id,
        },
      })

      if (existing) {
        // Update existing note
        await prisma.note.update({
          where: { id: existing.id },
          data: {
            title: plainTitle || "（タイトルなし）",
            content: plainContent || "",
            updatedAt: new Date(),
          },
        })
      } else {
        // Create new note
        await prisma.note.create({
          data: {
            userId,
            subjectId: subject.id,
            sakaiId: announcement.id,
            title: plainTitle || "（タイトルなし）",
            content: plainContent || "",
            noteType: "announcement",
          },
        })
      }
      syncedCount++
    } catch (error) {
      console.error(`Error syncing announcement ${announcement.id}:`, error)
      errorCount++
    }
  }

  return { syncedCount, errorCount }
}

/**
 * Sync all data from TACT
 */
export async function syncTactData(userId: string) {
  try {
    // Get user's TACT cookie
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tactCookie: true },
    })

    if (!user || !user.tactCookie) {
      return { success: false, error: "TACTのCookieが設定されていません" }
    }

    const cookie = user.tactCookie

    // Fetch data from TACT
    const [sitesResult, assignmentsResult, announcementsResult] = await Promise.all([
      getSites(cookie),
      getAssignments(cookie),
      getAnnouncements(cookie),
    ])

    if (!sitesResult.success) {
      return { success: false, error: sitesResult.error || "科目データの取得に失敗しました" }
    }

    if (!assignmentsResult.success) {
      return {
        success: false,
        error: assignmentsResult.error || "課題データの取得に失敗しました",
      }
    }

    if (!announcementsResult.success) {
      return {
        success: false,
        error: announcementsResult.error || "お知らせデータの取得に失敗しました",
      }
    }

    // Sync data
    const sites = sitesResult.data?.site_collection || []
    const assignments = assignmentsResult.data?.assignment_collection || []
    const announcements = announcementsResult.data?.announcement_collection || []

    const subjectsResult = await syncSubjects(userId, cookie, sites)
    const assignmentsSync = await syncAssignments(userId, cookie, assignments)
    const announcementsSync = await syncAnnouncements(userId, cookie, announcements)

    // Update last sync time
    await prisma.user.update({
      where: { id: userId },
      data: { lastSyncAt: new Date() },
    })

    revalidatePath("/")
    revalidatePath("/subjects")
    revalidatePath("/tasks")
    revalidatePath("/notes")

    return {
      success: true,
      data: {
        subjects: subjectsResult.syncedCount,
        tasks: assignmentsSync.syncedCount,
        announcements: announcementsSync.syncedCount,
        errors:
          subjectsResult.errorCount +
          assignmentsSync.errorCount +
          announcementsSync.errorCount,
      },
    }
  } catch (error) {
    console.error("Sync TACT data error:", error)
    return { success: false, error: "データの同期に失敗しました" }
  }
}
