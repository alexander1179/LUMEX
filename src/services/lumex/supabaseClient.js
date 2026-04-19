// src/services/lumex.js
// STUB: Este archivo existe temporalmente para evitar que archivos grandes
// como AdminDashboardScreen.js crasheen el paquete Metro al no encontrar Supabase.
// Toda la funcionalidad real se está moviendo a src/services/lumex/

export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: { user: null }, error: new Error('Usar API de MySQL') }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ data: { user: null } }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({ maybeSingle: () => ({ data: null, error: null }), order: () => ({ maybeSingle: () => ({ data: null, error: null }) }) }),
      order: () => ({ limit: () => ({ data: [], error: null }) }),
      maybeSingle: () => ({ data: null, error: null })
    }),
    insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
    update: () => ({ eq: () => ({ error: null }) }),
    delete: () => ({ eq: () => ({ error: null }) }),
    rpc: () => ({ data: null, error: null })
  })
};
