import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const POPULAR_ICONS = [
  'home', 'building', 'building-2', 'trees', 'waves', 'shield-check', 'car',
  'dumbbell', 'utensils', 'wifi', 'tv', 'air-vent', 'flame', 'droplets',
  'sun', 'umbrella', 'fence', 'door-open', 'bath', 'bed', 'sofa',
  'lamp', 'refrigerator', 'washing-machine', 'microwave', 'coffee',
  'bike', 'dog', 'cat', 'baby', 'accessibility', 'parking-meter',
  'cctv', 'lock', 'key', 'map-pin', 'mountain', 'palmtree', 'flower-2',
  'sailboat', 'fish', 'tent', 'telescope', 'volleyball',
  'trophy', 'music', 'gamepad-2', 'book-open', 'heart', 'star',
  'check-circle', 'zap', 'sparkles', 'gem', 'crown', 'award',
  'thermometer', 'wind', 'cloud-sun', 'moon', 'sunrise',
];

// Convert PascalCase to kebab-case
function toKebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

// Convert kebab-case to PascalCase
function toPascal(name: string): string {
  return name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

// Synchronous icon renderer for selected icons
function RenderIcon({ name, className }: { name: string; className?: string }) {
  const [IconComp, setIconComp] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    import('lucide-react').then((mod) => {
      const pascal = toPascal(name);
      const comp = (mod as any)[pascal];
      if (comp) setIconComp(() => comp);
    });
  }, [name]);

  if (!IconComp) return <span className={className}>?</span>;
  return <IconComp className={className} />;
}

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

const VISIBLE_ROWS = 6;
const COLS = 8;
const ITEM_SIZE = 36; // px per icon cell

const IconPicker = ({ value, onChange }: IconPickerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [allIcons, setAllIcons] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Load full icon list once on first open
  useEffect(() => {
    if (!open || loaded) return;
    import('lucide-react').then((mod) => {
      const names = Object.keys(mod)
        .filter(k => k !== 'default' && k !== 'createLucideIcon' && k !== 'icons' && typeof (mod as any)[k] === 'function' && /^[A-Z]/.test(k))
        .map(toKebab)
        .sort();
      setAllIcons(names);
      setLoaded(true);
    }).catch(() => {});
  }, [open, loaded]);

  const iconList = loaded ? allIcons : POPULAR_ICONS;

  const filtered = useMemo(() => {
    if (!search.trim()) return iconList;
    const q = search.toLowerCase();
    return iconList.filter(i => i.includes(q));
  }, [search, iconList]);

  // Virtual scroll calculations
  const totalRows = Math.ceil(filtered.length / COLS);
  const totalHeight = totalRows * ITEM_SIZE;
  const visibleHeight = VISIBLE_ROWS * ITEM_SIZE;
  const startRow = Math.floor(scrollTop / ITEM_SIZE);
  const endRow = Math.min(totalRows, startRow + VISIBLE_ROWS + 2);
  const visibleIcons = filtered.slice(startRow * COLS, endRow * COLS);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) setScrollTop(scrollRef.current.scrollTop);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-full justify-start gap-2 h-10">
          {value ? (
            <>
              <RenderIcon name={value} className="h-4 w-4" />
              <span className="text-sm font-mono">{value}</span>
            </>
          ) : (
            <span className="text-muted-foreground text-sm">Selecionar ícone...</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ícone (ex: waves, home)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-0.5 h-8 w-8"
                onClick={() => { onChange(''); setOpen(false); }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Virtualized icon grid */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="overflow-y-auto"
            style={{ height: Math.min(visibleHeight, totalHeight) }}
          >
            <div style={{ height: totalHeight, position: 'relative' }}>
              <div
                className="grid grid-cols-8 gap-0.5 absolute left-0 right-0"
                style={{ top: startRow * ITEM_SIZE }}
              >
                {visibleIcons.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    title={icon}
                    className={`flex items-center justify-center rounded hover:bg-muted transition-colors ${value === icon ? 'bg-primary/10 ring-1 ring-primary' : ''}`}
                    style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
                    onClick={() => { onChange(icon); setOpen(false); }}
                  >
                    <RenderIcon name={icon} className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">Nenhum ícone encontrado.</p>
          )}
          {loaded && (
            <p className="text-xs text-muted-foreground text-center">{filtered.length} ícones disponíveis</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export { RenderIcon };
export default IconPicker;
