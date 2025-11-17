export default function NotFound() {
  return (
    <div className="min-h-screen bg-secondary text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl mb-4">Município não encontrado</h2>
        <p className="text-gray-400 mb-8">
          Este município ainda não está disponível no PedeAí.
        </p>
        <a
          href="/tenants"
          className="inline-block bg-primary text-secondary px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Ver municípios disponíveis
        </a>
      </div>
    </div>
  )
}
