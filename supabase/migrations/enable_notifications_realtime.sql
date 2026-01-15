-- Script para habilitar Realtime en la tabla notifications
-- Ejecutar este script si ya aplicaste la migración 20240101000010_notifications.sql
-- y necesitas habilitar Realtime después

-- Habilitar Realtime para la tabla notifications
alter publication supabase_realtime add table public.notifications;

-- Verificar que Realtime está habilitado (opcional, para verificación)
-- SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications';
