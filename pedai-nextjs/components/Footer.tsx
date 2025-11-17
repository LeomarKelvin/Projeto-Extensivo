import Link from 'next/link'
import Logo from './Logo'
import type { TenantConfig } from '@/lib/types/tenant'

interface FooterProps {
  tenant?: TenantConfig
}

export default function Footer({ tenant }: FooterProps) {
  const currentYear = new Date().getFullYear()
  const municipioName = tenant?.name || 'sua cidade'
  
  // Build tenant-aware URLs (all routes maintain tenant context)
  const basePath = tenant ? `/${tenant.slug}` : ''
  const homeUrl = basePath || '/'
  const lojasUrl = `${basePath}/lojas`
  const cadastroUrl = `${basePath}/auth/cadastro`
  const lojaCadastroUrl = `${basePath}/loja/cadastro`
  const sobreUrl = `${basePath}/sobre`
  const termosUrl = `${basePath}/termos`
  const privacidadeUrl = `${basePath}/privacidade`
  const faqUrl = `${basePath}/faq`

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo e descrição */}
          <div className="col-span-1 md:col-span-2">
            <Logo tenant={tenant} className="mb-4" />
            <p className="text-gray-400 mb-4">
              Delivery local para {municipioName}. Comida, remédios, compras e muito mais, 
              entregue rápido na sua porta.
            </p>
            {tenant && (
              <div className="text-sm text-gray-500">
                <p>📞 {tenant.contact.phone}</p>
                <p>📧 {tenant.contact.email}</p>
              </div>
            )}
          </div>

          {/* Links úteis */}
          <div>
            <h3 className="font-bold text-lg mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href={homeUrl} className="text-gray-400 hover:text-primary transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link href={lojasUrl} className="text-gray-400 hover:text-primary transition-colors">
                  Lojas
                </Link>
              </li>
              <li>
                <Link href={cadastroUrl} className="text-gray-400 hover:text-primary transition-colors">
                  Cadastre-se
                </Link>
              </li>
              <li>
                <Link href={lojaCadastroUrl} className="text-gray-400 hover:text-primary transition-colors">
                  Seja um Parceiro
                </Link>
              </li>
            </ul>
          </div>

          {/* Informações */}
          <div>
            <h3 className="font-bold text-lg mb-4">Informações</h3>
            <ul className="space-y-2">
              <li>
                <Link href={sobreUrl} className="text-gray-400 hover:text-primary transition-colors">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link href={termosUrl} className="text-gray-400 hover:text-primary transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href={privacidadeUrl} className="text-gray-400 hover:text-primary transition-colors">
                  Privacidade
                </Link>
              </li>
              <li>
                <Link href={faqUrl} className="text-gray-400 hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Linha divisória e copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; {currentYear} PedeAí. Todos os direitos reservados.</p>
          {tenant && (
            <p className="mt-2">Atendendo {tenant.name} - {tenant.state}</p>
          )}
        </div>
      </div>
    </footer>
  )
}
