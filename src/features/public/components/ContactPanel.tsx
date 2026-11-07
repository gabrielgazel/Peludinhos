import { ExternalLink, GraduationCap, MapPin, Newspaper } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../../shared/ui/button';

const UFOPA_SOURCE_URL =
  'https://www.ufopa.edu.br/ufopa/comunica/noticias/projeto-peludinhos-da-ufopa-pretende-cuidar-de-animais-e-evitar-abandono-no-campus/';

const BLOCKS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: MapPin,
    title: 'Local',
    text: 'Universidade Federal do Oeste do Pará (UFOPA) — Campus Santarém, Pará.',
  },
  {
    icon: GraduationCap,
    title: 'Contato',
    text: 'Professora responsável: Cintya Martins — Instituto de Engenharia e Geociências (IEG/UFOPA).',
  },
  {
    icon: Newspaper,
    title: 'Fonte',
    text: 'Publicado em 11 de abril de 2019.',
  },
];

/** Painel final de contato: local, contato, fonte e chamada para adoção. */
export function ContactPanel() {
  return (
    <section
      aria-labelledby="contato-titulo"
      className="mx-auto w-full max-w-6xl px-4 py-14"
    >
      <div className="rounded-[28px] bg-ink-soft p-7 text-paper sm:p-10 lg:p-12">
        <h2 id="contato-titulo" className="font-display text-3xl text-paper">
          Venha nos visitar
        </h2>

        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {BLOCKS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex flex-col gap-3">
              <span aria-hidden="true" className="text-paper/70">
                <Icon size={20} />
              </span>
              <h3 className="font-display text-xl text-paper">{title}</h3>
              <p className="text-sm leading-relaxed text-paper">
                {text}
                {title === 'Fonte' && (
                  <>
                    {' '}
                    <a
                      href={UFOPA_SOURCE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-paper underline decoration-paper/50 underline-offset-4 hover:decoration-paper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper"
                    >
                      Notícia na UFOPA
                      <ExternalLink size={14} aria-hidden="true" />
                    </a>
                  </>
                )}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-5 border-t border-paper/20 pt-8">
          <Button
            asChild
            size="lg"
            className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper"
          >
            <Link to="/adocao">Quero adotar</Link>
          </Button>
          <Link
            to="/login"
            className="text-sm font-bold text-paper underline decoration-paper/50 underline-offset-4 hover:decoration-paper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper"
          >
            Acesso da equipe
          </Link>
        </div>
      </div>
    </section>
  );
}
