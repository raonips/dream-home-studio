import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TagOption {
  nome: string;
  slug: string;
}

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
}

const generateSlug = (name: string) =>
  name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const CreatableTagSelect = ({ value, onChange }: Props) => {
  const [options, setOptions] = useState<TagOption[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from('tags').select('nome, slug').order('nome').then(({ data }) => {
      if (data) setOptions(data as TagOption[]);
    });
  }, []);

  const addTag = useCallback(async (tagName: string) => {
    const trimmed = tagName.trim();
    if (!trimmed || value.includes(trimmed)) return;

    // Check if exists in options
    const exists = options.some(o => o.nome.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      // Create in DB
      const slug = generateSlug(trimmed);
      const { data } = await supabase.from('tags').insert({ nome: trimmed, slug }).select('nome, slug').maybeSingle();
      if (data) {
        setOptions(prev => [...prev, data as TagOption].sort((a, b) => a.nome.localeCompare(b.nome)));
      }
    }

    onChange([...value, trimmed]);
  }, [value, onChange, options]);

  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag));
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted.includes(',')) {
      e.preventDefault();
      const parts = pasted.split(',').map(s => s.trim()).filter(Boolean);
      const newTags = [...value];
      for (const part of parts) {
        if (!newTags.includes(part)) {
          const exists = options.some(o => o.nome.toLowerCase() === part.toLowerCase());
          if (!exists) {
            const slug = generateSlug(part);
            const { data } = await supabase.from('tags').insert({ nome: part, slug }).select('nome, slug').maybeSingle();
            if (data) setOptions(prev => [...prev, data as TagOption]);
          }
          newTags.push(part);
        }
      }
      onChange(newTags);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const filteredOptions = options.filter(
    o => !value.includes(o.nome) && o.nome.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap gap-1.5 p-2 min-h-[42px] rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-primary/30">
        {value.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full"
          >
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={value.length === 0 ? 'Digite ou cole tags separadas por vírgula...' : ''}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {filteredOptions.map(opt => (
            <button
              key={opt.slug}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
              onClick={() => {
                addTag(opt.nome);
                setInputValue('');
                setIsOpen(false);
              }}
            >
              {opt.nome}
            </button>
          ))}
          {inputValue.trim() && !options.some(o => o.nome.toLowerCase() === inputValue.trim().toLowerCase()) && (
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm text-primary font-medium hover:bg-muted transition-colors border-t border-border"
              onClick={() => {
                addTag(inputValue);
                setInputValue('');
                setIsOpen(false);
              }}
            >
              + Criar "{inputValue.trim()}"
            </button>
          )}
        </div>
      )}

      {isOpen && filteredOptions.length === 0 && inputValue.trim() && !options.some(o => o.nome.toLowerCase() === inputValue.trim().toLowerCase()) && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg">
          <button
            type="button"
            className="w-full text-left px-3 py-2 text-sm text-primary font-medium hover:bg-muted transition-colors"
            onClick={() => {
              addTag(inputValue);
              setInputValue('');
              setIsOpen(false);
            }}
          >
            + Criar "{inputValue.trim()}"
          </button>
        </div>
      )}
    </div>
  );
};

export default CreatableTagSelect;
