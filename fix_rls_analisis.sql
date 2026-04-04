-- ================================================================
-- LUMEX: Políticas RLS para tablas de análisis de datos
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. modelos
ALTER TABLE public.modelos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lumex_modelos_select" ON public.modelos;
DROP POLICY IF EXISTS "lumex_modelos_insert" ON public.modelos;

CREATE POLICY "lumex_modelos_select" ON public.modelos
  FOR SELECT TO public USING (true);

CREATE POLICY "lumex_modelos_insert" ON public.modelos
  FOR INSERT TO public WITH CHECK (true);

-- 2. datasets
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lumex_datasets_select" ON public.datasets;
DROP POLICY IF EXISTS "lumex_datasets_insert" ON public.datasets;

CREATE POLICY "lumex_datasets_select" ON public.datasets
  FOR SELECT TO public USING (true);

CREATE POLICY "lumex_datasets_insert" ON public.datasets
  FOR INSERT TO public WITH CHECK (true);

-- 3. analisis
ALTER TABLE public.analisis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lumex_analisis_select" ON public.analisis;
DROP POLICY IF EXISTS "lumex_analisis_insert" ON public.analisis;

CREATE POLICY "lumex_analisis_select" ON public.analisis
  FOR SELECT TO public USING (true);

CREATE POLICY "lumex_analisis_insert" ON public.analisis
  FOR INSERT TO public WITH CHECK (true);

-- 4. resultados
ALTER TABLE public.resultados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lumex_resultados_select" ON public.resultados;
DROP POLICY IF EXISTS "lumex_resultados_insert" ON public.resultados;

CREATE POLICY "lumex_resultados_select" ON public.resultados
  FOR SELECT TO public USING (true);

CREATE POLICY "lumex_resultados_insert" ON public.resultados
  FOR INSERT TO public WITH CHECK (true);

-- ================================================================
-- Verificación: debe devolver filas para cada tabla con 2 políticas
-- ================================================================
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('modelos', 'datasets', 'analisis', 'resultados')
ORDER BY tablename, cmd;
