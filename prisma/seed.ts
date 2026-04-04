import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.user.findUnique({
    where: { username: "Gribadan" },
  });

  const hashedPassword = await bcrypt.hash("Ltvfrjd22!", 10);

  if (!existing) {
    await prisma.user.create({
      data: {
        username: "Gribadan",
        password: hashedPassword,
        role: "superadmin",
      },
    });
    console.log("Super admin created: Gribadan");
  } else {
    await prisma.user.update({
      where: { username: "Gribadan" },
      data: { password: hashedPassword },
    });
    console.log("Super admin password updated");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
