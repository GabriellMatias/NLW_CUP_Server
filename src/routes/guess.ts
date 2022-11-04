import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";

export async function guessRoutes(fastify: FastifyInstance) {
  /* rota de contagem de apostas (Guesss)*/
  fastify.get("/guesses/count", async () => {
    const count = await prisma.guess.count();

    return { count };
  });

  fastify.post(
    "/pools/:poolId/games/:gameId/guesses",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const createGuessParams = z.object({
        poolId: z.string(),
        gameId: z.string(),
      });

      const createGuessBody = z.object({
        firstTeamPoints: z.number(),
        secondTeamPoints: z.number(),
      });

      const { poolId, gameId } = createGuessParams.parse(request.params);
      const { firstTeamPoints, secondTeamPoints } = createGuessBody.parse(
        request.body
      );

      const participant = await prisma.participants.findUnique({
        where: {
          userId_poolId: {
            poolId,
            userId: request.user.sub,
          },
        },
      });

      /* se nao retornar nada quer izer que o usuario nao faz parte desse bolao e nao pode 
      criar um guess nesse bolao*/
      if (!participant) {
        return reply.status(400).send({
          message: "You are not allower to create a guess inside this pool",
        });
      }
      /* nao deixar o usuario criar masi que um guess dentro do mesmo bolao*/
      const guess = await prisma.guess.findUnique({
        where: {
          participantsId_gameId: {
            participantsId: participant.id,
            gameId
          },
        },
      });

      if(guess){
        return reply.status(400).send({
          message:"u already sent a guess to this pool"
        })
      }


      const game = await prisma.game.findUnique({
        where:{
          id: gameId
        }
      })

      if(!game){
        return reply.status(400).send({
          message:"game Not found"
        })
      }
      if(game.date < new Date()){
        return reply.status(400).send({
          message: " u cannot send guesses after the game"
        })
      }

      await prisma.guess.create({
        data:{
          gameId,
          participantsId : participant.id,
          firstTeamPoints,
          secondTeamPoints
        }
      })

      return reply.status(201).send()
    }
  );
}
