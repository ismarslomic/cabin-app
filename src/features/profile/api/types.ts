import type { components } from '@/shared/api/schema.ts'

type Schemas = components['schemas']

export type AppRole = Schemas['UserPrincipal']['role']
export type Gender = Schemas['Guest']['gender']
export type ProfileUpdate = Pick<
  Required<Schemas['GuestUpdate']>,
  'firstName' | 'lastName' | 'birthYear' | 'gender'
>

// GET /api/me returns a UserPrincipal today. The backend will add the guest fields below; replace
// this type with the generated one (`pnpm sync-api-spec`) when the spec has them.
export type Profile = Schemas['UserPrincipal'] &
  Pick<Schemas['Guest'], 'firstName' | 'lastName' | 'birthYear' | 'gender' | 'isFamily'>
