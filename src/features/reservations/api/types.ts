import type { components } from '@/shared/api/schema.ts'

type Schemas = components['schemas']

export type Guest = Schemas['GuestResponse']
export type Reservation = Schemas['ReservationResponse']
export type ReservationCreate = Schemas['ReservationCreate']
