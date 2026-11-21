import type { components } from '@/shared/api/schema.ts'

type Schemas = components['schemas']

export type Profile = Schemas['MeResponse']
export type AppRole = Profile['role']
export type Gender = Profile['gender']
/** What the user edits. The `version` is not part of it: the store keeps it and the API sends it. */
export type ProfileUpdate = Omit<Schemas['MeUpdate'], 'version'>
