// Stub para evitar crash del Metro bundler
// Se debe remover subsecuentemente cuando se migren las vistas restantes como AdminDashboardScreen
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signOut: async () => ({ error: null })
  },
  from: () => ({
    select: () => ({
      data: [], error: null, count: 0, order: () => ({ limit: () => ({ data: [] }) })
    }),
    update: () => ({ eq: () => ({ select: () => ({ limit: () => ({ error: null }) }) }) }),
    insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
    delete: () => ({ eq: () => ({ select: () => ({ data: [], error: null }) }) })
  })
};
