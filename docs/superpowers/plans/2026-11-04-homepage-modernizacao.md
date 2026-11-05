# Modernização da Homepage — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reescrever a homepage pública do Peludinhos com componentes acessíveis e composição contemporânea, mantendo paleta, tipografia, conteúdo e demais páginas intactos.

**Architecture:** Base shadcn/ui copiada para `src/shared/ui` (Button, Badge, Card, Carousel), tokens da identidade expostos ao Tailwind v4 via `@theme`, e a home dividida em componentes de seção em `src/features/public/components`. Dados vêm do hook existente e são filtrados na home. Movimento só com CSS e um hook de `IntersectionObserver`.

**Tech Stack:** React 19, TypeScript, Vite 8, Tailwind v4, shadcn/ui (Radix + Embla), Vitest + Testing Library, Playwright CLI.

**Spec:** `docs/superpowers/specs/2026-11-04-homepage-modernizacao-design.md`

## Global Constraints

- Paleta exata: papel `#F5EBE6`, cartão `#FFFAF6`, tinta `#2B2927`, marrom profundo `#4A3C35`, secundário `#6B5B52`, laranja `#E08A4E`, laranja hover `#C97638`, laranja claro `#F6DCC8`, verde `#7BAE7F`, verde claro `#DCEBDC`, borda `rgba(107,91,82,0.28)`.
- Fontes: `Averia Libre` (display, 700) e `Source Sans 3` (corpo). Não introduzir outra família.
- Laranja `#E08A4E` nunca como cor de texto sobre papel/cartão; texto sobre laranja é `#2B2927`.
- Não alterar valores de `--pub-*` em `PublicLayout.css` nem regras de `animals.css`; outras páginas dependem delas.
- Não alterar rotas, contratos da API, autenticação ou textos legais (lei 9.605/98, local, professora, data e URL da fonte).
- Não instalar biblioteca de animação (framer-motion/GSAP). Movimento em CSS.
- Respeitar `prefers-reduced-motion: reduce` em todo movimento.
- Copy em português do Brasil, sentence case, voz ativa, sem exclamações.
- Gerenciador: `bun` (npm está bloqueado por política nesta máquina). Comandos: `bun install`, `bun run build`, `bun run lint`, `bun run test`.
- 21st.dev: sem geração por IA e com 2 recuperações de código restantes. Usar apenas busca/inspiração como referência; no máximo 2 `get_component`.
- Validação visual com dados mockados: a API local está offline. Nenhum mock entra em código de produção.

## Review Focus

1. **Status do animal:** membro autenticado recebe animais `adotado`/`em_processo`/`indisponivel` e falecidos; a home não pode exibi-los como disponíveis. Teste na Task 4.
2. **Volume de dados:** 30 animais retornados; hero mostra no máximo 3, carrossel no máximo 8, sem overflow. Teste na Task 7.
3. **Foto quebrada:** URL de imagem inválida mantém proporção 4:3 e mostra o fallback de pata sem deslocar o layout. Testes nas Tasks 4 e 7.
4. **Teclado e movimento reduzido:** todos os controles alcançáveis, foco visível também sobre superfícies escuras, marquee parado. Verificação na Task 9.
5. **360 px com nomes longos:** nome de animal e selos não colidem nem criam rolagem horizontal. Teste na Task 7 e verificação na Task 9.

---

## Setup (executar antes da Task 1, sem checkbox de tarefa)

- [ ] **Confirmar que não há alterações fora do trabalho em andamento**

Run: `git status --short`
Expected: lista igual à do início da sessão (21 arquivos modificados, `.claude/` e `Breadcrumbs.*` não rastreados). Nada inesperado.

- [ ] **Criar o branch de trabalho e preservar o WIP como baseline**

```bash
git switch -c feat/home-modernizacao
git add -A
git commit -m "chore: baseline do trabalho em andamento"
```

Expected: branch `feat/home-modernizacao`, commit criado, `git status` limpo.

- [ ] **Registrar o BASE do plano**

Run: `git rev-parse --short HEAD`
Expected: hash anotado (será o `MERGE_BASE` da revisão final).

---

### Task 1: Fundação de UI (dependências, alias, tokens, `cn`, Vitest)

**Files:**
- Modify: `package.json`, `vite.config.ts`, `tsconfig.app.json`, `src/index.css`
- Create: `src/shared/lib/utils.ts`, `src/shared/lib/utils.test.ts`, `src/test/setup.ts`, `components.json`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string`
- Produces: classes Tailwind `bg-paper`, `bg-card`, `bg-ink`, `bg-ink-soft`, `text-ink`, `text-muted`, `text-marker`, `bg-marker`, `bg-marker-soft`, `bg-leaf`, `bg-leaf-soft`, `border-line`, `font-display`, `font-body`, `rounded-home`
- Produces: alias de import `@/*` → `src/*`
- Produces: script `bun run test` (Vitest, ambiente jsdom)

- [ ] **Step 1: Instalar dependências**

```bash
bun add clsx tailwind-merge class-variance-authority @radix-ui/react-slot embla-carousel-react
bun add -d vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Configurar alias, Vitest e setup**

Em `tsconfig.app.json`, adicionar dentro de `compilerOptions`:

```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

In `vite.config.ts`, trocar a importação para `import { defineConfig } from 'vitest/config'` e adicionar `resolve.alias` usando `fileURLToPath(new URL('./src', import.meta.url))` (o config é ESM; `__dirname` não existe), além do bloco `test: { environment: 'jsdom', setupFiles: './src/test/setup.ts', globals: true }`. Em `package.json`, adicionar `"test": "vitest run"`.

`src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
```

Criar `components.json` com `style: "new-york"`, `tsx: true`, `rsc: false`, `tailwind.css: "src/index.css"`, `tailwind.config: ""`, e aliases `components`/`ui` → `@/shared/ui`, `utils`/`lib` → `@/shared/lib`, `hooks` → `@/shared/hooks`.

- [ ] **Step 3: Escrever o teste que falha de `cn`**

`src/shared/lib/utils.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('junta classes simples', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('a última classe do mesmo utilitário vence', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('ignora valores falsos', () => {
    expect(cn('a', false && 'b', undefined, null)).toBe('a');
  });
});
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `bun run test`
Expected: FAIL — `Cannot find module './utils'`.

- [ ] **Step 5: Implementar `cn` e os tokens**

`src/shared/lib/utils.ts`:

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Em `src/index.css`, depois dos imports e fora de `@layer base`, adicionar:

```css
@theme {
  --color-paper: #F5EBE6;
  --color-card: #FFFAF6;
  --color-ink: #2B2927;
  --color-ink-soft: #4A3C35;
  --color-muted: #6B5B52;
  --color-marker: #E08A4E;
  --color-marker-hover: #C97638;
  --color-marker-soft: #F6DCC8;
  --color-leaf: #7BAE7F;
  --color-leaf-soft: #DCEBDC;
  --color-line: rgba(107, 91, 82, 0.28);

  --font-display: 'Averia Libre', cursive;
  --font-body: 'Source Sans 3', system-ui, -apple-system, 'Segoe UI', sans-serif;

  --radius-home: 20px;

  /* Tokens que os componentes shadcn/ui consomem */
  --color-background: #F5EBE6;
  --color-foreground: #2B2927;
  --color-primary: #E08A4E;
  --color-primary-foreground: #2B2927;
  --color-secondary: #FFFAF6;
  --color-secondary-foreground: #2B2927;
  --color-muted-foreground: #6B5B52;
  --color-accent: #F6DCC8;
  --color-accent-foreground: #2B2927;
  --color-destructive: #B3261E;
  --color-destructive-foreground: #FFFFFF;
  --color-border: rgba(107, 91, 82, 0.28);
  --color-input: rgba(107, 91, 82, 0.28);
  --color-ring: #2B2927;
  --color-card-foreground: #2B2927;
  --color-popover: #FFFAF6;
  --color-popover-foreground: #2B2927;
}
```

Adicionar em `@layer base` a regra de foco global:

```css
:where(.pub) :focus-visible {
  outline: 3px solid var(--color-ink);
  outline-offset: 2px;
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `bun run test`
Expected: PASS — 3 testes.

- [ ] **Step 7: Verificar build e lint**

Run: `bun run build` e `bun run lint`
Expected: ambos sem erro.

- [ ] **Step 8: Commit**

```bash
git add package.json bun.lock vite.config.ts tsconfig.app.json src/index.css src/shared/lib src/test components.json
git commit -m "chore: prepara base de UI, tokens e testes"
```

---

### Task 2: Primitivas Button, Badge e Card

**Files:**
- Create: `src/shared/ui/button.tsx`, `src/shared/ui/badge.tsx`, `src/shared/ui/card.tsx`
- Test: `src/shared/ui/primitives.test.tsx`

**Interfaces:**
- Produces: `Button` — `React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }`; variantes `default | secondary | outline | ghost | link`; tamanhos `default | sm | lg | icon`
- Produces: `buttonVariants`
- Produces: `Badge` — variantes `default | accent | outline`
- Produces: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

- [ ] **Step 1: Escrever os testes que falham**

`src/shared/ui/primitives.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './badge';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';

describe('Button', () => {
  it('usa a variante primária por padrão', () => {
    render(<Button>Adotar</Button>);
    expect(screen.getByRole('button', { name: 'Adotar' })).toHaveClass('bg-primary');
  });

  it('renderiza como link com asChild', () => {
    render(
      <Button asChild variant="secondary">
        <a href="/adocao">Ver animais</a>
      </Button>,
    );
    expect(screen.getByRole('link', { name: 'Ver animais' })).toHaveAttribute('href', '/adocao');
  });

  it('respeita disabled', () => {
    render(<Button disabled>Enviar</Button>);
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  });
});

describe('Badge', () => {
  it('aplica a variante accent', () => {
    render(<Badge variant="accent">Dócil</Badge>);
    expect(screen.getByText('Dócil')).toHaveClass('bg-accent');
  });
});

describe('Card', () => {
  it('compõe título e conteúdo', () => {
    render(
      <Card>
        <CardHeader><CardTitle>Mel</CardTitle></CardHeader>
        <CardContent>2 anos</CardContent>
      </Card>,
    );
    expect(screen.getByRole('heading', { name: 'Mel' })).toBeInTheDocument();
    expect(screen.getByText('2 anos')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `bun run test src/shared/ui/primitives.test.tsx`
Expected: FAIL — módulos `./badge`, `./button`, `./card` não encontrados.

- [ ] **Step 3: Implementar as primitivas**

Copiar a estrutura do shadcn/ui v4 para os três arquivos, com estas adaptações obrigatórias:

- `Button` default: `bg-primary text-primary-foreground hover:bg-marker-hover`, `rounded-xl`, `font-bold`, `min-h-11`; `secondary`: `bg-card border border-line text-ink hover:bg-accent`; `ghost`: `border border-line`; `link`: `underline`.
- `Badge` default: `bg-leaf-soft text-ink`; `accent`: `bg-accent text-accent-foreground`; `outline`: `border border-line bg-transparent text-muted`.
- `Card` usa `bg-card border border-line rounded-home` e **sem sombra**; `CardTitle` usa `font-display`.
- Nenhum componente pode importar classes `pub-*`.

- [ ] **Step 4: Rodar e ver passar**

Run: `bun run test src/shared/ui/primitives.test.tsx`
Expected: PASS — 5 testes.

- [ ] **Step 5: Commit**

```bash
git add src/shared/ui/button.tsx src/shared/ui/badge.tsx src/shared/ui/card.tsx src/shared/ui/primitives.test.tsx
git commit -m "feat(ui): adiciona Button, Badge e Card com a identidade do projeto"
```

---

### Task 3: Carousel acessível

**Files:**
- Create: `src/shared/ui/carousel.tsx`
- Test: `src/shared/ui/carousel.test.tsx`

**Interfaces:**
- Produces: `type CarouselApi = UseEmblaCarouselType[1]`
- Produces: `Carousel({ opts?, setApi?, orientation?, className?, children })`
- Produces: `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext`
- Consumes: `cn` da Task 1, `Button` da Task 2

- [ ] **Step 1: Escrever o teste que falha**

`src/shared/ui/carousel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from './carousel';

function Demo() {
  return (
    <Carousel aria-label="Animais disponíveis">
      <CarouselContent>
        <CarouselItem>Mel</CarouselItem>
        <CarouselItem>Thor</CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

describe('Carousel', () => {
  it('expõe a região e os slides com rótulos', () => {
    render(<Demo />);
    expect(screen.getByRole('region', { name: 'Animais disponíveis' })).toHaveAttribute(
      'aria-roledescription',
      'carrossel',
    );
    expect(screen.getByRole('group', { name: 'Mel' })).toHaveAttribute(
      'aria-roledescription',
      'slide',
    );
  });

  it('oferece controles com nomes em português', () => {
    render(<Demo />);
    expect(screen.getByRole('button', { name: 'Animais anteriores' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Próximos animais' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `bun run test src/shared/ui/carousel.test.tsx`
Expected: FAIL — módulo `./carousel` não encontrado.

- [ ] **Step 3: Implementar o carrossel**

Adaptar o `carousel.tsx` do shadcn/ui v4 (Embla) com:
- `aria-roledescription="carrossel"` no container e `"slide"` em cada item, com `role="group"` e `aria-label` vindo do índice ("1 de 2" quando não houver nome).
- Botões com rótulos `Animais anteriores` / `Próximos animais`, variante `outline`, tamanho `icon`, e `disabled` conforme `canScrollPrev`/`canScrollNext`.
- Navegação por teclado: setas esquerda/direita chamam `scrollPrev`/`scrollNext` quando o foco está dentro da região.
- Região `aria-live="polite"` anunciando o slide atual ("2 de 3") a cada mudança.
- Respeitar `prefers-reduced-motion` nos opts do Embla (`duration: 0` quando reduzido).

- [ ] **Step 4: Rodar e ver passar**

Run: `bun run test src/shared/ui/carousel.test.tsx`
Expected: PASS — 2 testes.

- [ ] **Step 5: Commit**

```bash
git add src/shared/ui/carousel.tsx src/shared/ui/carousel.test.tsx
git commit -m "feat(ui): adiciona carrossel acessível com Embla"
```

---

### Task 4: Seleção de animais, rótulo de disponibilidade, reveal e hero

**Files:**
- Create: `src/features/public/lib/homeAnimals.ts`, `src/features/public/lib/homeAnimals.test.ts`
- Create: `src/features/public/hooks/useScrollReveal.ts`, `src/features/public/hooks/useScrollReveal.test.ts`
- Create: `src/features/public/components/HomeHero.tsx`, `src/features/public/components/HeroPhotoStack.tsx`, `src/features/public/components/Reveal.tsx`, `src/features/public/components/HomeHero.test.tsx`

**Interfaces:**
- Consumes: `Animal` de `../../animals/types/animal.types`; `AnimalPhoto` de `../../animals/components/AnimalPhoto`; `Button` e `Badge` das Tasks 2.
- Produces: `selectAvailableAnimals(animals: Animal[]): Animal[]` — mantém apenas `status === 'disponivel' && !isDeceased`.
- Produces: `availabilityLabel(input: { count: number; loading: boolean; failed: boolean }): string`.
- Produces: `useScrollReveal<T extends HTMLElement = HTMLDivElement>(): { ref: RefObject<T | null>; isVisible: boolean }`.
- Produces: `Reveal({ children, className }: { children: ReactNode; className?: string })` — aplica `data-visible` para o reveal de seção.
- Produces: `HomeHero({ animals, loading, failed }: { animals: Animal[]; loading: boolean; failed: boolean })`.
- Produces: `HeroPhotoStack({ animals }: { animals: Animal[] })`.

- [ ] **Step 0: Consultar referências no 21st.dev (sem custo de retrieval)**

Usar `get_inspiration` com as consultas `animal shelter website hero` e
`editorial collage hero`. Opcionalmente recuperar **no máximo dois** códigos com
`get_component` (ids 5905 e 19074) para ler composição e proporções — adaptar,
não copiar. Se vier paywall (`locked: true`), seguir apenas com os metadados.
Registrar no relatório quais referências informaram o hero.

- [ ] **Step 1: Escrever os testes que falham**

`src/features/public/lib/homeAnimals.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Animal } from '../../animals/types/animal.types';
import { availabilityLabel, selectAvailableAnimals } from './homeAnimals';

const base: Animal = {
  id: 1, name: 'Mel', sex: 'F', colorDescription: 'Caramelo', age: '2 anos',
  isNeutered: true, status: 'disponivel', behavior: 'docil', notes: null,
  isDeceased: false, photoUrl: null, createdAt: null, updatedAt: null,
};

describe('selectAvailableAnimals', () => {
  it('remove adotados, em processo, indisponíveis e falecidos', () => {
    const animals: Animal[] = [
      base,
      { ...base, id: 2, status: 'adotado' },
      { ...base, id: 3, status: 'em_processo' },
      { ...base, id: 4, status: 'indisponivel' },
      { ...base, id: 5, isDeceased: true },
    ];
    expect(selectAvailableAnimals(animals).map((a) => a.id)).toEqual([1]);
  });
});

describe('availabilityLabel', () => {
  it('descreve carregamento', () => {
    expect(availabilityLabel({ count: 0, loading: true, failed: false }))
      .toBe('Buscando peludinhos...');
  });
  it('descreve erro', () => {
    expect(availabilityLabel({ count: 0, loading: false, failed: true }))
      .toBe('Adoções no campus da UFOPA');
  });
  it('concorda no singular', () => {
    expect(availabilityLabel({ count: 1, loading: false, failed: false }))
      .toBe('1 peludinho esperando agora');
  });
  it('concorda no plural', () => {
    expect(availabilityLabel({ count: 3, loading: false, failed: false }))
      .toBe('3 peludinhos esperando agora');
  });
  it('descreve lista vazia', () => {
    expect(availabilityLabel({ count: 0, loading: false, failed: false }))
      .toBe('Nenhum peludinho disponível agora');
  });
});
```

`src/features/public/hooks/useScrollReveal.test.ts`:

```ts
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useScrollReveal } from './useScrollReveal';

describe('useScrollReveal', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('começa invisível e fica visível ao intersectar', () => {
    let callback: IntersectionObserverCallback = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal('IntersectionObserver', class {
      constructor(cb: IntersectionObserverCallback) { callback = cb; }
      observe() {}
      unobserve() {}
      disconnect = disconnect;
      takeRecords() { return []; }
      root = null;
      rootMargin = '';
      thresholds = [];
    });

    const { result, unmount } = renderHook(() => useScrollReveal());
    expect(result.current.isVisible).toBe(false);

    callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(result.current.isVisible).toBe(true);

    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});
```

`src/features/public/components/HomeHero.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Animal } from '../../animals/types/animal.types';
import { HomeHero } from './HomeHero';

const animal = (id: number, name: string): Animal => ({
  id, name, sex: 'F', colorDescription: 'Caramelo', age: '2 anos',
  isNeutered: true, status: 'disponivel', behavior: 'docil', notes: null,
  isDeceased: false, photoUrl: null, createdAt: null, updatedAt: null,
});

function renderHero(animals: Animal[], loading = false, failed = false) {
  return render(
    <MemoryRouter>
      <HomeHero animals={animals} loading={loading} failed={failed} />
    </MemoryRouter>,
  );
}

describe('HomeHero', () => {
  it('mostra título, contador e CTAs', () => {
    renderHero([animal(1, 'Mel'), animal(2, 'Thor'), animal(3, 'Luna')]);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Todo peludinho merece um lar');
    expect(screen.getByText('3 peludinhos esperando agora')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Conhecer os peludinhos/ })).toHaveAttribute('href', '/adocao');
    expect(screen.getByRole('link', { name: /Como funciona/ })).toHaveAttribute('href', '#como-funciona');
  });

  it('limita a pilha de fotos a três animais', () => {
    renderHero([animal(1, 'Mel'), animal(2, 'Thor'), animal(3, 'Luna'), animal(4, 'Bidu')]);
    expect(screen.getByText('Mel')).toBeInTheDocument();
    expect(screen.getByText('Luna')).toBeInTheDocument();
    expect(screen.queryByText('Bidu')).not.toBeInTheDocument();
  });

  it('mostra aviso de carregamento no contador', () => {
    renderHero([], true);
    expect(screen.getByText('Buscando peludinhos...')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `bun run test src/features/public`
Expected: FAIL — módulos ainda não existem.

- [ ] **Step 3: Implementar `homeAnimals.ts` e `useScrollReveal.ts`**

- `selectAvailableAnimals` usa `filter`.
- `availabilityLabel` segue exatamente os cinco textos dos testes, com a ordem de precedência: `loading` → `failed` → `count === 0` → singular/plural.
- `useScrollReveal` cria `IntersectionObserver` com `{ threshold: 0.15 }`, guarda o nó em `ref`, define `isVisible` na primeira interseção e desconecta o observer no cleanup. Se `IntersectionObserver` não existir, inicia visível (SSR/ambiente antigo).

- [ ] **Step 4: Implementar hero e pilha de fotos**

- `HomeHero`: `section` com grade `lg:grid-cols-[1.05fr_0.95fr]`, fundo `bg-paper`, textura de pontos via classe `home-paper` (definida na Task 8). Selo "Adoções abertas" com ponto `bg-leaf`. Título `font-display text-[clamp(44px,6.4vw,72px)] leading-[0.98] tracking-[-0.025em]`. Lead com o texto do spec. Contador usando `availabilityLabel`. CTA primário `Button asChild` → `/adocao`, secundário `variant="secondary"`.
- `HeroPhotoStack`: recebe os animais, usa `slice(0, 3)`, renderiza cada um em um `figure` com `AnimalPhoto` e etiqueta com nome + `Badge` do sexo (`SEX_LABEL` de `../../animals/constants/animal.labels`). Rotação por índice (`-3deg`, `2deg`, `-1.5deg`) e `data-visible` para a animação de entrada. Sem animais: três blocos com `PawIcon` e tons alternados, `aria-hidden`.
- `Reveal`: usa `useScrollReveal`, renderiza `<div ref={ref} data-visible={isVisible} className={cn('home-reveal', className)}>{children}</div>`.

- [ ] **Step 5: Rodar e ver passar**

Run: `bun run test src/features/public`
Expected: PASS — 10 testes (6 de lógica + 1 do hook + 3 do hero).

- [ ] **Step 6: Commit**

```bash
git add src/features/public/lib src/features/public/hooks src/features/public/components/HomeHero.tsx src/features/public/components/HeroPhotoStack.tsx src/features/public/components/Reveal.tsx src/features/public/components/HomeHero.test.tsx
git commit -m "feat(home): adiciona hero editorial e seleção de animais disponíveis"
```

---

### Task 5: Fita de cuidados e bento do projeto

**Files:**
- Create: `src/features/public/components/CareTicker.tsx`, `src/features/public/components/ProjectBento.tsx`, `src/features/public/components/ContentSections.test.tsx`

**Interfaces:**
- Produces: `CareTicker()` — sem props; lista fixa `['alimentação', 'saúde', 'castração', 'adoção responsável', 'vida livre no campus']`.
- Produces: `ProjectBento()` — sem props; quatro pilares com títulos exatos `Cuidados diários`, `Ações coletivas`, `Controle populacional`, `Conscientização`.

- [ ] **Step 1: Escrever os testes que falham**

`src/features/public/components/ContentSections.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CareTicker } from './CareTicker';
import { ProjectBento } from './ProjectBento';

describe('CareTicker', () => {
  it('expõe a lista acessível uma vez e duplica o visual escondido', () => {
    render(<CareTicker />);
    expect(screen.getByRole('region', { name: 'Cuidados do projeto' })).toBeInTheDocument();
    expect(screen.getAllByText('alimentação')).toHaveLength(2);
    expect(screen.getAllByText('alimentação')[1].closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('inclui os cinco cuidados', () => {
    render(<CareTicker />);
    ['saúde', 'castração', 'adoção responsável', 'vida livre no campus'].forEach((item) =>
      expect(screen.getAllByText(item).length).toBeGreaterThan(0),
    );
  });
});

describe('ProjectBento', () => {
  it('lista os quatro pilares com títulos h3', () => {
    render(<ProjectBento />);
    ['Cuidados diários', 'Ações coletivas', 'Controle populacional', 'Conscientização'].forEach(
      (title) => expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument(),
    );
  });

  it('preserva a referência à lei 9.605/98', () => {
    render(<ProjectBento />);
    expect(screen.getByText(/9\.605\/98/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `bun run test src/features/public/components/ContentSections.test.tsx`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar `CareTicker`**

`section` com `aria-label="Cuidados do projeto"`, fundo `bg-ink`, texto `text-paper`, altura 44px no desktop. Duas listas: a real e uma cópia `aria-hidden="true"` para o loop. Classe `care-ticker__track` anima com `@keyframes ticker` (Task 8). No mobile (<640px) a trilha vira `overflow-x-auto` sem animação.

- [ ] **Step 4: Implementar `ProjectBento`**

`section` com `id="projeto"`, `aria-labelledby="projeto-titulo"`, título `O projeto` e lead institucional atual. Grade `lg:grid-cols-4 lg:grid-rows-2`; tile grande `lg:col-span-2 lg:row-span-2` com fundo `bg-marker-soft`; "Ações coletivas" e "Controle populacional" em células 1×1; "Conscientização" `lg:col-span-2`. Textos dos pilares copiados do arquivo atual. Nota da lei em `border-t border-dashed border-line`.

- [ ] **Step 5: Rodar e ver passar**

Run: `bun run test src/features/public/components/ContentSections.test.tsx`
Expected: PASS — 4 testes.

- [ ] **Step 6: Commit**

```bash
git add src/features/public/components/CareTicker.tsx src/features/public/components/ProjectBento.tsx src/features/public/components/ContentSections.test.tsx
git commit -m "feat(home): adiciona fita de cuidados e bento do projeto"
```

---

### Task 6: Timeline de adoção e painel de contato

**Files:**
- Create: `src/features/public/components/AdoptionTimeline.tsx`, `src/features/public/components/ContactPanel.tsx`, `src/features/public/components/SupportSections.test.tsx`

**Interfaces:**
- Produces: `AdoptionTimeline()` — sem props; `ol` com os três passos atuais.
- Produces: `ContactPanel()` — sem props; três blocos `Local`, `Contato`, `Fonte`.

- [ ] **Step 1: Escrever os testes que falham**

`src/features/public/components/SupportSections.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AdoptionTimeline } from './AdoptionTimeline';
import { ContactPanel } from './ContactPanel';

describe('AdoptionTimeline', () => {
  it('apresenta os três passos em ordem', () => {
    render(<AdoptionTimeline />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Escolha um peludinho');
    expect(items[1]).toHaveTextContent('Manifeste seu interesse');
    expect(items[2]).toHaveTextContent('Converse com a equipe');
  });
});

describe('ContactPanel', () => {
  it('mostra local, contato, fonte e CTA', () => {
    render(
      <MemoryRouter>
        <ContactPanel />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Local' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Contato' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Fonte' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Venha nos visitar' })).toBeInTheDocument();
    expect(screen.getByText(/Cintya Martins/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Notícia na UFOPA/ })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
    expect(screen.getByRole('link', { name: /Quero adotar/ })).toHaveAttribute('href', '/adocao');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `bun run test src/features/public/components/SupportSections.test.tsx`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar as duas seções**

- `AdoptionTimeline`: `section` `aria-labelledby="como-funciona"`, `ol` com `lg:grid-cols-3` e linha tracejada via `before` (CSS na Task 8). Cada item tem círculo numerado `bg-marker text-ink font-display`, `h3` e parágrafo. Mobile: linha vertical à esquerda.
- `ContactPanel`: `section` `aria-labelledby="contato-titulo"` com `h2` "Venha nos visitar"; card `bg-ink-soft text-paper rounded-[28px]`, grade de 3 colunas; ícones `MapPin`, `GraduationCap`, `Newspaper`; link externo com `target="_blank"` e a URL atual; CTA `Button asChild` → `/adocao` com texto "Quero adotar"; link "Acesso da equipe" → `/login` com foco claro (`focus-visible:outline-paper`).

- [ ] **Step 4: Rodar e ver passar**

Run: `bun run test src/features/public/components/SupportSections.test.tsx`
Expected: PASS — 2 testes.

- [ ] **Step 5: Commit**

```bash
git add src/features/public/components/AdoptionTimeline.tsx src/features/public/components/ContactPanel.tsx src/features/public/components/SupportSections.test.tsx
git commit -m "feat(home): adiciona timeline de adoção e painel de contato"
```

---

### Task 7: Carrossel de animais em destaque com estados

**Files:**
- Create: `src/features/public/components/FeaturedAnimals.tsx`, `src/features/public/components/FeaturedAnimals.test.tsx`

**Interfaces:**
- Consumes: `Animal`, `AnimalCard` não é usado (card novo é próprio), `Carousel` da Task 3, `Badge`/`Button` da Task 2, `AnimalPhoto`.
- Produces: `FeaturedAnimals({ animals, loading, failed }: { animals: Animal[]; loading: boolean; failed: boolean })` — renderiza no máximo 8.

- [ ] **Step 1: Escrever os testes que falham**

`src/features/public/components/FeaturedAnimals.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Animal } from '../../animals/types/animal.types';
import { FeaturedAnimals } from './FeaturedAnimals';

const animal = (id: number, name: string, status: Animal['status'] = 'disponivel'): Animal => ({
  id, name, sex: 'F', colorDescription: 'Caramelo', age: '2 anos',
  isNeutered: true, status, behavior: 'docil', notes: null,
  isDeceased: false, photoUrl: null, createdAt: null, updatedAt: null,
});

function renderSection(animals: Animal[], loading = false, failed = false) {
  return render(
    <MemoryRouter>
      <FeaturedAnimals animals={animals} loading={loading} failed={failed} />
    </MemoryRouter>,
  );
}

describe('FeaturedAnimals', () => {
  it('mostra no máximo oito animais', () => {
    const many = Array.from({ length: 12 }, (_, i) => animal(i + 1, `Animal ${i + 1}`));
    renderSection(many);
    expect(screen.getAllByRole('group', { name: /Animal \d+ de 8/ })).toHaveLength(8);
  });

  it('mostra skeletons durante o carregamento', () => {
    renderSection([], true);
    expect(screen.getAllByTestId('animal-skeleton')).toHaveLength(3);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('mostra estado vazio', () => {
    renderSection([]);
    expect(screen.getByText('Nenhum peludinho disponível agora')).toBeInTheDocument();
  });

  it('mostra erro com saída', () => {
    renderSection([], false, true);
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar');
    expect(screen.getByRole('link', { name: 'Tentar novamente' })).toHaveAttribute('href', '/');
  });

  it('linka para a listagem completa', () => {
    renderSection([animal(1, 'Mel')]);
    expect(screen.getByRole('link', { name: 'Ver todos' })).toHaveAttribute('href', '/adocao');
  });

  it('exibe nome e ações do animal', () => {
    renderSection([animal(1, 'Mel')]);
    expect(screen.getByText('Mel')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver mais' })).toHaveAttribute('href', '/adocao/1');
    expect(screen.getByRole('link', { name: 'Tenho interesse' })).toHaveAttribute(
      'href',
      '/adocao/1/intencao',
    );
  });

  it('quebra nomes longos sem estourar o card', () => {
    renderSection([animal(1, 'Princesa Isabel do Campus Santarém')]);
    expect(screen.getByText('Princesa Isabel do Campus Santarém')).toHaveClass('break-words');
  });

  it('troca foto quebrada pelo fallback de pata', () => {
    const withPhoto = { ...animal(1, 'Mel'), photoUrl: 'https://example.com/mel.jpg' };
    const { container } = renderSection([withPhoto]);
    fireEvent.error(screen.getByRole('img', { name: 'Foto de Mel' }));
    expect(screen.queryByRole('img', { name: 'Foto de Mel' })).not.toBeInTheDocument();
    expect(container.querySelector('.animal-photo--card')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `bun run test src/features/public/components/FeaturedAnimals.test.tsx`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `FeaturedAnimals`**

- Cabeçalho: `h2` "Quem está esperando", contador `{n} disponíveis`, link "Ver todos".
- Loading: três blocos `data-testid="animal-skeleton"` com `aspect-[4/3]` e `animate-pulse` (desligado em reduced motion).
- Erro: `role="alert"` com "Não foi possível carregar os peludinhos agora. Verifique sua conexão e tente de novo." e link "Tentar novamente" para `/` (recarrega a home).
- Vazio: card tracejado, `PawIcon`, "Nenhum peludinho disponível agora" e link "Conhecer o projeto" → `/#projeto`.
- Lista: `animals.slice(0, 8)`, `Carousel` com `aria-label="Peludinhos disponíveis para adoção"`; cada `CarouselItem` recebe `aria-label={`${animal.name} de ${total}`}`. Card: foto 4:3, etiqueta com nome, `Badge` de sexo e comportamento, idade/cor, ações. Nome com `line-clamp-2` e `break-words`; selos com `flex-wrap`.
- Fallback de foto garantido por `AnimalPhoto` (já existe); não duplicar lógica.

- [ ] **Step 4: Rodar e ver passar**

Run: `bun run test src/features/public/components/FeaturedAnimals.test.tsx`
Expected: PASS — 8 testes.

- [ ] **Step 5: Commit**

```bash
git add src/features/public/components/FeaturedAnimals.tsx src/features/public/components/FeaturedAnimals.test.tsx
git commit -m "feat(home): adiciona carrossel de animais com estados de carga, vazio e erro"
```

---

### Task 8: Composição da home, estilos de movimento e ajustes do layout público

**Files:**
- Modify: `src/features/public/pages/PublicHomePage.tsx`, `src/features/public/pages/PublicHomePage.css`, `src/shared/layouts/PublicLayout.tsx`, `src/shared/layouts/PublicLayout.css`
- Test: `src/features/public/pages/PublicHomePage.test.tsx`

**Interfaces:**
- Consumes: todas as seções das Tasks 4–7, `useAvailableAnimals`, `selectAvailableAnimals`.
- Produces: `PublicHomePage()` compondo `HomeHero`, `CareTicker`, `ProjectBento`, `AdoptionTimeline`, `FeaturedAnimals`, `ContactPanel`.

- [ ] **Step 1: Escrever o teste que falha**

`src/features/public/pages/PublicHomePage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Animal } from '../../animals/types/animal.types';
import { useAvailableAnimals } from '../../animals/hooks/useAnimals';
import { PublicHomePage } from './PublicHomePage';

vi.mock('../../animals/hooks/useAnimals', () => ({ useAvailableAnimals: vi.fn() }));

const animal = (id: number, name: string, status: Animal['status']): Animal => ({
  id, name, sex: 'F', colorDescription: 'Caramelo', age: '2 anos',
  isNeutered: true, status, behavior: 'docil', notes: null,
  isDeceased: false, photoUrl: null, createdAt: null, updatedAt: null,
});

describe('PublicHomePage', () => {
  beforeEach(() => {
    vi.mocked(useAvailableAnimals).mockReturnValue({
      animals: [animal(1, 'Mel', 'disponivel'), animal(2, 'Bidu', 'adotado')],
      loading: false,
      failed: false,
    });
  });

  it('compõe as cinco seções principais', () => {
    render(<MemoryRouter><PublicHomePage /></MemoryRouter>);
    ['O projeto', 'Como funciona a adoção', 'Quem está esperando', 'Venha nos visitar'].forEach(
      (title) => expect(screen.getByRole('heading', { name: title })).toBeInTheDocument(),
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Todo peludinho merece um lar');
  });

  it('não exibe animal adotado', () => {
    render(<MemoryRouter><PublicHomePage /></MemoryRouter>);
    expect(screen.queryByText('Bidu')).not.toBeInTheDocument();
    expect(screen.getByText('1 peludinho esperando agora')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `bun run test src/features/public/pages/PublicHomePage.test.tsx`
Expected: FAIL — a página atual não renderiza as novas seções nem filtra.

- [ ] **Step 3: Reescrever a página**

`PublicHomePage.tsx`:

```tsx
const { animals, loading, failed } = useAvailableAnimals();
const available = selectAvailableAnimals(animals);

// importar Reveal de '../components/Reveal'
return (
  <>
    <HomeHero animals={available} loading={loading} failed={failed} />
    <CareTicker />
    <Reveal><ProjectBento /></Reveal>
    <Reveal><AdoptionTimeline /></Reveal>
    <Reveal><FeaturedAnimals animals={available} loading={loading} failed={failed} /></Reveal>
    <ContactPanel />
  </>
);
```

Remover imports e JSX antigos (FACTS, PILLARS, STEPS, grade `AnimalCard`, cards de contato). Não alterar os textos institucionais.

- [ ] **Step 4: Reescrever `PublicHomePage.css`**

Manter apenas: textura `home-paper` (radial-gradient de 1px a 6% de opacidade), keyframes `hero-in`, `stack-settle`, `ticker`, `reveal`, classes `.home-paper`, `.home-reveal`/`.home-reveal[data-visible='true']`, `.care-ticker__track`, e a linha tracejada da timeline (`::before`). Todas as animações dentro de `@media (prefers-reduced-motion: no-preference)`; fora dela, estados finais aplicados direto. Remover todo o CSS antigo de hero/pilares/passos/info que não for reutilizado.

- [ ] **Step 5: Ajustar `PublicLayout`**

Adicionar link "Animais" → `/adocao` no `nav` (antes do CTA). No CSS do cabeçalho, trocar o fundo para `rgba(255, 250, 246, 0.88)` com `backdrop-filter: blur(8px)` e `-webkit-backdrop-filter`. Manter cores, menu mobile e rodapé; apenas ajustar `padding-block` do rodapé para 32px. Não remover nenhuma classe `pub-*`.

- [ ] **Step 6: Rodar e ver passar**

Run: `bun run test`
Expected: PASS — todos os testes do projeto.

- [ ] **Step 7: Build e lint**

Run: `bun run build` e `bun run lint`
Expected: sem erro. Se `noUnusedLocals` acusar import antigo, remover o import.

- [ ] **Step 8: Commit**

```bash
git add src/features/public/pages src/shared/layouts/PublicLayout.tsx src/shared/layouts/PublicLayout.css
git commit -m "feat(home): compõe nova homepage e ajusta cabeçalho público"
```

---

### Task 9: QA visual e de acessibilidade com Playwright

**Files:**
- Create (temporário, fora do git): `.superpowers/sdd/home-qa/fixture.json`
- Modify: componentes conforme defeitos encontrados

**Interfaces:**
- Consumes: dev server em `http://localhost:5173`.

**Ambiente:** nesta máquina a execução de scripts `.ps1` está bloqueada. Chamar
o CLI pelo shim `.cmd`: `& "$env:APPDATA\npm\playwright-cli.cmd" ...` no lugar de
`playwright-cli ...`.

- [ ] **Step 1: Subir o servidor com API same-origin**

Run (background): `$env:VITE_API_URL='/api'; bun run dev`
Expected: Vite em `http://localhost:5173`. O override de ambiente tem
precedência sobre o `.env`, então o fetch vira same-origin e a interceptação
não esbarra em CORS.

- [ ] **Step 2: Criar o fixture da API**

`.superpowers/sdd/home-qa/fixture.json` com o shape `Page<ApiAnimal>`:

```json
{
  "items": [
    { "animal_id": 1, "name": "Mel", "sex": "F", "color_description": "Caramelo", "age": "2 anos", "is_neutered": true, "status": "disponivel", "behavior": "docil", "notes": null, "is_deceased": false, "photo_path": null, "photo_url": "https://images.unsplash.com/photo-1552053831-71594a27632d?w=900&q=80", "fk_administrator_member_id": null, "fk_mother": null, "created_at": null, "updated_at": null },
    { "animal_id": 2, "name": "Thor", "sex": "M", "color_description": "Preto e branco", "age": "3 anos", "is_neutered": true, "status": "disponivel", "behavior": "sociavel", "notes": null, "is_deceased": false, "photo_path": null, "photo_url": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=900&q=80", "fk_administrator_member_id": null, "fk_mother": null, "created_at": null, "updated_at": null },
    { "animal_id": 3, "name": "Luna", "sex": "F", "color_description": "Tricolor", "age": "1 ano", "is_neutered": false, "status": "disponivel", "behavior": "assustado", "notes": null, "is_deceased": false, "photo_path": null, "photo_url": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=900&q=80", "fk_administrator_member_id": null, "fk_mother": null, "created_at": null, "updated_at": null },
    { "animal_id": 4, "name": "Bidu", "sex": "M", "color_description": "Caramelo", "age": "5 anos", "is_neutered": true, "status": "adotado", "behavior": "docil", "notes": null, "is_deceased": false, "photo_path": null, "photo_url": "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=900&q=80", "fk_administrator_member_id": null, "fk_mother": null, "created_at": null, "updated_at": null }
  ],
  "total": 4,
  "limit": 200,
  "offset": 0
}
```

- [ ] **Step 3: Interceptar a API e capturar as três larguras**

```bash
playwright-cli open http://localhost:5173
playwright-cli route "**/api/animals*" --body "$(Get-Content -Raw .superpowers/sdd/home-qa/fixture.json)"
playwright-cli reload
playwright-cli resize 1280 900
playwright-cli screenshot --filename=.superpowers/sdd/home-qa/home-1280.png
playwright-cli resize 768 1024
playwright-cli screenshot --filename=.superpowers/sdd/home-qa/home-768.png
playwright-cli resize 360 800
playwright-cli screenshot --filename=.superpowers/sdd/home-qa/home-360.png
```

Expected: 3 capturas. Revisar cada uma com a ferramenta de leitura de imagem: sem overflow horizontal, hero com 3 fotos, contador "3 peludinhos esperando agora", nenhum texto cortado, Bidu (adotado) ausente.

- [ ] **Step 4: Checar teclado e foco**

```bash
playwright-cli press Tab
playwright-cli snapshot
playwright-cli press Tab
playwright-cli snapshot
```

Expected: ordem de foco visível e coerente; nenhum elemento interativo pulado. No card de contato, o anel de foco é claro sobre o marrom.

- [ ] **Step 5: Checar movimento reduzido**

```bash
playwright-cli set-reduced-motion reduce
playwright-cli reload
playwright-cli eval "getComputedStyle(document.querySelector('.care-ticker__track')).animationName"
```

Expected: `"none"`. Repetir sem reduced motion e esperar `"ticker"`.

- [ ] **Step 6: Checar os estados de erro e vazio**

```bash
playwright-cli route "**/api/animals*" --status=500 --body "{}"
playwright-cli reload
playwright-cli screenshot --filename=.superpowers/sdd/home-qa/home-erro.png
playwright-cli unroute "**/api/animals*"
playwright-cli route "**/api/animals*" --body "{\"items\":[],\"total\":0,\"limit\":200,\"offset\":0}"
playwright-cli reload
playwright-cli screenshot --filename=.superpowers/sdd/home-qa/home-vazio.png
```

Expected: erro mostra alerta e "Tentar novamente"; vazio mostra o card tracejado. Hero cai no fallback de patas nos dois casos.

- [ ] **Step 7: Revisar contra o frontend-design**

Percorrer a checklist do skill `frontend-design` sobre as capturas:

- Um único gesto ousado (pilha de fotos) e todo o resto disciplinado.
- Nenhuma marca de template: sem eyebrow em caixa-alta, sem "01/02/03"
  decorativo fora da timeline, sem cards idênticos com o mesmo raio/sombra, sem
  gradiente de enfeite, sem "→" colado em todo link.
- Escala tipográfica coerente; corpo com no máximo 60–72ch.
- Contraste AA em todos os textos, inclusive no card marrom.
- Espaçamento entre seções consistente (`clamp(56px, 8vw, 96px)`).

Anotar os desvios e corrigi-los no Step 8.

- [ ] **Step 8: Corrigir defeitos encontrados**

Para cada defeito visual: adicionar ou ajustar um teste que o reproduza (quando for regra de layout/lógica), ver falhar, corrigir, ver passar, e rodar `bun run test` completo. Defeitos puramente ópticos (espaçamento) podem ser corrigidos direto, com nova captura antes do commit.

- [ ] **Step 9: Verificação final**

Run: `bun run test`, `bun run lint`, `bun run build`
Expected: todos verdes.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "fix(home): ajustes finais de QA visual e acessibilidade"
```

---

## Notas de execução

- Não usar `AnimalCard` na home: o card novo é específico do carrossel e evita alterar `animals.css`.
- Se o `Carousel` do shadcn exigir `embla-carousel-autoplay`, **não instalar**; autoplay não faz parte do design.
- Se `shadcn` gerar classes com `--radius` não definido, usar `rounded-xl`/`rounded-home` diretamente nos componentes.
- Os testes de seção usam `MemoryRouter` porque os CTAs são `Link`.
- Qualquer desvio deste plano exige uma linha `Ruling:` no ledger da execução, com motivo e custo se estiver errado.
