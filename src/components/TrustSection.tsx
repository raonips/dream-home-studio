import { ShieldCheck, Handshake, Key } from "lucide-react";

const TrustSection = () => {
  return (
    <section className="py-16 md:py-20 bg-warm-gray">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-5" />
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
            Assessoria Imobiliária Completa e Transparente
          </h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-8">
            Operação garantida pela <strong className="text-foreground">Amar Imóvel Consultoria Imobiliária LTDA</strong> (CRECI-08556). 
            Acompanhamos você do primeiro contato até a entrega das chaves, com total segurança jurídica e documental.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg mx-auto">
            <div className="flex items-center gap-3 bg-background rounded-xl p-4 shadow-card">
              <Handshake className="h-8 w-8 text-accent flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-foreground text-sm">Negociação Segura</p>
                <p className="text-xs text-muted-foreground">Contratos revisados por advogados</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-background rounded-xl p-4 shadow-card">
              <Key className="h-8 w-8 text-primary flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-foreground text-sm">Entrega Garantida</p>
                <p className="text-xs text-muted-foreground">Do contato às chaves na sua mão</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
