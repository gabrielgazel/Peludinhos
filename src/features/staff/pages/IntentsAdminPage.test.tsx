import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '../../../shared/api/httpsClient';
import { formatDateTime } from '../../../shared/utils/format';
import type { AdoptionIntent, IntentAnimal, IntentVisitor } from '../../adoption/types/adoption.types';
import { adoptionService } from '../../adoption/services/adoptionService';
import { IntentsAdminPage } from './IntentsAdminPage';

vi.mock('../../adoption/services/adoptionService', () => ({
  adoptionService: { list: vi.fn(), review: vi.fn() },
}));

function makeVisitor(partial: Partial<IntentVisitor> & { id: number; name: string }): IntentVisitor {
  return {
    email: `${partial.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    isUfopaMember: false,
    hasPet: false,
    cpf: null,
    ...partial,
  };
}

function makeAnimal(partial: Partial<IntentAnimal> & { id: number; name: string }): IntentAnimal {
  return {
    sex: 'F',
    age: null,
    colorDescription: null,
    status: 'disponivel',
    behavior: 'docil',
    isNeutered: false,
    ...partial,
  };
}

function makeIntent(partial: Partial<AdoptionIntent> & { id: number }): AdoptionIntent {
  return {
    motivation: 'Motivação padrão.',
    status: 'pendente',
    animalId: 5,
    visitorId: 10,
    createdAt: '2026-01-15T14:30:00',
    updatedAt: null,
    visitor: null,
    animal: null,
    ...partial,
  };
}

const anaVisitor = makeVisitor({
  id: 10,
  name: 'Ana Visitante',
  email: 'ana@example.com',
  isUfopaMember: true,
  hasPet: true,
});

const brunoVisitor = makeVisitor({
  id: 11,
  name: 'Bruno Visitante',
  email: 'bruno@example.com',
  isUfopaMember: false,
  hasPet: false,
});

const carlaVisitor = makeVisitor({
  id: 12,
  name: 'Carla Visitante',
  email: 'carla@example.com',
  isUfopaMember: true,
  hasPet: false,
});

const diegoVisitor = makeVisitor({
  id: 13,
  name: 'Diego Visitante',
  email: 'diego@example.com',
  isUfopaMember: false,
  hasPet: true,
});

const mel = makeAnimal({ id: 5, name: 'Mel', sex: 'F' });
const thor = makeAnimal({ id: 6, name: 'Thor', sex: 'M' });
const luna = makeAnimal({ id: 7, name: 'Luna', sex: 'F' });
const pipoca = makeAnimal({ id: 8, name: 'Pipoca', sex: 'M' });

const pendenteCompleta = makeIntent({
  id: 1,
  motivation: 'Tenho espaço em casa e quero ajudar.',
  status: 'pendente',
  animalId: 5,
  visitorId: 10,
  createdAt: '2026-01-15T14:30:00',
  visitor: anaVisitor,
  animal: mel,
});

const pendenteFallback = makeIntent({
  id: 2,
  motivation: 'Motivação do visitante sem cadastro completo.',
  status: 'pendente',
  animalId: 99,
  visitorId: 77,
  createdAt: '2026-02-10T10:00:00',
  visitor: null,
  animal: null,
});

const aprovada = makeIntent({
  id: 3,
  motivation: 'Motivação aprovada.',
  status: 'aprovada',
  animalId: 6,
  visitorId: 11,
  createdAt: '2026-02-11T11:00:00',
  visitor: brunoVisitor,
  animal: thor,
});

const rejeitada = makeIntent({
  id: 4,
  motivation: 'Motivação rejeitada.',
  status: 'rejeitada',
  animalId: 7,
  visitorId: 12,
  createdAt: '2026-02-12T12:00:00',
  visitor: carlaVisitor,
  animal: luna,
});

const cancelada = makeIntent({
  id: 5,
  motivation: 'Motivação cancelada.',
  status: 'cancelada',
  animalId: 8,
  visitorId: 13,
  createdAt: '2026-02-13T13:00:00',
  visitor: diegoVisitor,
  animal: pipoca,
});

const fixtures = [pendenteCompleta, pendenteFallback, aprovada, rejeitada, cancelada];

function page(items: AdoptionIntent[]) {
  return { items, total: items.length, limit: 200, offset: 0 };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <IntentsAdminPage />
    </MemoryRouter>,
  );
}

function setupList(items: AdoptionIntent[] = fixtures) {
  vi.mocked(adoptionService.list).mockResolvedValue(page(items));
  vi.mocked(adoptionService.review).mockImplementation(async (id: number) => {
    const found = fixtures.find((intent) => intent.id === id) ?? pendenteCompleta;
    return found;
  });
}

async function articleByMotivation(motivation: string) {
  await screen.findByText(motivation);
  const article = screen.getByText(motivation).closest('article');
  if (!article) throw new Error('article não encontrado');
  return article as HTMLElement;
}

describe('IntentsAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupList();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('busca com status pendente e limit 200 no início', async () => {
    renderPage();

    await screen.findByText(pendenteCompleta.motivation);
    await waitFor(() => {
      expect(vi.mocked(adoptionService.list)).toHaveBeenCalledWith({
        status: 'pendente',
        limit: 200,
      });
    });

    expect(screen.getByRole('heading', { name: 'Intenções de adoção' })).toBeInTheDocument();
    expect(
      screen.getByText('Avalie os pedidos manifestados pelos visitantes.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Todas as intenções' })).toBeInTheDocument();
  });

  it('lista nome e e-mail do visitante, meta Ufopa/hasPet, animal, link e data formatada', async () => {
    renderPage();

    const article = await articleByMotivation(pendenteCompleta.motivation);
    expect(within(article).getByText('Ana Visitante')).toBeInTheDocument();
    expect(within(article).getByText(/ana@example\.com/)).toBeInTheDocument();
    expect(within(article).getByText(/comunidade Ufopa/)).toBeInTheDocument();
    expect(within(article).getByText(/já tem animal/)).toBeInTheDocument();
    expect(within(article).getByText(/Quer adotar/)).toBeInTheDocument();
    expect(within(article).getByText(pendenteCompleta.motivation)).toBeInTheDocument();

    const link = within(article).getByRole('link', { name: /Mel/ });
    expect(link).toHaveAttribute('href', '/adocao/5');
    expect(link).toHaveClass('text-staff-ink');
    expect(link).toHaveClass('underline');
    expect(link).toHaveClass('decoration-staff-line');
    expect(link).not.toHaveClass('text-staff-accent');

    expect(article.textContent).toContain(formatDateTime(pendenteCompleta.createdAt));
    expect(article.textContent).toContain('· pedido em');

    const nome = within(article).getByText('Ana Visitante');
    expect(nome).toHaveClass('font-semibold');
    expect(nome).toHaveClass('text-staff-ink');
  });

  it('usa fallbacks Visitante #id, Animal #id e — quando faltam dados', async () => {
    renderPage();

    const article = await articleByMotivation(pendenteFallback.motivation);
    expect(within(article).getByText('Visitante #77')).toBeInTheDocument();
    expect(within(article).getByText(/—/)).toBeInTheDocument();
    expect(within(article).queryByText(/comunidade Ufopa/)).not.toBeInTheDocument();
    expect(within(article).queryByText(/já tem animal/)).not.toBeInTheDocument();

    const link = within(article).getByRole('link', { name: /Animal #99/ });
    expect(link).toHaveAttribute('href', '/adocao/99');
    expect(article.textContent).toContain(formatDateTime(pendenteFallback.createdAt));
  });

  it('exibe badges por status com tons novos', async () => {
    renderPage();

    const pendenteArticle = await articleByMotivation(pendenteCompleta.motivation);
    const pendenteBadge = within(pendenteArticle).getByText('Pendente');
    expect(pendenteBadge).toHaveClass('rounded-full');
    expect(pendenteBadge).toHaveClass('bg-staff-accent-soft');
    expect(pendenteBadge).toHaveClass('text-staff-ink');

    const aprovadaArticle = await articleByMotivation(aprovada.motivation);
    const aprovadaBadge = within(aprovadaArticle).getByText('Aprovada');
    expect(aprovadaBadge).toHaveClass('rounded-full');
    expect(aprovadaBadge).toHaveClass('bg-staff-success/20');

    const rejeitadaArticle = await articleByMotivation(rejeitada.motivation);
    const rejeitadaBadge = within(rejeitadaArticle).getByText('Rejeitada');
    expect(rejeitadaBadge).toHaveClass('rounded-full');
    expect(rejeitadaBadge).toHaveClass('text-staff-danger');
    expect(rejeitadaBadge).toHaveClass('bg-staff-danger/10');

    const canceladaArticle = await articleByMotivation(cancelada.motivation);
    const canceladaBadge = within(canceladaArticle).getByText('Cancelada');
    expect(canceladaBadge).toHaveClass('rounded-full');
    expect(canceladaBadge).toHaveClass('text-staff-muted');
  });

  it('mostra Aprovar e Rejeitar só para status pendente', async () => {
    renderPage();

    const pendenteArticle = await articleByMotivation(pendenteCompleta.motivation);
    expect(
      within(pendenteArticle).getByRole('button', { name: 'Aprovar' }),
    ).toBeInTheDocument();
    expect(
      within(pendenteArticle).getByRole('button', { name: 'Rejeitar' }),
    ).toBeInTheDocument();

    const fallbackArticle = await articleByMotivation(pendenteFallback.motivation);
    expect(
      within(fallbackArticle).getByRole('button', { name: 'Aprovar' }),
    ).toBeInTheDocument();
    expect(
      within(fallbackArticle).getByRole('button', { name: 'Rejeitar' }),
    ).toBeInTheDocument();

    for (const nonPending of [aprovada, rejeitada, cancelada]) {
      const article = await articleByMotivation(nonPending.motivation);
      expect(within(article).queryByRole('button', { name: 'Aprovar' })).not.toBeInTheDocument();
      expect(within(article).queryByRole('button', { name: 'Rejeitar' })).not.toBeInTheDocument();
    }
  });

  it('oferece Ver termo de adoção (demo) só para intenções aprovadas', async () => {
    renderPage();

    const aprovadaArticle = await articleByMotivation(aprovada.motivation);
    const button = within(aprovadaArticle).getByRole('button', {
      name: 'Ver termo de adoção (demo)',
    });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-controls', `termo-demo-${aprovada.id}`);

    for (const other of [pendenteCompleta, rejeitada, cancelada]) {
      const article = await articleByMotivation(other.motivation);
      expect(
        within(article).queryByRole('button', { name: /termo de adoção/i }),
      ).not.toBeInTheDocument();
    }
  });

  it('abre o termo com os dados da intenção aprovada sem escrever nem recarregar', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    renderPage();

    const aprovadaArticle = await articleByMotivation(aprovada.motivation);
    await waitFor(() => {
      expect(vi.mocked(adoptionService.list)).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(
      within(aprovadaArticle).getByRole('button', { name: 'Ver termo de adoção (demo)' }),
    );

    const panel = await screen.findByRole('region', { name: /Termo de adoção/i });
    expect(within(panel).getByText('Bruno Visitante')).toBeInTheDocument();
    expect(within(panel).getByText('Thor')).toBeInTheDocument();
    expect(within(panel).getByText('DEMONSTRAÇÃO')).toBeInTheDocument();
    expect(
      within(panel).getByText('Dados de demonstração - esta área ainda não persiste no banco'),
    ).toBeInTheDocument();
    expect(within(panel).getByText(/backlog \(B3\)/i)).toBeInTheDocument();

    expect(within(aprovadaArticle).getByRole('button', {
      name: 'Ver termo de adoção (demo)',
    })).toHaveAttribute('aria-expanded', 'true');
    expect(vi.mocked(adoptionService.review)).not.toHaveBeenCalled();
    expect(vi.mocked(adoptionService.list)).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('clicar Aprovar chama review com aprovada e refaz a busca via reload', async () => {
    renderPage();

    const article = await articleByMotivation(pendenteCompleta.motivation);
    await waitFor(() => {
      expect(vi.mocked(adoptionService.list)).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(within(article).getByRole('button', { name: 'Aprovar' }));

    await waitFor(() => {
      expect(vi.mocked(adoptionService.review)).toHaveBeenCalledWith(1, 'aprovada');
    });
    await waitFor(() => {
      expect(vi.mocked(adoptionService.list)).toHaveBeenCalledTimes(2);
    });
  });

  it('clicar Rejeitar chama review com rejeitada', async () => {
    renderPage();

    const article = await articleByMotivation(pendenteCompleta.motivation);
    await waitFor(() => {
      expect(vi.mocked(adoptionService.list)).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(within(article).getByRole('button', { name: 'Rejeitar' }));

    await waitFor(() => {
      expect(vi.mocked(adoptionService.review)).toHaveBeenCalledWith(1, 'rejeitada');
    });
    await waitFor(() => {
      expect(vi.mocked(adoptionService.list)).toHaveBeenCalledTimes(2);
    });
  });

  it('durante a promise pendente, ambos os botões ficam disabled', async () => {
    let resolveReview: (value: AdoptionIntent) => void = () => {};
    vi.mocked(adoptionService.review).mockReturnValue(
      new Promise<AdoptionIntent>((resolve) => {
        resolveReview = resolve;
      }),
    );

    renderPage();

    const article = await articleByMotivation(pendenteCompleta.motivation);
    fireEvent.click(within(article).getByRole('button', { name: 'Aprovar' }));

    expect(
      within(article).getByRole('button', { name: 'Aprovar' }),
    ).toBeDisabled();
    expect(
      within(article).getByRole('button', { name: 'Rejeitar' }),
    ).toBeDisabled();

    resolveReview(pendenteCompleta);

    await waitFor(() => {
      expect(vi.mocked(adoptionService.list)).toHaveBeenCalledTimes(2);
    });
    const freshArticle = await articleByMotivation(pendenteCompleta.motivation);
    await waitFor(() => {
      expect(
        within(freshArticle).getByRole('button', { name: 'Aprovar' }),
      ).not.toBeDisabled();
    });
  });

  it('erro de review com HttpError mostra a mensagem do HttpError em role="alert"', async () => {
    vi.mocked(adoptionService.review).mockRejectedValueOnce(
      new HttpError(400, 'Intenção já avaliada.', null),
    );

    renderPage();

    const article = await articleByMotivation(pendenteCompleta.motivation);
    fireEvent.click(within(article).getByRole('button', { name: 'Aprovar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Intenção já avaliada.');
  });

  it('erro de review sem HttpError mostra o fallback em role="alert"', async () => {
    vi.mocked(adoptionService.review).mockRejectedValueOnce(new Error('falha qualquer'));

    renderPage();

    const article = await articleByMotivation(pendenteCompleta.motivation);
    fireEvent.click(within(article).getByRole('button', { name: 'Rejeitar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível avaliar a intenção.',
    );
  });

  it('erro de listagem mostra alerta com a mensagem', async () => {
    vi.mocked(adoptionService.list).mockRejectedValueOnce(new Error('rede indisponível'));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('rede indisponível');
  });

  it('troca do filtro chama list com status correto e limit 200', async () => {
    renderPage();

    await screen.findByText(pendenteCompleta.motivation);
    expect(vi.mocked(adoptionService.list)).toHaveBeenCalledWith({
      status: 'pendente',
      limit: 200,
    });

    fireEvent.change(screen.getByLabelText(/Status/i), {
      target: { value: 'todas' },
    });

    await waitFor(() => {
      expect(vi.mocked(adoptionService.list)).toHaveBeenCalledWith({
        status: undefined,
        limit: 200,
      });
    });

    fireEvent.change(screen.getByLabelText(/Status/i), {
      target: { value: 'aprovada' },
    });

    await waitFor(() => {
      expect(vi.mocked(adoptionService.list)).toHaveBeenCalledWith({
        status: 'aprovada',
        limit: 200,
      });
    });
  });

  it('mostra Carregando intenções... enquanto carrega', () => {
    vi.mocked(adoptionService.list).mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(screen.getByText('Carregando intenções...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Carregando intenções...');
  });

  it('mostra o estado vazio com o texto exato quando não há intenções', async () => {
    vi.mocked(adoptionService.list).mockResolvedValue(page([]));
    const { container } = renderPage();

    expect(
      await screen.findByText('Nenhuma intenção encontrada para este filtro.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Nenhuma intenção encontrada para este filtro.',
    );
    expect(container.querySelectorAll('article').length).toBe(0);
  });

  it('usa a moldura nova sem classes legadas', async () => {
    const { container } = renderPage();

    await screen.findByText(pendenteCompleta.motivation);

    expect(container.querySelector('.page-head')).toBeNull();
    expect(container.querySelector('.btn')).toBeNull();
    expect(container.querySelector('.panel')).toBeNull();
    expect(container.querySelector('.alert')).toBeNull();
    expect(container.querySelector('.empty-state')).toBeNull();
    expect(container.querySelector('.filter-bar')).toBeNull();
    expect(container.querySelector('.intent-card')).toBeNull();
    expect(container.querySelector('.stack')).toBeNull();
    expect(container.querySelector('.badge')).toBeNull();
    expect(container.querySelector('[class*="intent-card"]')).toBeNull();
    expect(container.querySelector('[class*="badge--"]')).toBeNull();

    // Panel e filtro novos
    expect(container.querySelector('.grid')).not.toBeNull();
    const filterWrapper = screen.getByLabelText(/Status/i).closest('.grid');
    expect(filterWrapper).not.toBeNull();
    expect(filterWrapper).toHaveClass('sm:max-w-xs');
    expect(filterWrapper).toHaveClass('mb-4');

    // Cards novos
    const articles = container.querySelectorAll('article');
    expect(articles.length).toBe(fixtures.length);
    for (const article of Array.from(articles)) {
      expect(article).toHaveClass('rounded-xl');
      expect(article).toHaveClass('border-staff-line');
      expect(article).toHaveClass('bg-staff-surface');
    }

    // Botões novos com tokens do painel
    const pendenteArticle = await articleByMotivation(pendenteCompleta.motivation);
    const aprovar = within(pendenteArticle).getByRole('button', { name: 'Aprovar' });
    expect(aprovar).toHaveClass('bg-staff-ink');
    expect(aprovar).toHaveClass('text-staff-surface');
    expect(aprovar).not.toHaveClass('btn--primary');

    const rejeitar = within(pendenteArticle).getByRole('button', { name: 'Rejeitar' });
    expect(rejeitar).toHaveClass('text-staff-danger');
    expect(rejeitar).toHaveClass('hover:bg-staff-danger/10');
    expect(rejeitar).not.toHaveClass('btn--danger');

    // Motivação com tinta
    expect(within(pendenteArticle).getByText(pendenteCompleta.motivation)).toHaveClass(
      'text-staff-ink',
    );
  });
});
