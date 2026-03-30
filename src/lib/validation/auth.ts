import { z } from 'zod'

export const appCodeEnum = z.enum(['erp', 'oa', 'bi'])

export const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string(),
})

export type LoginFormValues = z.infer<typeof loginSchema>
