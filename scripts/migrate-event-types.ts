import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("既存ユーザーにデフォルトのイベントタイプを追加しています...")

  // すべてのユーザーを取得
  const users = await prisma.user.findMany({
    select: { id: true, username: true },
  })

  console.log(`${users.length}人のユーザーが見つかりました`)

  for (const user of users) {
    // 既にイベントタイプが存在するかチェック
    const existingTypes = await prisma.eventType.count({
      where: { userId: user.id },
    })

    if (existingTypes > 0) {
      console.log(`  ✓ ${user.username}: イベントタイプが既に存在します (${existingTypes}件)`)
      continue
    }

    // デフォルトのイベントタイプを作成
    await prisma.eventType.createMany({
      data: [
        {
          userId: user.id,
          name: "予定",
          value: "event",
          color: "#10B981",
          isDefault: true,
          order: 0,
        },
        {
          userId: user.id,
          name: "テスト",
          value: "test",
          color: "#EF4444",
          isDefault: true,
          order: 1,
        },
      ],
    })

    console.log(`  ✓ ${user.username}: デフォルトのイベントタイプを作成しました`)
  }

  console.log("\nマイグレーション完了!")
}

main()
  .catch((e) => {
    console.error("エラーが発生しました:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
