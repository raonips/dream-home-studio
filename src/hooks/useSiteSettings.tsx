import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
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

const defaultSettings: SiteSettings = {
  site_title: 'Imóveis Barra do Jacuípe | Casas de Alto Padrão no Litoral Norte',
  site_description: 'Encontre imóveis de alto padrão em Barra do Jacuípe, Litoral Norte da Bahia.',
  site_keywords: 'imóveis barra do jacuípe, casas litoral norte bahia',
  og_image_url: '',
  head_scripts: '',
  body_scripts: '',
  favicon_url: '',
  logo_url: '',
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

const SiteSettingsContext = createContext<SiteSettings>(defaultSettings);

export const useSiteSettings = () => useContext(SiteSettingsContext);

export const SiteSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    // Fetch site_settings and condominios list in parallel
    const fetchSettings = supabase
      .from('site_settings')
      .select('*')
      .limit(1)
      .single();

    const fetchCondominios = supabase
      .from('condominios')
      .select('slug, name')
      .order('name');

    Promise.all([fetchSettings, fetchCondominios]).then(([settingsRes, condominiosRes]) => {
      const d = settingsRes.data as any;
      const condList = (condominiosRes.data as { slug: string; name: string }[]) || [];

      if (d) {
        setSettings({
          site_title: d.site_title || defaultSettings.site_title,
          site_description: d.site_description || defaultSettings.site_description,
          site_keywords: d.site_keywords || defaultSettings.site_keywords,
          og_image_url: d.og_image_url || '',
          head_scripts: d.head_scripts || '',
          body_scripts: d.body_scripts || '',
          favicon_url: d.favicon_url || '',
          logo_url: d.logo_url || '',
          hero_image_url: d.hero_image_url || '',
          hero_bg_desktop: d.hero_bg_desktop || '',
          hero_bg_mobile: d.hero_bg_mobile || '',
          hero_title: d.hero_title || defaultSettings.hero_title,
          hero_subtitle: d.hero_subtitle || defaultSettings.hero_subtitle,
          map_provider: d.map_provider || 'leaflet',
          google_maps_api_key: d.google_maps_api_key || '',
          whatsapp_number: d.whatsapp_number || '5571991089039',
          instagram_url: d.instagram_url || '',
          condominios_list: condList,
          watermark_url: d.watermark_url || '',
          watermark_position: d.watermark_position || 'center',
          watermark_opacity: Number(d.watermark_opacity) || 0.3,
          watermark_scale: Number(d.watermark_scale) || 0.5,
        });
      } else {
        setSettings(prev => ({ ...prev, condominios_list: condList }));
      }
    });
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>
      <Helmet defaultTitle={settings.site_title} titleTemplate={`%s | ${settings.site_title}`}>
        <meta name="description" content={settings.site_description} />
        <meta name="keywords" content={settings.site_keywords} />
        {settings.og_image_url && <meta property="og:image" content={settings.og_image_url} />}
        <meta property="og:title" content={settings.site_title} />
        <meta property="og:description" content={settings.site_description} />
        <meta property="og:type" content="website" />
        {settings.favicon_url && <link rel="icon" href={settings.favicon_url} />}
      </Helmet>
      {settings.head_scripts && (
        <Helmet>
          <script>{`/* head_scripts_marker */`}</script>
        </Helmet>
      )}
      {settings.body_scripts && (
        <BodyScripts html={settings.body_scripts} />
      )}
      {children}
    </SiteSettingsContext.Provider>
  );
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
