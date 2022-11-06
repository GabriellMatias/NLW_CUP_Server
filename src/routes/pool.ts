import { prisma } from "./../lib/prisma";
import { FastifyInstance } from "fastify";
import ShortUniqueId from "short-unique-id";

import { z } from "zod";
import { authenticate } from "../plugins/authenticate";

export async function poolRoutes(fastify: FastifyInstance) {
  /* rota de contagem de bolao*/
  fastify.get("/pools/count", async () => {
    const count = await prisma.pool.count();

    return { count };
  });

  /* criando o bolao e validando a criacao do codigo dele*/
  fastify.post("/pools", async (request, reply) => {
    /* validando as entradas do DB*/
    const createPoolBody = z.object({
      title: z.string(),
    });

    const { title } = createPoolBody.parse(request.body);
    const generateId = new ShortUniqueId({ length: 6 });
    const code = String(generateId()).toUpperCase();

    try {
      /* se executar quer dizer que tem um user autencticado*/
      await request.jwtVerify();
      /* cria o bolao com o id do criador do bolao*/

      await prisma.pool.create({
        data: {
          title,
          code,
          ownerId: request.user.sub,
          participants: {
            create: {
              userId: request.user.sub,
            },
          },
        },
      });
    } catch (error) {
      /* se nao tem usuario autenticado, cria o bolar sem o ownerID*/

      await prisma.pool.create({
        data: {
          title,
          code,
        },
      });
    }

    return reply.status(201).send({ code });
  });

  fastify.post(
    "/pools/join",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const joinPoolBody = z.object({
        code: z.string(),
      });
      const { code } = joinPoolBody.parse(request.body);

      const pool = await prisma.pool.findUnique({
        where: {
          code,
        },
        include: {
          /* se houver um participante que tenha o msm id do dono, ele retorna dizendo que
        vc ja ta nesse bolao*/
          participants: {
            where: {
              userId: request.user.sub,
            },
          },
        },
      });
      if (!pool) {
        return reply.status(400).send({
          message: "Pool Not Found!",
        });
      }

      if (pool.participants.length > 0) {
        return reply.status(400).send({
          message: "You Already Join This Pool!",
        });
      }

      /* se o usuario nao tiver autenticado ele podde criar um bolao na WEB, entao para
    nao deixar o valor nulo, coloca-se a primeira pessoa que entrar no bolao como se fosse o 
    dono do bolao*/
      if (!pool.ownerId) {
        await prisma.pool.update({
          where: {
            id: pool.id,
          },
          data: {
            ownerId: request.user.sub,
          },
        });
      }

      await prisma.participants.create({
        data: {
          poolId: pool.id,
          userId: request.user.sub,
        },
      });
      return reply.status(201).send();
    }
  );

  fastify.get("/pools", { onRequest: [authenticate] }, async (request) => {
    /* se usar async sem await ele te retorna uma pool vazia*/
    const pools = await prisma.pool.findMany({
      where: {
        participants: {
          some: {
            userId: request.user.sub,
          },
        },
      },
      /* infos para jogar no front*/
      include: {
        /* contador de quantos participantes*/
        _count: {
          select: {
            participants: true,
          },
        },
        /* pegando a foto de 4 participantes aleatorios */
        participants: {
          select: {
            id: true,
            user: {
              select: {
                avatarUrl: true,
              },
            },
          },
          take: 4,
        },
        /* pegando id e nome dos participantes*/
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return { pools };
  });

  fastify.get(
    "/pools/:id",
    {
      onRequest: [authenticate],
    },
    async (request) => {
      const getpoolParams = z.object({
        id: z.string(),
      });
      const { id } = getpoolParams.parse(request.params);

      const pool = await prisma.pool.findUnique({
        
        where: {
          id,
        },
        /* infos para jogar no front*/
        include: {
          /* contador de quantos participantes*/
          _count: {
            select: {
              participants: true,
            },
          },
          /* pegando a foto de 4 participantes aleatorios */
          participants: {
            select: {
              id: true,
              user: {
                select: {
                  avatarUrl: true,
                },
              },
            },
            take: 4,
          },
          /* pegando id e nome dos participantes*/
          owner: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return { pool };
    }
  );
}
