import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      email: "test1@example.com",
      password: "123456",
    },
  });

  console.log("New User:", user);

  const users = await prisma.user.findMany();
  console.log("All Users:", users);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
