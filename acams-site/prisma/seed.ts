import { PrismaClient, Role, Source, Status } from "@prisma/client";

import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

async function main() {
  const execEmail = "exec.demo@crimson.ua.edu".toLowerCase();
  const password = await hashPassword("ChangeMe!2026");

  await prisma.user.upsert({
    where: { email: execEmail },
    create: {
      email: execEmail,
      name: "Demo Exec",
      hashedPassword: password,
      role: Role.EXEC,
      status: Status.VERIFIED,
      source: Source.SIGNUP,
      verifiedAt: new Date(),
    },
    update: {
      hashedPassword: password,
      role: Role.EXEC,
      status: Status.VERIFIED,
      source: Source.SIGNUP,
      verifiedAt: new Date(),
    },
  });

  const pending = [1, 2, 3].map(async (n) => {
    const email = `student${n}@crimson.ua.edu`.toLowerCase();
    return prisma.user.upsert({
      where: { email },
      create: {
        email,
        name: `Pending Student ${n}`,
        hashedPassword: await hashPassword("Pending!2026"),
        role: Role.MEMBER,
        status: Status.UNVERIFIED,
        source: Source.SIGNUP,
      },
      update: {
        status: Status.UNVERIFIED,
        hashedPassword: await hashPassword("Pending!2026"),
      },
    });
  });

  await Promise.all(pending);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
