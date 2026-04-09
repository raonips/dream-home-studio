import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, MessageCircle, ShieldCheck, Send, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const Contato = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", mensagem: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "telefone" ? formatPhone(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.email.trim() || !form.telefone.trim()) {
      toast({ title: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('leads').insert({
        name: form.nome.trim(),
        email: form.email.trim(),
        phone: form.telefone.trim(),
        message: form.mensagem.trim() || null,
        source: 'contato',
        intention: 'Consultoria gratuita',
      } as any);

      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error('[Contato] Erro ao salvar lead:', err);
      toast({ title: "Erro ao enviar", description: "Tente novamente ou entre em contato pelo WhatsApp.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const whatsappLink = `https://wa.me/5571991089039?text=${encodeURIComponent(`Olá! Me chamo ${form.nome.trim()}. Gostaria de mais informações sobre imóveis em Barra do Jacuípe.`)}`;

  const inputClass = "w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <>
      <Helmet>
        <title>Contato - Imóveis Barra do Jacuípe | Litoral Norte BA</title>
        <meta name="description" content="Entre em contato com Imóveis Barra do Jacuípe para consultoria imobiliária no Litoral Norte da Bahia. Atendimento personalizado via WhatsApp, e-mail ou telefone." />
      </Helmet>

      <div className="pt-20 md:pt-24 pb-16 md:pb-24 bg-background min-h-screen">
        <div className="container">
          <div className="mb-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild><Link to="/">Início</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Contato</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="text-center mb-12 md:mb-16">
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
              Fale Conosco
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
              Solicite uma consultoria gratuita e encontre o imóvel perfeito em Barra do Jacuípe.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 max-w-5xl mx-auto">
            {/* Formulário */}
            <div className="bg-card rounded-xl border border-border p-6 md:p-8 shadow-card">
              {submitted ? (
                <div className="text-center space-y-4 py-8">
                  <CheckCircle2 className="h-14 w-14 text-accent mx-auto" />
                  <h2 className="font-display text-xl font-bold text-foreground">Obrigado!</h2>
                  <p className="text-sm text-muted-foreground">
                    Seus dados foram salvos e um especialista da <strong>Amar Imóvel</strong> entrará em contato.
                  </p>
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full bg-accent text-accent-foreground font-bold py-3.5 rounded-lg text-base hover:bg-accent/90 transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Falar agora pelo WhatsApp
                  </a>
                </div>
              ) : (
                <>
                  <h2 className="font-display text-xl font-semibold text-foreground mb-6">Solicitar Consultoria Gratuita</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Nome *</label>
                      <input name="nome" value={form.nome} onChange={handleChange} placeholder="Seu nome completo" className={inputClass} maxLength={100} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">E-mail *</label>
                      <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="seu@email.com" className={inputClass} maxLength={255} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Telefone *</label>
                      <input name="telefone" value={form.telefone} onChange={handleChange} placeholder="(71) 99999-9999" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Mensagem</label>
                      <textarea name="mensagem" value={form.mensagem} onChange={handleChange} placeholder="Conte-nos sobre o imóvel que procura..." className={`${inputClass} min-h-[100px] resize-none`} maxLength={1000} />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold rounded-lg px-6 py-3.5 hover:bg-primary/90 transition-colors text-base disabled:opacity-60"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {loading ? "Enviando..." : "Solicitar Consultoria Gratuita"}
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Informações de contato */}
            <div className="space-y-8">
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground mb-5">Informações de Contato</h2>
                <ul className="space-y-4 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">Imóveis Barra do Jacuípe</p>
                      <p>Barra do Jacuípe, Camaçari — BA</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>(71) 99108-9039</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>imoveis@barradojacuipe.com.br</span>
                  </li>
                </ul>

                <div className="flex gap-3 mt-5">
                  <a
                    href="https://wa.me/5571991089039?text=Olá! Gostaria de mais informações sobre imóveis em Barra do Jacuípe."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-accent text-accent-foreground text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-accent/90 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                  <a
                    href="mailto:imoveis@barradojacuipe.com.br"
                    className="flex items-center gap-2 bg-secondary text-secondary-foreground text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-secondary/80 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    E-mail
                  </a>
                </div>
              </div>

              {/* Mapa */}
              <div className="rounded-xl overflow-hidden border border-border shadow-card">
                <iframe
                  title="Localização Barra do Jacuípe"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31090.74!2d-38.33!3d-12.73!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x71612e0f0c6e3d%3A0x7e1234567890!2sBarra%20do%20Jacu%C3%ADpe%2C%20Cama%C3%A7ari%20-%20BA!5e0!3m2!1spt-BR!2sbr!4v1"
                  width="100%"
                  height="260"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* CRECI */}
              <div className="flex items-center gap-3 bg-warm-gray rounded-xl p-4">
                <ShieldCheck className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground text-sm">CRECI-08556</p>
                  <p className="text-xs text-muted-foreground">Amar Imóvel Consultoria Imobiliária LTDA</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contato;
