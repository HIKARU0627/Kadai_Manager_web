'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
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
