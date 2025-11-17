export default function Home() {
  return (
    <div className="min-h-screen bg-secondary text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="flex items-center mb-8">
            <svg className="h-24 w-24 lightning-logo" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="11" fill="#FFD100"></circle>
              <circle cx="12" cy="12" r="9" fill="#1A1A1A"></circle>
              <path d="M13 6L7 14h4v4l6-8h-4V6z" fill="#FFD100"></path>
            </svg>
          </div>
          <h1 className="text-6xl font-bold mb-4">
            Pede<span className="text-primary">Aí</span>
          </h1>
          <p className="text-2xl text-gray-300 mb-8">
            Delivery local para sua cidade
          </p>
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg">
            ✅ Next.js 14 configurado com sucesso!
          </div>
        </div>
      </div>
    </div>
  );
}
