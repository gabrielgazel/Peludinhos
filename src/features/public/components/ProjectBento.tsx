import { HeartPulse, Megaphone, Scale, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';

/** Pilares do projeto — textos copiados verbatim do conteúdo institucional atual. */
const PILLARS: {
  icon: LucideIcon;
  title: string;
  text: string;
  tone: 'highlight' | 'plain';
  wide?: boolean;
  tall?: boolean;
}[] = [
  {
    icon: HeartPulse,
    title: 'Cuidados diários',
    text: 'Alimentação adequada e acompanhamento das condições de saúde dos animais.',
    tone: 'highlight',
    tall: true,
  },
  {
    icon: Users,
    title: 'Ações coletivas',
    text: 'Técnicos administrativos, professores, profissionais terceirizados e estudantes — muitos já ajudavam os animais de forma isolada; o Peludinhos organiza essas ações.',
    tone: 'plain',
  },
  {
    icon: Scale,
    title: 'Controle populacional',
    text: 'Ações para o controle populacional dos animais presentes no campus.',
    tone: 'plain',
  },
  {
    icon: Megaphone,
    title: 'Conscientização',
    text: 'Sensibilização sobre abandono e maus-tratos, com orientação à comunidade acadêmica.',
    tone: 'plain',
    wide: true,
  },
];

export function ProjectBento() {
  return (
    <section
      id="projeto"
      aria-labelledby="projeto-titulo"
      className="mx-auto w-full max-w-6xl px-4 py-14"
    >
      <h2 id="projeto-titulo" className="font-display text-3xl text-ink">
        O projeto
      </h2>
      <p className="mt-3 max-w-2xl text-muted">
        O “Peludinhos da UFOPA” nasceu da união de pessoas comprometidas com o
        bem-estar dos animais que vivem nos espaços da universidade. O objetivo
        é tratar, cuidar e alimentar os animais — especialmente cães e gatos de
        vida livre — garantindo maior qualidade de vida com ações responsáveis
        de cuidado e proteção.
      </p>

      <div
        className={cn(
          'mt-8 grid grid-cols-1 gap-4',
          'min-[600px]:grid-cols-2',
          'min-[900px]:grid-cols-4 min-[900px]:auto-rows-fr',
        )}
      >
        {PILLARS.map(({ icon: Icon, title, text, tone, wide, tall }) => (
          <article
            key={title}
            className={cn(
              'flex flex-col gap-3 border border-line p-5',
              // Grandes: 24px; pequenos: 16px. Sem sombras.
              (wide || tall) ? 'rounded-3xl' : 'rounded-2xl',
              tone === 'highlight'
                ? 'border-transparent bg-marker-soft text-ink'
                : 'bg-card text-ink',
              tall && 'min-[900px]:col-span-2 min-[900px]:row-span-2',
              wide && 'min-[900px]:col-span-2',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex size-10 items-center justify-center rounded-full',
                tone === 'highlight' ? 'bg-ink text-marker-soft' : 'bg-leaf-soft text-ink-soft',
              )}
            >
              <Icon size={20} />
            </span>
            <h3 className="font-display text-xl text-ink">{title}</h3>
            <p className="text-sm text-ink-soft">{text}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 border-t border-dashed border-line pt-3">
        <p className="text-xs text-muted">
          Abandono e maus-tratos são crimes — Lei nº 9.605/98.
        </p>
      </div>
    </section>
  );
}
