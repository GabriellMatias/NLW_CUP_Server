import Fastify from "fastify";
import {PrismaClient} from '@prisma/client'
import cors from '@fastify/cors'
import {z}  from 'zod'
import ShortUniqueId from 'short-unique-id'

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

   /* rota de contagem de bolao*/
   fastify.get('/pools/count', async ()=>{
    const count = await prisma.pool.count()
    
    return{count}
    
   })

   /* rota de contagem de usuarios*/
   fastify.get('/users/count', async ()=>{
    const count = await prisma.user.count()
    
    return{count}
    
   })
   

    /* rota de contagem de apostas (Guesss)*/
   fastify.get('/guesses/count', async ()=>{
    const count = await prisma.guess.count()
    
    return{count}
    
   })

   /* criando o bolao e validando a criacao do codigo dele*/
   fastify.post('/pools', async (request, reply)=>{

    /* validando as entradas do DB*/
    const createPoolBody = z.object({
      title: z.string(),

    })


    const {title} = createPoolBody.parse(request.body)
    const generateId = new ShortUniqueId({length:6})
    const code = String(generateId()).toUpperCase()


    await prisma.pool.create({
      data:{
        title,
        code,
      }
    })

    return reply.status(201).send({code})
    
   })

   /* host para funcionar no mobile*/
   await fastify.listen({port:3333, host: '0.0.0.0'})
}

bootstrap()