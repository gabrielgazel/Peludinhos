import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '../../../shared/api/httpsClient';
import { formatDateTime } from '../../../shared/utils/format';
import type { AdoptionIntent, IntentAnimal, IntentVisitor } from '../../adoption/types/adoption.types';
import { adoptionService } from '../../adoption/services/adoptionService';
import { adoptionRecordService } from '../../adoption/services/adoptionRecordService';
import { useAuth } from '../../auth/hooks/useAuth';
import { buildAdoptionTerm } from '../utils/adoptionTerm';
import { IntentsAdminPage } from './IntentsAdminPage';

vi.mock('../../adoption/services/adoptionService', () => ({
  adoptionService: { list: vi.fn(), review: vi.fn() },
}));

vi.mock('../../adoption/services/adoptionRecordService', () => ({
  adoptionRecordService: { create: vi.fn() },
}));

vi.mock('../../auth/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: null })),
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
    adoption: null,
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

const registered = makeIntent({
  id: 6,
  motivation: 'Motivação registrada.',
  status: 'aprovada',
  animalId: 6,
  visitorId: 11,
  adoption: {
    id: 21,
    adoptionIntentId: 6,
    animalId: 6,
    visitorId: 11,
    responsibleMemberId: 7,
    adoptionDate: '2026-11-20',
    termText: 'Termo registrado.',
    createdAt: null,
    updatedAt: null,
  },
});

const fixtures = [pendenteCompleta, pendenteFallback, aprovada, rejeitada, cancelada, registered];

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

function mockMember(memberId: number | null) {
  vi.mocked(useAuth).mockReturnValue({
    user: { memberId },
  } as unknown as ReturnType<typeof useAuth>);
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
    vi.setSystemTime(new Date('2026-11-23T12:00:00Z'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
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

  it('oferece Registrar adoção só para aprovadas sem adoção e Ver termo para registradas', async () => {
    mockMember(7);
    renderPage();

    const aprovadaArticle = await articleByMotivation(aprovada.motivation);
    const registrarButton = within(aprovadaArticle).getByRole('button', {
      name: 'Registrar adoção',
    });
    expect(registrarButton).toBeInTheDocument();
    expect(registrarButton).toBeEnabled();
    expect(
      within(aprovadaArticle).queryByRole('button', { name: 'Ver termo' }),
    ).not.toBeInTheDocument();

    const registeredArticle = await articleByMotivation(registered.motivation);
    expect(
      within(registeredArticle).getByRole('button', { name: 'Ver termo' }),
    ).toBeInTheDocument();
    expect(
      within(registeredArticle).queryByRole('button', { name: 'Registrar adoção' }),
    ).not.toBeInTheDocument();

    for (const other of [pendenteCompleta, rejeitada, cancelada]) {
      const article = await articleByMotivation(other.motivation);
      expect(
        within(article).queryByRole('button', { name: 'Registrar adoção' }),
      ).not.toBeInTheDocument();
      expect(
        within(article).queryByRole('button', { name: 'Ver termo' }),
      ).not.toBeInTheDocument();
    }

    expect(screen.queryByText(/DEMONSTRAÇÃO/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dados de demonstração/i)).not.toBeInTheDocument();
  });

  it('reabre o termo gravado sem registrar de novo', async () => {
    mockMember(null);
    renderPage();

    const registeredArticle = await articleByMotivation(registered.motivation);
    fireEvent.click(
      within(registeredArticle).getByRole('button', { name: 'Ver termo' }),
    );

    const panel = await screen.findByRole('region', { name: /Termo de adoção/i });
    expect(within(panel).getByText('Termo registrado.')).toBeInTheDocument();
    expect(within(panel).getByText('20/11/2026')).toBeInTheDocument();
    expect(within(panel).getByText('Membro #7')).toBeInTheDocument();

    expect(vi.mocked(adoptionRecordService.create)).not.toHaveBeenCalled();
    expect(vi.mocked(adoptionService.list)).toHaveBeenCalledTimes(1);
  });

  it('pede confirmação e registra com payload camelCase', async () => {
    mockMember(7);
    renderPage();

    const article = await articleByMotivation(aprovada.motivation);
    await waitFor(() => {
      expect(vi.mocked(adoptionService.list)).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(within(article).getByRole('button', { name: 'Registrar adoção' }));

    const confirmButton = await screen.findByRole('button', { name: 'Confirmar adoção' });
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(vi.mocked(adoptionRecordService.create)).not.toHaveBeenCalled();

    fireEvent.click(confirmButton);

    const hoje = '2026-11-23';
    await waitFor(() => {
      expect(vi.mocked(adoptionRecordService.create)).toHaveBeenCalledWith({
        adoptionIntentId: 3,
        responsibleMemberId: 7,
        adoptionDate: hoje,
        termText: buildAdoptionTerm(aprovada, 7, hoje),
      });
    });
    await waitFor(() => {
      expect(vi.mocked(adoptionService.list)).toHaveBeenCalledTimes(2);
    });
  });

  it('não registra sem membro vinculado', async () => {
    mockMember(null);
    renderPage();

    const aprovadaArticle = await articleByMotivation(aprovada.motivation);
    const registrarButton = within(aprovadaArticle).getByRole('button', {
      name: 'Registrar adoção',
    });
    expect(registrarButton).toBeDisabled();
    expect(
      within(aprovadaArticle).getByText(
        'É necessário vínculo com membro para registrar a adoção.',
      ),
    ).toBeInTheDocument();

    fireEvent.click(registrarButton);
    expect(vi.mocked(adoptionRecordService.create)).not.toHaveBeenCalled();
  });

  it('mostra erro do service sem registrar', async () => {
    mockMember(7);
    vi.mocked(adoptionRecordService.create).mockRejectedValueOnce(
      new HttpError(409, 'Animal já adotado.', null),
    );

    renderPage();

    const article = await articleByMotivation(aprovada.motivation);
    fireEvent.click(within(article).getByRole('button', { name: 'Registrar adoção' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar adoção' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Animal já adotado.');
    expect(vi.mocked(adoptionService.list)).toHaveBeenCalledTimes(1);
    expect(
      within(article).queryByRole('button', { name: 'Ver termo' }),
    ).not.toBeInTheDocument();
  });

  it('imprime o termo chamando window.print', async () => {
    mockMember(7);
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    renderPage();

    const registeredArticle = await articleByMotivation(registered.motivation);
    fireEvent.click(
      within(registeredArticle).getByRole('button', { name: 'Ver termo' }),
    );
    await screen.findByRole('region', { name: /Termo de adoção/i });

    fireEvent.click(screen.getByRole('button', { name: 'Imprimir termo' }));
    expect(printSpy).toHaveBeenCalledTimes(1);
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
