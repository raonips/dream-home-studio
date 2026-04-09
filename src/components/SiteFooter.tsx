import { MapPin, Phone, Mail, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import logoDefault from "@/assets/site-logo-imoveis-barra-do-jacuipe.webp";

const SiteFooter = () => {
  const { whatsapp_number, instagram_url } = useSiteSettings();
  const phone = whatsapp_number || '5571991089039';
  const phoneFormatted = phone.replace(/^55(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');

  return (
    <footer id="contato" className="bg-navy text-primary-foreground">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="mb-4">
              <img src={logoDefault} alt="Imóveis Barra do Jacuípe" className="h-12 max-w-[180px] object-contain brightness-0 invert" width={180} height={48} />
            </div>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              Seu portal de imóveis exclusivos no Litoral Norte da Bahia. 
              Casas de alto padrão, sítios e condomínios com assessoria completa.
            </p>
          </div>

          <div>
            <h2 className="font-display text-base font-semibold mb-4">Principais Buscas</h2>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/vendas?minPrice=800000" className="hover:text-primary transition-colors">Imóveis de Alto Padrão</Link></li>
              <li><Link to="/condominios" className="hover:text-primary transition-colors">Condomínio em Barra do Jacuípe</Link></li>
              <li><Link to="/condominio/casas-soltas-e-terrenos-independentes-barra-do-jacuipe" className="hover:text-primary transition-colors">Casas Soltas</Link></li>
              <li><Link to="/vendas?tipo=terreno" className="hover:text-primary transition-colors">Terrenos à Venda</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-base font-semibold mb-4">Condomínios em Destaque</h2>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/condominio/condominio-canto-do-sol" className="hover:text-primary transition-colors">Condomínio Canto do Sol</Link></li>
              <li><Link to="/condominio/condominio-parque-do-jacuipe" className="hover:text-primary transition-colors">Condomínio Parque do Jacuípe</Link></li>
              <li><Link to="/condominio/imoveis-a-venda-no-villas-do-jacuipe-casas-com-acesso-ao-rio-e-alto-padrao" className="hover:text-primary transition-colors">Condomínio Villas do Jacuípe</Link></li>
              <li><Link to="/condominio/condominio-aldeias-do-jacuipe" className="hover:text-primary transition-colors">Condomínio Aldeias do Jacuípe</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-base font-semibold mb-4">Contato</h2>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  {phoneFormatted || phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                imoveis@barradojacuipe.com.br
              </li>
              {instagram_url &&
              <li className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-primary" />
                  <a href={instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    Instagram
                  </a>
                </li>
              }
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                Barra do Jacuípe, Camaçari — BA
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-10 pt-6 text-center text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} Imóveis Barra do Jacuípe. Todos os direitos reservados.
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> | </span>
          Atendimento oficial por Amar Imóvel Consultoria Imobiliária LTDA | CNPJ: 39.678.821/0001-17 | CRECI-08556
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
