/**
 * データベース初期化スクリプト
 *
 * 実行方法:
 * npx tsx scripts/init-db.ts
 *
 * このスクリプトは以下を実行します:
 * 1. Prismaクライアントの生成
 * 2. データベースのプッシュ
 * 3. テストユーザーの作成
 */

import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🔧 データベースを初期化しています...")

  try {
    // テストユーザーの作成
    console.log("👤 テストユーザーを作成しています...")

    const existingUser = await prisma.user.findUnique({
      where: { email: "test@example.com" },
    })

    if (existingUser) {
      console.log("✅ テストユーザーは既に存在します")
    } else {
      const passwordHash = await hash("password123", 12)

      await prisma.user.create({
        data: {
          username: "testuser",
          email: "test@example.com",
          passwordHash,
          fullName: "テストユーザー",
        },
      })

      console.log("✅ テストユーザーを作成しました")
      console.log("   Email: test@example.com")
      console.log("   Password: password123")
    }

    // サンプルデータの作成（オプション）
    const user = await prisma.user.findUnique({
      where: { email: "test@example.com" },
    })

    if (user) {
      // サンプル科目の作成
      const subjectCount = await prisma.subject.count({
        where: { userId: user.id },
      })

      if (subjectCount === 0) {
        console.log("📚 サンプル科目を作成しています...")

        await prisma.subject.createMany({
          data: [
            {
              userId: user.id,
              name: "数学I",
              teacher: "佐藤先生",
              classroom: "A棟301",
              dayOfWeek: 1,
              period: 1,
              startTime: "09:00",
              endTime: "10:30",
              color: "#3B82F6",
            },
            {
              userId: user.id,
              name: "英語会話",
              teacher: "Smith先生",
              classroom: "B棟205",
              dayOfWeek: 1,
              period: 2,
              startTime: "10:40",
              endTime: "12:10",
              color: "#10B981",
            },
            {
              userId: user.id,
              name: "プログラミング基礎",
              teacher: "鈴木先生",
              classroom: "C棟コンピュータ室",
              dayOfWeek: 1,
              period: 3,
              startTime: "13:00",
              endTime: "14:30",
              color: "#8B5CF6",
            },
          ],
        })

        console.log("✅ サンプル科目を作成しました")
      }
    }

    console.log("🎉 データベースの初期化が完了しました!")
  } catch (error) {
    console.error("❌ エラーが発生しました:", error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
