'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * 学期を作成
 */
export async function createSemester(data: {
  year: number;
  name: string;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error('認証が必要です');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new Error('ユーザーが見つかりません');
  }

  // isActiveがtrueの場合、他の学期のisActiveをfalseにする
  if (data.isActive) {
    await prisma.semester.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });
  }

  const semester = await prisma.semester.create({
    data: {
      userId: user.id,
      year: data.year,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive || false,
    },
  });

  revalidatePath('/settings');
  revalidatePath('/subjects');
  return semester;
}

/**
 * 学期を更新
 */
export async function updateSemester(
  id: string,
  data: {
    year?: number;
    name?: string;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
  }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error('認証が必要です');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new Error('ユーザーが見つかりません');
  }

  // isActiveがtrueの場合、他の学期のisActiveをfalseにする
  if (data.isActive) {
    await prisma.semester.updateMany({
      where: { userId: user.id, id: { not: id } },
      data: { isActive: false },
    });
  }

  const semester = await prisma.semester.update({
    where: { id, userId: user.id },
    data,
  });

  revalidatePath('/settings');
  revalidatePath('/subjects');
  return semester;
}

/**
 * 学期を削除
 */
export async function deleteSemester(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error('認証が必要です');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new Error('ユーザーが見つかりません');
  }

  await prisma.semester.delete({
    where: { id, userId: user.id },
  });

  revalidatePath('/settings');
  revalidatePath('/subjects');
}

/**
 * すべての学期を取得
 */
export async function getSemesters() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error('認証が必要です');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new Error('ユーザーが見つかりません');
  }

  const semesters = await prisma.semester.findMany({
    where: { userId: user.id },
    orderBy: [{ year: 'desc' }, { name: 'asc' }],
    include: {
      _count: {
        select: { subjects: true },
      },
    },
  });

  return semesters;
}

/**
 * アクティブな学期を取得
 */
export async function getActiveSemester() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return null;
  }

  const semester = await prisma.semester.findFirst({
    where: { userId: user.id, isActive: true },
  });

  return semester;
}

/**
 * 学期をアクティブに設定
 */
export async function setActiveSemester(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error('認証が必要です');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new Error('ユーザーが見つかりません');
  }

  // すべての学期のisActiveをfalseにする
  await prisma.semester.updateMany({
    where: { userId: user.id },
    data: { isActive: false },
  });

  // 指定された学期をアクティブにする
  const semester = await prisma.semester.update({
    where: { id, userId: user.id },
    data: { isActive: true },
  });

  revalidatePath('/settings');
  revalidatePath('/subjects');
  revalidatePath('/');
  return semester;
}

/**
 * 現在の日付から学期を判定
 */
function getCurrentSemesterInfo(date: Date = new Date()): {
  year: number;
  name: string;
  startDate: Date;
  endDate: Date;
} {
  const month = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();

  // クォーター制の学期判定
  // 春1期: 4月〜5月
  // 春2期: 6月〜7月
  // 秋1期: 10月〜11月
  // 秋2期: 12月〜1月

  if (month >= 4 && month <= 5) {
    return {
      year,
      name: '春1期',
      startDate: new Date(year, 3, 1), // 4月1日
      endDate: new Date(year, 5, 0), // 5月末日
    };
  } else if (month >= 6 && month <= 7) {
    return {
      year,
      name: '春2期',
      startDate: new Date(year, 5, 1), // 6月1日
      endDate: new Date(year, 7, 0), // 7月末日
    };
  } else if (month >= 10 && month <= 11) {
    return {
      year,
      name: '秋1期',
      startDate: new Date(year, 9, 1), // 10月1日
      endDate: new Date(year, 11, 0), // 11月末日
    };
  } else if (month === 12 || month <= 1) {
    // 12月〜1月は秋2期
    const academicYear = month === 12 ? year : year - 1;
    return {
      year: academicYear,
      name: '秋2期',
      startDate: new Date(academicYear, 11, 1), // 12月1日
      endDate: new Date(academicYear + 1, 1, 0), // 1月末日
    };
  } else {
    // 8-9月、2-3月は次の学期の前期として扱う
    if (month >= 8 && month <= 9) {
      // 8-9月は次の秋1期の準備期間
      return {
        year,
        name: '秋1期',
        startDate: new Date(year, 9, 1), // 10月1日
        endDate: new Date(year, 11, 0), // 11月末日
      };
    } else {
      // 2-3月は次の春1期の準備期間
      return {
        year,
        name: '春1期',
        startDate: new Date(year, 3, 1), // 4月1日
        endDate: new Date(year, 5, 0), // 5月末日
      };
    }
  }
}

/**
 * 現在の学期を取得または作成（自動判定）
 */
export async function getOrCreateCurrentSemester(userId: string) {
  try {
    const semesterInfo = getCurrentSemesterInfo();

    // 該当する学期が既に存在するか確認
    let semester = await prisma.semester.findFirst({
      where: {
        userId,
        year: semesterInfo.year,
        name: semesterInfo.name,
      },
    });

    // 存在しない場合は作成
    if (!semester) {
      semester = await prisma.semester.create({
        data: {
          userId,
          year: semesterInfo.year,
          name: semesterInfo.name,
          startDate: semesterInfo.startDate,
          endDate: semesterInfo.endDate,
          isActive: true, // 新規作成時はアクティブに設定
        },
      });

      // 他の学期のisActiveをfalseにする
      await prisma.semester.updateMany({
        where: {
          userId,
          id: { not: semester.id },
        },
        data: { isActive: false },
      });

      revalidatePath('/settings');
      revalidatePath('/subjects');
    }

    return { success: true, data: semester };
  } catch (error) {
    console.error('Get or create current semester error:', error);
    return { success: false, error: '学期の取得または作成に失敗しました' };
  }
}
