import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { Waves, Info, Calendar, MapPin } from "lucide-react";
import { RealTideWidget } from "@/components/tides/RealTideWidget";
import {
  TIDE_REGIONS,
  DEFAULT_TIDE_REGION_SLUG,
  getTideRegion,
  isValidTideRegion,
} from "@/lib/tideRegions";
import { cn } from "@/lib/utils";

const TabuaDeMares = () => {
  const { region: regionParam } = useParams<{ region?: string }>();
  const navigate = useNavigate();

  // Fallback: missing param → redirect to default region.
  if (!regionParam) {
    return <Navigate to={`/tabua-de-mares/${DEFAULT_TIDE_REGION_SLUG}`} replace />;
  }
  // Invalid slug → redirect to default region.
  if (!isValidTideRegion(regionParam)) {
    return <Navigate to={`/tabua-de-mares/${DEFAULT_TIDE_REGION_SLUG}`} replace />;
  }

  const region = getTideRegion(regionParam);
  const pageTitle = `Tábua de Marés Hoje — ${region.name} | Litoral Norte BA`;
  const pageDesc = `Tábua de marés descomplicada para ${region.name} e Litoral Norte da Bahia. Veja horários de maré alta e baixa, piscinas naturais, condições para família, surf e pesca.`;
  const canonical = `https://barradojacuipe.com.br/tabua-de-mares/${region.slug}`;

  // Belt-and-braces: keep document.title in sync even if Helmet hasn't flushed yet.
  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  const handleRegionChange = (slug: string) => {
    if (slug === region.slug) return;
    navigate(`/tabua-de-mares/${slug}`);
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={`Tábua de Marés Hoje — ${region.name}`} />
        <meta property="og:description" content={pageDesc} />
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
              Tábua de Marés — {region.name}
            </h1>
            <p className="mt-4 text-base md:text-lg opacity-90 leading-relaxed">
              Saiba na hora se as <strong>piscinas naturais</strong> estão liberadas, e descubra os melhores horários
              para <strong>família, surf e pesca</strong> em {region.name}.
            </p>
          </div>
        </div>
      </section>

      {/* Region selector + tide widget */}
      <section className="bg-warm-gray py-10 md:py-16">
        <div className="container">
          {/* Region pills — horizontal scroll on mobile, flex-wrap on desktop */}
          <div
            role="tablist"
            aria-label="Selecione a praia"
            className="mx-auto mb-6 max-w-3xl flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0"
            style={{ scrollbarWidth: "none" }}
          >
            {TIDE_REGIONS.map((r) => {
              const active = r.slug === region.slug;
              return (
                <button
                  key={r.slug}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => handleRegionChange(r.slug)}
                  className={cn(
                    "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition whitespace-nowrap",
                    active
                      ? "border-ocean-deep bg-ocean-deep text-primary-foreground shadow-md ring-2 ring-ocean-deep/30"
                      : "border-border bg-background text-foreground hover:border-ocean/40 hover:bg-ocean/10",
                  )}
                >
                  {r.name}
                </button>
              );
            })}
          </div>

          <RealTideWidget regionSlug={region.slug} />
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
              <p className="text-sm text-muted-foreground">Saiba quando as piscinas naturais aparecem para curtir com as crianças.</p>
            </div>
            <div className="rounded-2xl border bg-card p-5">
              <Info className="size-6 text-ocean mb-2" />
              <h3 className="font-semibold text-foreground mb-1">Sem complicação</h3>
              <p className="text-sm text-muted-foreground">Linguagem clara para quem não é especialista em maré.</p>
            </div>
          </div>

          <article className="prose-description">
            <h2>Como funciona a maré em {region.name}?</h2>
            <p>
              A maré em {region.name} segue o ciclo semidiurno típico do litoral baiano: duas marés altas (preamar) e
              duas marés baixas (baixa-mar) por dia. Quando a maré desce abaixo de aproximadamente <strong>0,4 metros</strong>,
              formam-se as famosas <strong>piscinas naturais</strong>, ideais para banho com crianças e mergulho leve.
            </p>
            <h3>Melhores horários para cada perfil</h3>
            <ul>
              <li><strong>Famílias com crianças:</strong> aproveite a janela das marés mínimas, quando as piscinas estão formadas e o mar fica calmo.</li>
              <li><strong>Surfistas:</strong> as melhores ondas costumam aparecer próximo às preamares, especialmente com maré enchendo.</li>
              <li><strong>Pescadores:</strong> a vazante ativa é o momento clássico para arremessos, com peixes saindo junto com a água.</li>
            </ul>
            <h3>Dica de segurança</h3>
            <p>
              Atenção barqueiros e banhistas: nas preamares de mais de 2 metros, a correnteza fica forte, especialmente
              em fozes de rio. Sempre confira a tábua antes de planejar o passeio.
            </p>
          </article>
        </div>
      </section>
    </>
  );
};

export default TabuaDeMares;
