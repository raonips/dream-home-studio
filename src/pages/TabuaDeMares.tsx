import { Helmet } from "react-helmet-async";
import { Waves, Info, Calendar, MapPin } from "lucide-react";
import { TodayTideCard } from "@/components/tides/TodayTideCard";

const TabuaDeMares = () => {
  return (
    <>
      <Helmet>
        <title>Tábua de Marés Hoje — Barra do Jacuípe e Litoral Norte | BA</title>
        <meta
          name="description"
          content="Tábua de marés descomplicada para Barra do Jacuípe e Litoral Norte da Bahia. Veja horários de maré alta e baixa, piscinas naturais, condições para família, surf e pesca."
        />
        <link rel="canonical" href="https://barradojacuipe.com.br/tabua-de-mares" />
        <meta property="og:title" content="Tábua de Marés Hoje — Barra do Jacuípe" />
        <meta
          property="og:description"
          content="Saiba o melhor horário das piscinas naturais, surf e pesca no Litoral Norte da Bahia."
        />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-ocean-deep via-ocean to-ocean pt-24 md:pt-32 pb-12 md:pb-16 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <Waves className="absolute top-10 left-10 size-32" />
          <Waves className="absolute bottom-10 right-10 size-48" />
        </div>
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-background/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest backdrop-blur mb-4">
              <MapPin className="size-3.5" />
              Litoral Norte · Bahia
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary-foreground">
              Tábua de Marés Descomplicada
            </h1>
            <p className="mt-4 text-base md:text-lg opacity-90 leading-relaxed">
              Saiba na hora se as <strong>piscinas naturais</strong> estão liberadas, e descubra os melhores horários
              para <strong>família, surf e pesca</strong> em Barra do Jacuípe.
            </p>
          </div>
        </div>
      </section>

      {/* Conteúdo principal */}
      <section className="bg-warm-gray py-10 md:py-16">
        <div className="container">
          <TodayTideCard />
        </div>
      </section>

      {/* SEO content */}
      <section className="bg-background py-12 md:py-16">
        <div className="container max-w-3xl">
          <div className="grid gap-6 md:grid-cols-3 mb-12">
            <div className="rounded-2xl border bg-card p-5">
              <Calendar className="size-6 text-ocean mb-2" />
              <h3 className="font-semibold text-foreground mb-1">Atualizada diariamente</h3>
              <p className="text-sm text-muted-foreground">Horários precisos para o Litoral Norte da Bahia.</p>
            </div>
            <div className="rounded-2xl border bg-card p-5">
              <Waves className="size-6 text-ocean mb-2" />
              <h3 className="font-semibold text-foreground mb-1">Piscinas naturais</h3>
              <p className="text-sm text-muted-foreground">Saiba quando o Caribinho aparece para curtir com as crianças.</p>
            </div>
            <div className="rounded-2xl border bg-card p-5">
              <Info className="size-6 text-ocean mb-2" />
              <h3 className="font-semibold text-foreground mb-1">Sem complicação</h3>
              <p className="text-sm text-muted-foreground">Linguagem clara para quem não é especialista em maré.</p>
            </div>
          </div>

          <article className="prose-description">
            <h2>Como funciona a maré em Barra do Jacuípe?</h2>
            <p>
              A maré em Barra do Jacuípe segue o ciclo semidiurno típico do litoral baiano: duas marés altas (preamar) e
              duas marés baixas (baixa-mar) por dia. Quando a maré desce abaixo de aproximadamente <strong>0,4 metros</strong>,
              formam-se as famosas <strong>piscinas naturais do Caribinho</strong>, ideais para banho com crianças e mergulho
              leve.
            </p>
            <h3>Melhores horários para cada perfil</h3>
            <ul>
              <li><strong>Famílias com crianças:</strong> aproveite a janela das marés mínimas, quando as piscinas estão formadas e o mar fica calmo.</li>
              <li><strong>Surfistas:</strong> a foz do Rio Jacuípe rende boas ondas próximo às preamares, especialmente com maré enchendo.</li>
              <li><strong>Pescadores:</strong> a vazante ativa é o momento clássico para arremessos na barra, com peixes saindo junto com a água.</li>
            </ul>
            <h3>Dica de segurança</h3>
            <p>
              Atenção barqueiros e banhistas: nas preamares de mais de 2 metros, a correnteza na foz do rio fica forte.
              Sempre confira a tábua antes de planejar o passeio.
            </p>
          </article>
        </div>
      </section>
    </>
  );
};

export default TabuaDeMares;
