import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("データベースを初期化しています...")

  // Check if test user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: "test@example.com" },
  })

  if (existingUser) {
    console.log("テストユーザーは既に存在します")
    console.log("Email: test@example.com")
    console.log("Password: password123")
    return
  }

  // Create test user
  const hashedPassword = await bcrypt.hash("password123", 10)

  const testUser = await prisma.user.create({
    data: {
      username: "testuser",
      email: "test@example.com",
      passwordHash: hashedPassword,
      fullName: "テストユーザー",
    },
  })

  // デフォルトのEventTypeを作成
  await prisma.eventType.createMany({
    data: [
      {
        userId: testUser.id,
        name: "予定",
        value: "event",
        color: "#10B981",
        isDefault: true,
        order: 0,
      },
      {
        userId: testUser.id,
        name: "テスト",
        value: "test",
        color: "#EF4444",
        isDefault: true,
        order: 1,
      },
    ],
  })

  console.log("テストユーザーを作成しました:")
  console.log("ID:", testUser.id)
  console.log("Email: test@example.com")
  console.log("Password: password123")
  console.log("\nデフォルトのイベントタイプを作成しました:")
  console.log("- 予定 (event)")
  console.log("- テスト (test)")
  console.log("\nログインページ: http://localhost:3000/login")
  console.log("新規登録ページ: http://localhost:3000/signup")
}

main()
  .catch((e) => {
    console.error("エラーが発生しました:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
