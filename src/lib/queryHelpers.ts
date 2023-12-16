/*
  NOTE: Ideally this file would not be needed, but I am trying to only import
  typeorm within the podverse-orm. Still, there are other apps that still construct
  their own ORM queries using the getRepository function exported in podverse-orm.
  Ideally all of the ORM queries that other apps still use would get moved
  into podverse-orm, and then we can remove "getRepository" and these helpers
  as exports in podverse-orm.
*/

import { In as InORM, Not as NotORM } from 'typeorm'

export const In = InORM
export const Not = NotORM
