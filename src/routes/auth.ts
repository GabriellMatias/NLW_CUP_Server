import { FastifyInstance } from "fastify";
import { z } from "zod";
import fetch from "node-fetch";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";

export async function authRoutes(fastify: FastifyInstance) {
  /* quando a rota ME foi chamada, ele vai executar antes o autheticate pra autenticar o usuario
  se nao autenticar ele nao roda o resto do codigo*/
  fastify.get(
    "/me",
    {
      onRequest: [authenticate],
    },
    async (request) => {
      return { user: request.user };
    }
  );

  fastify.post("/users", async (request) => {
    /* validando dados antes de mandar pro banco de dados*/
    const createUserBody = z.object({
      access_token: z.string(),
    });
    const { access_token } = createUserBody.parse(request.body);

    /* chama a API do google e envia o acess token que veio do mobile, sendo assim ele entende
    quem ta logado */
    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const userData = await userResponse.json();
    const userInfoSchema = z.object({
      id: z.string(),
      email: z.string().email(),
      name: z.string(),
      picture: z.string().url(),
    });

    const userInfo = userInfoSchema.parse(userData);
    console.log(userInfo);

    let user = await prisma.user.findUnique({
      where: {
        googleId: userInfo.id,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId: userInfo.id,
          name: userInfo.name,
          email: userInfo.email,
          avatarUrl: userInfo.picture,
        },
      });
    }

    /* cria token do usuario pra saber o que ele ta fazendo no back end, 
    se tiver fazendo um bolao eu vou saber qual usuario fez e qual quis participar*/
    const token = fastify.jwt.sign(
      {
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      {
        sub: user.id,
        expiresIn: "7 days",
      }
    );

    return { token };
  });
}
