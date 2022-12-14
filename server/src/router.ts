import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import { startRequest, solveCaptchaAndSubmit } from './guest-request'

const t = initTRPC.create()

export const appRouter = t.router({
  start: t.procedure
    .input(
      z.object({
        student: z.object({
          id: z.string(),
          fullName: z.string(),
          phone: z.string(),
          dorm: z.enum(['מעונות איינשטיין', 'מעונות ברושים']),
          building: z.string(),
          floor: z.string(),
          apartmentNumber: z.string(),
          side: z.enum(['ימין', 'שמאל']),
        }),
        category: z.enum(['פניות בנושא מבקרים', 'פניות בנושא לינה']),
        guest: z.object({
          id: z.string(),
          fullName: z.string(),
          phone: z.string(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const id = await startRequest(input)
      return {
        id,
        captchaImgPath: `/captchas/${id}.png`,
      }
    }),

  solve: t.procedure
    .input(
      z.object({
        id: z.string(),
        answer: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const msg = await solveCaptchaAndSubmit(input.id, input.answer)
      return msg
    }),
})

export type AppRouter = typeof appRouter
