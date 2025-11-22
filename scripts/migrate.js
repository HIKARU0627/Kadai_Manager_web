const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('Applying migration: add_file_sakai_fields');

    // SQLiteではALTER TABLE ADD COLUMNは1つずつ実行する必要がある
    await prisma.$executeRawUnsafe(`
      ALTER TABLE files ADD COLUMN sakaiRef TEXT;
    `);
    console.log('Added sakaiRef column');

    await prisma.$executeRawUnsafe(`
      ALTER TABLE files ADD COLUMN sakaiUrl TEXT;
    `);
    console.log('Added sakaiUrl column');

    await prisma.$executeRawUnsafe(`
      ALTER TABLE files ADD COLUMN fileSource TEXT DEFAULT 'local';
    `);
    console.log('Added fileSource column');

    console.log('Migration applied successfully!');
  } catch (error) {
    console.error('Migration error:', error.message);
    // エラーでもカラムが既に存在する場合は問題なし
    if (error.message.includes('duplicate column name')) {
      console.log('Columns already exist, skipping migration');
    } else {
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
