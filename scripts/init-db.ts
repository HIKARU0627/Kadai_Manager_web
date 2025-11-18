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

  console.log("テストユーザーを作成しました:")
  console.log("ID:", testUser.id)
  console.log("Email: test@example.com")
  console.log("Password: password123")
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
