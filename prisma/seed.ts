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
