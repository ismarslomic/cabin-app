import type { components } from '@/shared/api/schema.ts'

type Schemas = components['schemas']

export type Profile = Schemas['UserPrincipal']
export type AppRole = Profile['role']
export type Gender = Profile['gender']
export type ProfileUpdate = Schemas['MeUpdate']
