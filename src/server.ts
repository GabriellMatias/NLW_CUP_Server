import Fastify from "fastify";
import cors from '@fastify/cors'
import jwt from "@fastify/jwt";
import { poolRoutes } from "./routes/pool";
import { authRoutes } from "./routes/auth";
import { guessRoutes } from "./routes/guess";
import { usersRoutes } from "./routes/users";
import { gameRoutes } from "./routes/game";



async function bootstrap(){
   const fastify = Fastify({
    /* vai logando o que ta ocorrendo na aplicacao*/
    logger:true,
   })

   /* permite qualquer aplicacao acessar o back end, em producao coloca o dominio*/
   await fastify.register(cors, {
    origin:true
   })

   /* EM PRODUCAO DEVE SER UMA VARIAVEL AMBIENTE PRA NAO FICAR NO CODIGO*/
   await fastify.register(jwt,{
      secret: "nlwcopa"
   })

   /* rota de contagem de boloes*/
  await fastify.register(poolRoutes)
  await fastify.register(authRoutes)
  await fastify.register(guessRoutes)
  await fastify.register(usersRoutes)
  await fastify.register(gameRoutes) 
   



   /* host para funcionar no mobile*/
   await fastify.listen({port:3333, host: '0.0.0.0'})
}

bootstrap()