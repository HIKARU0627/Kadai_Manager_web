"use server"

import { prisma } from "@/lib/prisma"
import {
  getSites,
  getAllSiteAssignments,
  getAllSiteAnnouncements,
  getAllSiteContents,
  testConnection,
  parseScheduleFromTitle,
  type SakaiSite,
  type SakaiAssignment,
  type SakaiAnnouncement,
  type SakaiContent,
} from "@/lib/sakai-api"
import { revalidatePath } from "next/cache"
import { getOrCreateCurrentSemester, getOrCreateSemester } from "./semesters"

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
  let scheduleParsedCount = 0

  for (const site of sites) {
    try {
      // Parse schedule and semester information from title and description
      const scheduleInfo = parseScheduleFromTitle(site.title, site.description)

      // Get or create the appropriate semester for this subject
      let subjectSemesterId: string | null = null

      if (scheduleInfo.year !== null && scheduleInfo.semesterName !== null) {
        const semesterResult = await getOrCreateSemester(
          userId,
          scheduleInfo.year,
          scheduleInfo.semesterName
        )

        if (semesterResult.success && semesterResult.data) {
          subjectSemesterId = semesterResult.data.id
          console.log(`[TACT Sync] Subject "${site.title}" assigned to ${scheduleInfo.year}年度 ${scheduleInfo.semesterName}`)
        }
      }

      // Track if schedule was successfully parsed
      if (scheduleInfo.dayOfWeek !== null && scheduleInfo.periods.length > 0) {
        scheduleParsedCount++
        console.log(`[TACT Sync] Parsed schedule for "${site.title}": Day ${scheduleInfo.dayOfWeek}, Periods ${scheduleInfo.periods.join(', ')}`)
      }

      // Handle multi-period classes (e.g., 月３限,月４限)
      const periodsToSync = scheduleInfo.periods.length > 0 ? scheduleInfo.periods : [scheduleInfo.period]

      for (let i = 0; i < periodsToSync.length; i++) {
        const period = periodsToSync[i]
        if (period === null) continue

        // For multi-period classes, use period suffix for sakaiId to avoid unique constraint
        const sakaiIdForPeriod = i === 0 ? site.id : `${site.id}-period-${period}`

        // Check if subject already exists for this period
        const existing = await prisma.subject.findFirst({
          where: {
            userId,
            sakaiId: sakaiIdForPeriod,
          },
        })

        if (existing) {
          // Update existing subject
          const updateData: any = {
            name: site.title,
            updatedAt: new Date(),
          }

          // Update semester if parsed from title
          if (subjectSemesterId !== null) {
            updateData.semesterId = subjectSemesterId
          }

          // Update schedule info only if existing subject has no schedule set
          if (existing.dayOfWeek === null && scheduleInfo.dayOfWeek !== null) {
            updateData.dayOfWeek = scheduleInfo.dayOfWeek
          }
          if (existing.period === null && period !== null) {
            updateData.period = period
          }
          if (existing.type === "other" && scheduleInfo.type === "regular") {
            updateData.type = scheduleInfo.type
          }

          await prisma.subject.update({
            where: { id: existing.id },
            data: updateData,
          })
        } else {
          // Create new subject for this period
          await prisma.subject.create({
            data: {
              userId,
              sakaiId: sakaiIdForPeriod,
              name: site.title,
              type: scheduleInfo.type,
              dayOfWeek: scheduleInfo.dayOfWeek,
              period: period,
              semesterId: subjectSemesterId,
              color: "#3B82F6", // Default blue color
            },
          })
        }
      }
      syncedCount++
    } catch (error) {
      console.error(`Error syncing subject ${site.id}:`, error)
      errorCount++
    }
  }

  return { syncedCount, errorCount, scheduleParsedCount }
}

/**
 * Sync file attachments for a task
 */
async function syncTaskAttachments(
  userId: string,
  taskId: string,
  assignmentAttachments: any[] = [],
  submittedAttachments: any[] = []
) {
  try {
    // Get existing files for this task from Sakai
    const existingFiles = await prisma.file.findMany({
      where: {
        userId,
        taskId,
        fileSource: {
          in: ["sakai_assignment", "sakai_submission"],
        },
      },
    })

    const existingRefs = new Set(existingFiles.map((f) => f.sakaiRef))
    const currentRefs = new Set<string>()

    // Sync assignment attachments (instructor-provided files)
    for (const attachment of assignmentAttachments || []) {
      if (!attachment.ref || !attachment.url) continue
      currentRefs.add(attachment.ref)

      if (!existingRefs.has(attachment.ref)) {
        await prisma.file.create({
          data: {
            userId,
            taskId,
            fileName: attachment.name || "添付ファイル",
            fileUrl: attachment.url,
            sakaiUrl: attachment.url,
            sakaiRef: attachment.ref,
            fileType: attachment.type || null,
            fileSize: attachment.size || null,
            fileSource: "sakai_assignment",
          },
        })
      }
    }

    // Sync submitted attachments (student-submitted files)
    for (const attachment of submittedAttachments || []) {
      if (!attachment.ref || !attachment.url) continue
      currentRefs.add(attachment.ref)

      if (!existingRefs.has(attachment.ref)) {
        await prisma.file.create({
          data: {
            userId,
            taskId,
            fileName: attachment.name || "提出ファイル",
            fileUrl: attachment.url,
            sakaiUrl: attachment.url,
            sakaiRef: attachment.ref,
            fileType: attachment.type || null,
            fileSize: attachment.size || null,
            fileSource: "sakai_submission",
          },
        })
      }
    }

    // Delete files that no longer exist in Sakai
    const filesToDelete = existingFiles.filter((f) => f.sakaiRef && !currentRefs.has(f.sakaiRef))
    for (const file of filesToDelete) {
      await prisma.file.delete({ where: { id: file.id } })
    }
  } catch (error) {
    console.error(`Error syncing attachments for task ${taskId}:`, error)
  }
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
      if (assignment.dueTime?.epochSecond) {
        dueDate = new Date(assignment.dueTime.epochSecond * 1000)
      } else if (assignment.dueTime?.time) {
        dueDate = new Date(assignment.dueTime.time)
      } else if (assignment.dueTimeString) {
        dueDate = new Date(assignment.dueTimeString)
      }

      // Determine if assignment is submitted from submissions array
      let isSubmitted = false
      let submissionDate: Date | null = null

      if (assignment.submissions && assignment.submissions.length > 0) {
        // Check the first submission (user's submission)
        const submission = assignment.submissions[0]
        // Only consider as submitted if user actually submitted electronically
        // and there is a valid submission date
        isSubmitted =
          submission.userSubmission === true &&
          submission.dateSubmittedEpochSeconds !== undefined &&
          submission.dateSubmittedEpochSeconds > 0

        // Get submission date if available
        if (isSubmitted && submission.dateSubmittedEpochSeconds) {
          submissionDate = new Date(submission.dateSubmittedEpochSeconds * 1000)
        }
      } else {
        // Fallback to top-level fields if submissions array is not available
        isSubmitted =
          assignment.userSubmission === true ||
          assignment.graded === true ||
          assignment.status?.toLowerCase().includes("submitted") ||
          assignment.status?.toLowerCase().includes("graded")
      }

      // Check if past due
      const now = new Date()
      const isPastDue = dueDate < now

      const existing = await prisma.task.findFirst({
        where: {
          userId,
          sakaiId: assignment.id,
        },
      })

      // Determine status
      let status = "not_started"
      let completedAt: Date | null = null

      if (isSubmitted) {
        // Submitted assignments are marked as completed
        status = "completed"
        // Use actual submission date if available
        completedAt = submissionDate || new Date()
      } else if (isPastDue) {
        // Past due and not submitted are marked as overdue
        status = "overdue"
      }

      // Convert HTML to plain text
      const plainDescription = htmlToPlainText(assignment.instructions)

      let taskId: string

      if (existing) {
        // Update existing task
        const updateData: any = {
          title: assignment.title,
          description: plainDescription || null,
          dueDate,
          subjectId: subject?.id || null,
          updatedAt: new Date(),
        }

        // Update status based on submission state and deadline
        // Don't override manually completed tasks
        if (isSubmitted && existing.status !== "completed") {
          updateData.status = "completed"
          updateData.completedAt = completedAt
        } else if (!isSubmitted && isPastDue && existing.status !== "completed") {
          // Mark as overdue if not submitted and past due (unless already manually completed)
          updateData.status = "overdue"
        } else if (!isSubmitted && !isPastDue && existing.status === "overdue") {
          // If deadline was extended and no longer past due, reset to not_started
          updateData.status = "not_started"
        }

        await prisma.task.update({
          where: { id: existing.id },
          data: updateData,
        })

        taskId = existing.id
      } else {
        // Create new task
        const newTask = await prisma.task.create({
          data: {
            userId,
            sakaiId: assignment.id,
            title: assignment.title,
            description: plainDescription || null,
            dueDate,
            subjectId: subject?.id || null,
            taskType: "assignment",
            status,
            completedAt,
          },
        })

        taskId = newTask.id
      }

      // Sync attachments
      const submittedAttachments =
        assignment.submissions && assignment.submissions.length > 0
          ? assignment.submissions[0].submittedAttachments || []
          : []

      await syncTaskAttachments(
        userId,
        taskId,
        assignment.attachments || [],
        submittedAttachments
      )

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
 * Sync course materials from TACT
 */
async function syncCourseMaterials(
  userId: string,
  contentsBySite: Map<string, SakaiContent[]>
) {
  let syncedCount = 0
  let errorCount = 0

  for (const [siteId, contents] of contentsBySite.entries()) {
    try {
      // Find corresponding subject
      const subject = await prisma.subject.findFirst({
        where: {
          userId,
          sakaiId: siteId,
        },
      })

      if (!subject) {
        continue
      }

      // Get existing course material files for this subject from Sakai
      const existingFiles = await prisma.file.findMany({
        where: {
          userId,
          subjectId: subject.id,
          fileSource: "sakai_course_material",
        },
      })

      const existingUrls = new Set(existingFiles.map((f) => f.sakaiUrl))
      const currentUrls = new Set<string>()

      // Sync each course material file
      for (const content of contents) {
        if (!content.url) continue
        currentUrls.add(content.url)

        if (!existingUrls.has(content.url)) {
          await prisma.file.create({
            data: {
              userId,
              subjectId: subject.id,
              fileName: content.title || "授業資料",
              fileUrl: content.url,
              sakaiUrl: content.url,
              sakaiRef: content.url, // Use URL as reference for course materials
              fileType: content.type || null,
              fileSize: content.size || null,
              fileSource: "sakai_course_material",
            },
          })
          syncedCount++
        }
      }

      // Delete files that no longer exist in Sakai
      const filesToDelete = existingFiles.filter(
        (f) => f.sakaiUrl && !currentUrls.has(f.sakaiUrl)
      )
      for (const file of filesToDelete) {
        await prisma.file.delete({ where: { id: file.id } })
      }
    } catch (error) {
      console.error(`Error syncing course materials for site ${siteId}:`, error)
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

    // Fetch sites first
    const sitesResult = await getSites(cookie)

    if (!sitesResult.success) {
      return { success: false, error: sitesResult.error || "科目データの取得に失敗しました" }
    }

    const sites = sitesResult.data?.site_collection || []

    // Fetch assignments, announcements, and course materials for all sites in parallel
    const [assignmentsResult, announcementsResult, contentsResult] = await Promise.all([
      getAllSiteAssignments(cookie, sites),
      getAllSiteAnnouncements(cookie, sites),
      getAllSiteContents(cookie, sites),
    ])

    if (!assignmentsResult.success) {
      return {
        success: false,
        error: assignmentsResult.error || "課題データの取得に失敗しました",
      }
    }

    const assignments = assignmentsResult.data || []

    if (!announcementsResult.success) {
      return {
        success: false,
        error: announcementsResult.error || "お知らせデータの取得に失敗しました",
      }
    }

    const announcements = announcementsResult.data || []

    if (!contentsResult.success) {
      return {
        success: false,
        error: contentsResult.error || "授業資料の取得に失敗しました",
      }
    }

    const contentsBySite = contentsResult.data || new Map()
    const totalContents = Array.from(contentsBySite.values()).reduce(
      (sum, contents) => sum + contents.length,
      0
    )

    // Log fetched data counts for debugging
    console.log(`[TACT Sync] Fetched from API - Sites: ${sites.length}, Assignments: ${assignments.length}, Announcements: ${announcements.length}, Course Materials: ${totalContents}`)

    // Sync subjects (semester will be determined from each subject's title)
    const subjectsResult = await syncSubjects(userId, cookie, sites)
    const assignmentsSync = await syncAssignments(userId, cookie, assignments)
    const announcementsSync = await syncAnnouncements(userId, cookie, announcements)
    const courseMaterialsSync = await syncCourseMaterials(userId, contentsBySite)

    // Log sync results
    console.log(`[TACT Sync] Synced - Subjects: ${subjectsResult.syncedCount}/${sites.length}, Tasks: ${assignmentsSync.syncedCount}/${assignments.length}, Announcements: ${announcementsSync.syncedCount}/${announcements.length}, Course Materials: ${courseMaterialsSync.syncedCount}/${totalContents}`)
    console.log(`[TACT Sync] Schedule parsed - ${subjectsResult.scheduleParsedCount} subjects added to timetable`)
    console.log(`[TACT Sync] Errors - Subjects: ${subjectsResult.errorCount}, Tasks: ${assignmentsSync.errorCount}, Announcements: ${announcementsSync.errorCount}, Course Materials: ${courseMaterialsSync.errorCount}`)

    // Update last sync time
    await prisma.user.update({
      where: { id: userId },
      data: { lastSyncAt: new Date() },
    })

    revalidatePath("/")
    revalidatePath("/subjects")
    revalidatePath("/tasks")
    revalidatePath("/notes")
    revalidatePath("/files")

    return {
      success: true,
      data: {
        subjects: subjectsResult.syncedCount,
        tasks: assignmentsSync.syncedCount,
        announcements: announcementsSync.syncedCount,
        courseMaterials: courseMaterialsSync.syncedCount,
        scheduleParsed: subjectsResult.scheduleParsedCount,
        errors:
          subjectsResult.errorCount +
          assignmentsSync.errorCount +
          announcementsSync.errorCount +
          courseMaterialsSync.errorCount,
        totalFetched: {
          subjects: sites.length,
          tasks: assignments.length,
          announcements: announcements.length,
          courseMaterials: totalContents,
        },
      },
    }
  } catch (error) {
    console.error("Sync TACT data error:", error)
    return { success: false, error: "データの同期に失敗しました" }
  }
}
