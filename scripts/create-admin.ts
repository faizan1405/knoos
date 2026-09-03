import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error("Usage: npm run create-admin <email> <password>");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error(`User with email ${email} already exists. Refusing to overwrite.`);
    process.exit(1);
  }

  const hash = await bcryptjs.hash(password, 12);
  
  await prisma.user.create({
    data: {
      email,
      password: hash,
      role: "ADMIN",
      name: "Store Admin",
    }
  });

  console.log("Admin user created successfully.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
