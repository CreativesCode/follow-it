"use client";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";

function Header() {
  const { user, userLoading } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/">
              <Image
                src="/logo_horizontal.svg"
                alt="Follow It"
                width={150}
                height={40}
                className="h-8 w-auto"
                priority
              />
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {userLoading ? (
              <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
            ) : user ? (
              <Link href="/dashboard">
                <Button>Ir a Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">Iniciar Sesión</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Comenzar Gratis</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default function PreciosPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 via-white to-secondary-50">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Planes y Precios
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Planes simples para negocios reales. Paga solo por los mensajeros
              que usas.
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 text-green-700 rounded-full text-base font-medium">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Primer mes gratis para nuevos usuarios
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans Detailed */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            {/* Plan Básico */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 hover:border-green-300 hover:shadow-xl transition-all duration-300">
              <div className="mb-6">
                <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
                  Plan Básico
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Para entrar sin miedo
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  Ideal para pequeños negocios
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">300</span>
                  <span className="text-gray-600 ml-2">CUP/mes</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">1 negocio</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">Hasta 2 mensajeros</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">Entregas ilimitadas</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">Tracking en tiempo real</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">
                    Comprobante simple (foto)
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">
                    Panel web + app mensajero
                  </span>
                </li>
              </ul>
              <Link href="/auth/register">
                <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white">
                  Comenzar Gratis
                </Button>
              </Link>
            </div>

            {/* Plan Negocio - Destacado */}
            <div className="bg-linear-to-br from-primary-600 to-secondary-600 rounded-2xl border-2 border-primary-500 p-8 transform scale-105 shadow-2xl relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-bold">
                  ⭐ MÁS POPULAR
                </span>
              </div>
              <div className="mb-6 mt-4">
                <div className="inline-block px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium mb-4">
                  Plan Negocio
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  El más vendido
                </h3>
                <p className="text-white/90 text-sm mb-6">
                  Ideal para restaurantes y mensajería diaria
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">600</span>
                  <span className="text-white/90 ml-2">CUP/mes</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-yellow-300 mr-3 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-white">1 negocio</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-yellow-300 mr-3 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-white">Hasta 5 mensajeros</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-yellow-300 mr-3 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-white">Todo lo del Básico</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-yellow-300 mr-3 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-white">Historial de entregas</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-yellow-300 mr-3 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-white">
                    Tracking para clientes (link)
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-yellow-300 mr-3 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-white">Notificaciones</span>
                </li>
              </ul>
              <Link href="/auth/register">
                <Button className="w-full bg-white! text-primary-600! hover:bg-gray-100! font-semibold">
                  Comenzar Gratis
                </Button>
              </Link>
            </div>

            {/* Plan Pro */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 hover:border-purple-300 hover:shadow-xl transition-all duration-300">
              <div className="mb-6">
                <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
                  Plan Pro
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Para los que ya crecieron
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  Ideal para negocios con flota pequeña
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">1000</span>
                  <span className="text-gray-600 ml-2">CUP/mes</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-purple-500 mr-3 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">1 negocio</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-purple-500 mr-3 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">Hasta 10-15 mensajeros</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-purple-500 mr-3 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">Todo lo anterior</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-purple-500 mr-3 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">
                    Roles (admin / operador)
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-purple-500 mr-3 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">Reportes simples</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-purple-500 mr-3 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">Soporte prioritario</span>
                </li>
              </ul>
              <Link href="/auth/register">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  Comenzar Gratis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Add-ons Section */}
      <section className="py-16 bg-linear-to-br from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Opciones Adicionales
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Personaliza tu plan según tus necesidades. Estos add-ons se venden
              cuando el cliente ya confía.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Mensajero Adicional
              </h3>
              <p className="text-gray-600 mb-4">
                Agrega más mensajeros a tu plan cuando lo necesites
              </p>
              <div className="text-2xl font-bold text-gray-900">
                100 CUP / mes
              </div>
              <p className="text-sm text-gray-500 mt-2">por mensajero</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Marca Blanca
              </h3>
              <p className="text-gray-600 mb-4">
                Quita &quot;Powered by Follow It&quot; y personaliza la marca
              </p>
              <div className="text-2xl font-bold text-gray-900">
                +500 CUP / mes
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Disponible próximamente
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Hosting / Soporte Local
              </h3>
              <p className="text-gray-600 mb-4">
                Para negocios menos técnicos que necesitan ayuda adicional
              </p>
              <div className="text-2xl font-bold text-gray-900">
                Precio negociado
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Contacta para más info
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Growth Strategy Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Cómo Crecer con Follow It
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Nuestra estrategia está diseñada para que empieces fácil y crezcas
              sin complicaciones
            </p>
          </div>
        </div>
      </section>

      {/* Payment Options */}
      <section className="py-16 bg-linear-to-br from-primary-50 to-secondary-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Opciones de Pago
              </h2>
              <p className="text-xl text-gray-600">
                Flexibilidad para adaptarnos a tu negocio
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-primary-300 transition-colors">
                <div className="flex items-center mb-4">
                  <svg
                    className="w-8 h-8 text-primary-600 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-900">Mensual</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Pago mensual por defecto. Simple y sin compromisos.
                </p>
                <div className="text-sm text-gray-500">
                  Ideal para empezar y probar el servicio
                </div>
              </div>

              <div className="border-2 border-green-500 rounded-xl p-6 bg-green-50 relative">
                <div className="absolute -top-3 right-4">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    RECOMENDADO
                  </span>
                </div>
                <div className="flex items-center mb-4">
                  <svg
                    className="w-8 h-8 text-green-600 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-900">Anual</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Descuento fuerte: 2 meses gratis al pagar anual.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-linear-to-r from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            ¿Listo para comenzar?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Únete a cientos de negocios que ya están optimizando sus repartos
            con Follow It. Primer mes gratis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button
                variant="ghost"
                size="lg"
                className="bg-white! text-primary-600! hover:bg-gray-100! shadow-lg! text-lg px-8 py-4 font-semibold hover:scale-105 transition-all duration-200"
              >
                Comenzar Gratis
              </Button>
            </Link>
            <Link href="/">
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-4 border-2 border-white bg-white/10 backdrop-blur-sm text-white hover:bg-white hover:text-primary-600 transition-all duration-200 font-semibold"
              >
                Volver al Inicio
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-center md:items-start">
              <Link href="/" className="inline-block mb-4">
                <Image
                  src="/logo_horizontal.svg"
                  alt="Follow It"
                  width={150}
                  height={40}
                  className="h-8 w-auto"
                />
              </Link>
              <p className="text-gray-600 text-sm text-center md:text-left max-w-md">
                La solución completa para gestionar tus repartos de manera
                profesional y eficiente.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <Link href="/auth/login">
                <Button
                  variant="ghost"
                  className="text-gray-700 hover:text-primary-600"
                >
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                  Comenzar Gratis
                </Button>
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 mt-8 text-center">
            <p className="text-gray-500 text-sm">
              &copy; 2026 Follow It. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
