import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.user.findUnique({
    where: { username: "Gribadan" },
  });

  if (!existing) {
    const hashedPassword = await bcrypt.hash("Letvfrjd22!", 10);
    await prisma.user.create({
      data: {
        username: "Gribadan",
        password: hashedPassword,
        role: "superadmin",
      },
    });
    console.log("Super admin created: Gribadan");
  } else {
    console.log("Super admin already exists");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
