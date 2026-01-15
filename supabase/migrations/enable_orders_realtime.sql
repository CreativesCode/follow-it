-- Script para habilitar Realtime en la tabla orders
-- Ejecutar este script si necesitas habilitar Realtime después de crear la tabla

-- Habilitar Realtime para la tabla orders
alter publication supabase_realtime add table public.orders;

-- Verificar que Realtime está habilitado (opcional, para verificación)
-- SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'orders';
