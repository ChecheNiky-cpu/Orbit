// =============================================
//  ORBIT — Configuración de Supabase
//
//  La anon key es PÚBLICA por diseño: viaja al navegador en cualquier
//  despliegue, y tus datos quedan protegidos por las políticas RLS de
//  Supabase (asegúrate de tenerlas ACTIVAS).
//
//  Para usar otro proyecto en local sin tocar este archivo, crea
//  `config.local.js` (ignorado por git); se carga después y sobreescribe.
//
//  Valores en: Supabase → Settings → API (Project URL y anon public key).
// =============================================

window.ORBIT_CONFIG = {
    SUPABASE_URL: 'https://byxqbvsjgmmhvaxbaksc.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5eHFidnNqZ21taHZheGJha3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNzc2MDYsImV4cCI6MjA5ODk1MzYwNn0.hv-4HvcqDUyjXl9ZR_uikbABNEIMTuF212yGYHBcyYE',
};
