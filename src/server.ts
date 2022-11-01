import Fastify from "fastify";
import {PrismaClient} from '@prisma/client'
import cors from '@fastify/cors'

const prisma = new PrismaClient({
  log: ["query"]
})

async function bootstrap(){
   const fastify = Fastify({
    /* vai logando o que ta ocorrendo na aplicacao*/
    logger:true,
   })

   /* permite qualquer aplicacao acessar o back end, em producao coloca o dominio*/
   await fastify.register(cors, {
    origin:true
   })

   fastify.get('/pools/count', async ()=>{
    const count = await prisma.pool.count()
    
    return{count}
    
   })

   /* host para funcionar no mobile*/
   await fastify.listen({port:3333, host: '0.0.0.0'})
}

bootstrap()