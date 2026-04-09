import { useState, useMemo } from "react";
import { format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Users, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BookingCalculatorProps {
  propertyTitle: string;
  condoName?: string;
  dailyRate: number;
  cleaningFee: number;
  maxGuests: number;
}

const BookingCalculator = ({ propertyTitle, condoName, dailyRate, cleaningFee, maxGuests }: BookingCalculatorProps) => {
  const [checkin, setCheckin] = useState<Date | undefined>();
  const [checkout, setCheckout] = useState<Date | undefined>();
  const [guests, setGuests] = useState(2);

  const nights = useMemo(() => {
    if (!checkin || !checkout) return 0;
    return Math.max(0, differenceInCalendarDays(checkout, checkin));
  }, [checkin, checkout]);

  const subtotal = nights * dailyRate;
  const total = subtotal + (nights > 0 ? cleaningFee : 0);

  const formatCurrency = (value: number) =>
    `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const handleReservar = () => {
    const checkinStr = checkin ? format(checkin, "dd/MM/yyyy") : "—";
    const checkoutStr = checkout ? format(checkout, "dd/MM/yyyy") : "—";
    const condoPart = condoName ? ` no Condomínio ${condoName}` : "";
    const msg = `Olá Raoni (Amar Imóvel), gostaria de reservar a ${propertyTitle}${condoPart}, de ${checkinStr} a ${checkoutStr} para ${guests} hóspedes. O valor total estimado é ${formatCurrency(total)}. Está disponível?`;
    window.open(`https://wa.me/5571991089039?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <Card className="shadow-card border-border">
      <CardContent className="p-6 space-y-5">
        <div>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(dailyRate)} <span className="text-sm font-normal text-muted-foreground">/ diária</span>
          </p>
        </div>

        {/* Check-in / Check-out */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">CHECK-IN</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left text-sm font-normal h-10", !checkin && "text-muted-foreground")}>
                  <CalendarDays className="mr-1.5 h-4 w-4" />
                  {checkin ? format(checkin, "dd/MM/yy") : "Data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={checkin} onSelect={(d) => { setCheckin(d); if (checkout && d && d >= checkout) setCheckout(undefined); }} disabled={(date) => date < new Date()} locale={ptBR} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">CHECK-OUT</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left text-sm font-normal h-10", !checkout && "text-muted-foreground")}>
                  <CalendarDays className="mr-1.5 h-4 w-4" />
                  {checkout ? format(checkout, "dd/MM/yy") : "Data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={checkout} onSelect={setCheckout} disabled={(date) => date <= (checkin || new Date())} locale={ptBR} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Hóspedes */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">HÓSPEDES</label>
          <div className="flex items-center justify-between border border-input rounded-lg px-3 py-2">
            <span className="flex items-center gap-1.5 text-sm text-foreground">
              <Users className="h-4 w-4" /> {guests} hóspede{guests > 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setGuests(Math.max(1, guests - 1))} className="w-7 h-7 rounded-full border border-input flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-30" disabled={guests <= 1}>−</button>
              <button type="button" onClick={() => setGuests(Math.min(maxGuests || 20, guests + 1))} className="w-7 h-7 rounded-full border border-input flex items-center justify-center text-foreground hover:bg-muted" disabled={maxGuests > 0 && guests >= maxGuests}>+</button>
            </div>
          </div>
          {maxGuests > 0 && (
            <p className="text-xs text-muted-foreground mt-1">Máximo: {maxGuests} hóspedes</p>
          )}
        </div>

        {/* Resumo */}
        {nights > 0 && (
          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex justify-between text-sm text-foreground">
              <span>{formatCurrency(dailyRate)} × {nights} noite{nights > 1 ? "s" : ""}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {cleaningFee > 0 && (
              <div className="flex justify-between text-sm text-foreground">
                <span>Taxa de limpeza</span>
                <span>{formatCurrency(cleaningFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-foreground border-t border-border pt-2">
              <span>Total da Estadia</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>
        )}

        {/* Botão Reservar */}
        <Button
          onClick={handleReservar}
          disabled={!checkin || !checkout || nights <= 0}
          className="w-full h-12 text-base font-bold bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
        >
          <MessageCircle className="h-5 w-5" /> Reservar via WhatsApp
        </Button>

        <p className="text-xs text-center text-muted-foreground">Você ainda não será cobrado. Confirme a disponibilidade com o proprietário.</p>
      </CardContent>
    </Card>
  );
};

export default BookingCalculator;
