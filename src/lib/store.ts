import { create } from 'zustand'
import { OrganizacionGenerada } from './types'

interface OrgStore {
  actual: OrganizacionGenerada | null
  setActual: (org: OrganizacionGenerada | null) => void
}

export const useOrgStore = create<OrgStore>((set) => ({
  actual: null,
  setActual: (org) => set({ actual: org }),
}))
