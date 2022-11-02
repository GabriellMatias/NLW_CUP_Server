import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      name: "Jhonny",
      email: "matiasss@gmail.com",
      avatarUrl: "https://github.com/GabriellMatias.png",
    },
  });

  const pool = await prisma.pool.create({
    data: {
      title: "Example",
      code: "BOL123",
      ownerId: user.id,

      participants: {
        create: {
          userId: user.id,
        },
      },
    },
  });

  //criando game sem palpite
  await prisma.game.create({
    data: {
      // vai no navegador e coloca new Date().ToISOString()
      date: "2022-11-01T21:57:43.730Z",
      firstTeamCountryCode: "DE",
      secondTeamCountryCode: "BR",
    },
  });

  await prisma.game.create({
    data: {
      date: "2022-12-01T21:57:43.730Z",
      firstTeamCountryCode: "DE",
      secondTeamCountryCode: "AR",

      guesses: {
        create: {
          firstTeamPoints: 2,
          secondTeamPoints: 3,
          participant: {
            connect: {
              userId_poolId: {
                userId: user.id,
                poolId: pool.id,
              },
            },
          },
        },
      },
    },
  });
}

main();
