import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface SiteSettings {
  site_title: string;
  site_description: string;
  site_keywords: string;
  og_image_url: string;
  head_scripts: string;
  body_scripts: string;
  favicon_url: string;
  logo_url: string;
  header_logo_url: string;
  hero_image_url: string;
  hero_bg_desktop: string;
  hero_bg_mobile: string;
  hero_title: string;
  hero_subtitle: string;
  map_provider: string;
  google_maps_api_key: string;
  whatsapp_number: string;
  instagram_url: string;
  condominios_list: { slug: string; name: string }[];
  watermark_url: string;
  watermark_position: string;
  watermark_opacity: number;
  watermark_scale: number;
}

const defaultImoveisSettings: SiteSettings = {
  site_title: 'Imóveis Barra do Jacuípe | Casas de Alto Padrão no Litoral Norte',
  site_description: 'Encontre imóveis de alto padrão em Barra do Jacuípe, Litoral Norte da Bahia.',
  site_keywords: 'imóveis barra do jacuípe, casas litoral norte bahia',
  og_image_url: '',
  head_scripts: '',
  body_scripts: '',
  favicon_url: '',
  logo_url: '',
  header_logo_url: '',
  hero_image_url: '',
  hero_bg_desktop: '',
  hero_bg_mobile: '',
  hero_title: 'Comprar Casa em Barra do Jacuípe BA',
  hero_subtitle: 'Encontre a casa dos seus sonhos no Litoral Norte baiano. Sítios, casas de praia e alto padrão.',
  map_provider: 'leaflet',
  google_maps_api_key: '',
  whatsapp_number: '5571991089039',
  instagram_url: '',
  condominios_list: [],
  watermark_url: '',
  watermark_position: 'center',
  watermark_opacity: 0.3,
  watermark_scale: 0.5,
};

const defaultGuiaSettings: SiteSettings = {
  ...defaultImoveisSettings,
  site_title: 'Barra do Jacuípe | Guia Local — Praias, Restaurantes e Dicas',
  site_description: 'Descubra o melhor da Barra do Jacuípe: praias, restaurantes, passeios e dicas de turismo.',
  site_keywords: 'barra do jacuípe, guia local, praias, restaurantes, turismo',
  hero_title: 'Guia Local — Barra do Jacuípe',
  hero_subtitle: 'Tudo o que você precisa saber sobre a região.',
};

interface AllSettings {
  imoveis: SiteSettings;
  guia: SiteSettings;
}

const AllSettingsContext = createContext<AllSettings>({
  imoveis: defaultImoveisSettings,
  guia: defaultGuiaSettings,
});

/** Returns settings for the CURRENT route context (Guia or Imóveis) */
export const useSiteSettings = () => {
  const all = useContext(AllSettingsContext);
  try {
    const location = useLocation();
    const isImoveis = location.pathname.startsWith('/imoveis');
    return isImoveis ? all.imoveis : all.guia;
  } catch {
    // Outside router (e.g. HeadScripts before BrowserRouter) — return imoveis as fallback
    return all.imoveis;
  }
};

/** Returns both settings sets for components that need explicit access */
export const useAllSiteSettings = () => useContext(AllSettingsContext);

function parseSettings(d: any, defaults: SiteSettings, condList: { slug: string; name: string }[]): SiteSettings {
  if (!d) return { ...defaults, condominios_list: condList };
  return {
    site_title: d.site_title || defaults.site_title,
    site_description: d.site_description || defaults.site_description,
    site_keywords: d.site_keywords || defaults.site_keywords,
    og_image_url: d.og_image_url || '',
    head_scripts: d.head_scripts || '',
    body_scripts: d.body_scripts || '',
    favicon_url: d.favicon_url || '',
    logo_url: d.logo_url || '',
    header_logo_url: d.header_logo_url || '',
    hero_image_url: d.hero_image_url || '',
    hero_bg_desktop: d.hero_bg_desktop || '',
    hero_bg_mobile: d.hero_bg_mobile || '',
    hero_title: d.hero_title || defaults.hero_title,
    hero_subtitle: d.hero_subtitle || defaults.hero_subtitle,
    map_provider: d.map_provider || 'leaflet',
    google_maps_api_key: d.google_maps_api_key || '',
    whatsapp_number: d.whatsapp_number || '5571991089039',
    instagram_url: d.instagram_url || '',
    condominios_list: condList,
    watermark_url: d.watermark_url || '',
    watermark_position: d.watermark_position || 'center',
    watermark_opacity: Number(d.watermark_opacity) || 0.3,
    watermark_scale: Number(d.watermark_scale) || 0.5,
  };
}

export const SiteSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [allSettings, setAllSettings] = useState<AllSettings>({
    imoveis: defaultImoveisSettings,
    guia: defaultGuiaSettings,
  });

  useEffect(() => {
    Promise.all([
      supabase.from('site_settings').select('*').limit(1).single(),
      supabase.from('guia_site_settings').select('*').limit(1).single(),
      supabase.from('condominios').select('slug, name').order('name'),
    ]).then(([imoveisRes, guiaRes, condominiosRes]) => {
      const condList = (condominiosRes.data as { slug: string; name: string }[]) || [];
      const imoveisSettings = parseSettings(imoveisRes.data, defaultImoveisSettings, condList);
      const guiaSettings = parseSettings(guiaRes.data, defaultGuiaSettings, condList);
      setAllSettings({ imoveis: imoveisSettings, guia: guiaSettings });
      try {
        if (guiaSettings.hero_bg_desktop) localStorage.setItem('hero_bg_desktop', guiaSettings.hero_bg_desktop);
        if (guiaSettings.hero_bg_mobile) localStorage.setItem('hero_bg_mobile', guiaSettings.hero_bg_mobile);
      } catch {}
    });
  }, []);

  return (
    <AllSettingsContext.Provider value={allSettings}>
      {children}
    </AllSettingsContext.Provider>
  );
};

/** Injects correct Helmet meta tags based on route */
export const SiteHelmet = () => {
  const settings = useSiteSettings();

  return (
    <Helmet>
      <title>{settings.site_title}</title>
      <meta name="description" content={settings.site_description} />
      <meta name="keywords" content={settings.site_keywords} />
      {settings.og_image_url && <meta property="og:image" content={settings.og_image_url} />}
      <meta property="og:title" content={settings.site_title} />
      <meta property="og:description" content={settings.site_description} />
      <meta property="og:type" content="website" />
      {settings.favicon_url && <link rel="icon" href={settings.favicon_url} />}
    </Helmet>
  );
};

export const HeadScripts = () => {
  const settings = useSiteSettings();
  useEffect(() => {
    if (!settings.head_scripts) return;
    const container = document.createElement('div');
    container.id = 'custom-head-scripts';
    container.innerHTML = settings.head_scripts;
    const scripts = container.querySelectorAll('script');
    scripts.forEach((origScript) => {
      const newScript = document.createElement('script');
      Array.from(origScript.attributes).forEach((attr) =>
        newScript.setAttribute(attr.name, attr.value)
      );
      newScript.textContent = origScript.textContent;
      document.head.appendChild(newScript);
    });
    const nonScripts = container.querySelectorAll(':not(script)');
    nonScripts.forEach((el) => {
      document.head.appendChild(el.cloneNode(true));
    });
    return () => {
      document.querySelectorAll('[data-custom-head]').forEach((el) => el.remove());
    };
  }, [settings.head_scripts]);
  return null;
};

const BodyScripts = ({ html }: { html: string }) => {
  useEffect(() => {
    if (!html) return;
    const container = document.createElement('div');
    container.id = 'custom-body-scripts';
    container.innerHTML = html;
    const scripts = container.querySelectorAll('script');
    scripts.forEach((origScript) => {
      const newScript = document.createElement('script');
      Array.from(origScript.attributes).forEach((attr) =>
        newScript.setAttribute(attr.name, attr.value)
      );
      newScript.textContent = origScript.textContent;
      origScript.replaceWith(newScript);
    });
    document.body.insertBefore(container, document.body.firstChild);
    return () => {
      document.getElementById('custom-body-scripts')?.remove();
    };
  }, [html]);
  return null;
};
