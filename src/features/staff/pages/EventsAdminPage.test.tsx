import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../../auth/types/auth.types';
import { useAuth } from '../../auth/hooks/useAuth';
import type { Animal } from '../../animals/types/animal.types';
import { animalService } from '../../animals/services/animalService';
import { HttpError } from '../../../shared/api/httpsClient';
import { eventService, type Event } from '../services/eventService';
import { EventsAdminPage } from './EventsAdminPage';

vi.mock('../../auth/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../services/eventService', () => ({
  eventService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));
vi.mock('../../animals/services/animalService', () => ({
  animalService: {
    list: vi.fn(),
  },
}));

const adminUser: AuthUser = {
  id: 'user-admin-1',
  email: 'admin@peludinhos.example',
  name: 'Maria Silva',
  actorType: 'membro',
  role: 'administrador',
  memberId: 42,
  visitorId: null,
};

const bolsistaUser: AuthUser = {
  ...adminUser,
  id: 'user-bolsista-1',
  email: 'bolsista@peludinhos.example',
  name: 'João Pedro',
  role: 'bolsista',
  memberId: 7,
};

function makeEvent(partial: Partial<Event> & { id: number; description: string }): Event {
  return {
    eventDate: '2026-11-18',
    memberId: 42,
    memberName: 'Maria Silva',
    animalId: null,
    animalName: null,
    createdAt: '2026-11-18T09:00:00Z',
    updatedAt: null,
    ...partial,
  };
}

const eventoMel = makeEvent({
  id: 21,
  description: 'Mel recebeu vermífugo',
  eventDate: '2026-11-18',
  animalId: 10,
  animalName: 'Mel',
});

const eventoRacao = makeEvent({
  id: 20,
  description: 'Ração recolhida do Bloco A',
  eventDate: '2026-10-02',
  memberId: 7,
  memberName: 'João Pedro',
});

const fixtures = [eventoMel, eventoRacao];

function makeAnimal(id: number, name: string): Animal {
  return {
    id,
    name,
    sex: 'F',
    colorDescription: null,
    age: null,
    isNeutered: false,
    status: 'disponivel',
    behavior: null,
    notes: null,
    isDeceased: false,
    deathDate: null,
    deathCause: null,
    photoUrl: null,
    createdAt: null,
    updatedAt: null,
  };
}

function eventsPage(items: Event[]) {
  return { items, total: items.length, limit: 200, offset: 0 };
}

function animalsPage(items: Animal[]) {
  return { items, total: items.length, limit: 200, offset: 0 };
}

function renderPage(user: AuthUser) {
  vi.mocked(useAuth).mockReturnValue({ user } as ReturnType<typeof useAuth>);
  return render(
    <MemoryRouter>
      <EventsAdminPage />
    </MemoryRouter>,
  );
}

function setup(events: Event[] = fixtures) {
  vi.mocked(eventService.list).mockResolvedValue(eventsPage(events));
  vi.mocked(eventService.create).mockResolvedValue(eventoMel);
  vi.mocked(eventService.update).mockResolvedValue(eventoMel);
  vi.mocked(animalService.list).mockResolvedValue(
    animalsPage([makeAnimal(10, 'Mel'), makeAnimal(11, 'Thor')]),
  );
}

describe('EventsAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lista ocorrências agrupadas por mês com data, descrição, autor e animal', async () => {
    renderPage(adminUser);

    expect(await screen.findByText('Mel recebeu vermífugo')).toBeInTheDocument();
    expect(screen.getByText('Ração recolhida do Bloco A')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'novembro de 2026' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'outubro de 2026' })).toBeInTheDocument();

    expect(screen.getByText('18/11/2026')).toBeInTheDocument();
    expect(screen.getByText('02/10/2026')).toBeInTheDocument();
    expect(screen.getByText('por Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('por João Pedro')).toBeInTheDocument();
    expect(screen.getByText('Animal: Mel')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Ocorrências' })).toBeInTheDocument();
  });

  it('mostra o estado vazio com chamada para registrar a primeira ocorrência', async () => {
    vi.mocked(eventService.list).mockResolvedValue(eventsPage([]));
    renderPage(adminUser);

    expect(await screen.findByText('Nenhuma ocorrência registrada ainda.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Registrar primeira ocorrência' }),
    ).toBeInTheDocument();
  });

  it('exige descrição antes de pedir confirmação', async () => {
    renderPage(adminUser);
    await screen.findByText('Mel recebeu vermífugo');

    fireEvent.click(screen.getByRole('button', { name: 'Nova ocorrência' }));
    fireEvent.click(screen.getByRole('button', { name: 'Registrar ocorrência' }));

    expect(screen.getByText('Descreva a ocorrência.')).toBeInTheDocument();
    expect(screen.queryByText('Registrar esta ocorrência?')).not.toBeInTheDocument();
    expect(eventService.create).not.toHaveBeenCalled();
  });

  it('cria uma ocorrência só depois da confirmação e recarrega a lista', async () => {
    renderPage(adminUser);
    await screen.findByText('Mel recebeu vermífugo');
    expect(vi.mocked(eventService.list)).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Nova ocorrência' }));
    expect(
      screen.getByRole('heading', { name: 'Registrar ocorrência' }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Descrição/i), {
      target: { value: 'Thor tomou banho' },
    });
    fireEvent.change(screen.getByLabelText(/Data/i), { target: { value: '2026-11-17' } });

    const animalSelect = screen.getByLabelText(/Animal/i);
    await waitFor(() => {
      expect(within(animalSelect).getByRole('option', { name: 'Thor' })).toBeInTheDocument();
    });
    fireEvent.change(animalSelect, { target: { value: '11' } });

    fireEvent.click(screen.getByRole('button', { name: 'Registrar ocorrência' }));

    expect(screen.getByText('Registrar esta ocorrência?')).toBeInTheDocument();
    expect(eventService.create).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar registro' }));

    await waitFor(() => {
      expect(eventService.create).toHaveBeenCalledWith({
        description: 'Thor tomou banho',
        eventDate: '2026-11-17',
        animalId: 11,
      });
    });
    await waitFor(() => {
      expect(vi.mocked(eventService.list)).toHaveBeenCalledTimes(2);
    });
    expect(
      screen.queryByRole('heading', { name: 'Registrar ocorrência' }),
    ).not.toBeInTheDocument();
  });

  it('mostra erro de API ao falhar ao registrar', async () => {
    vi.mocked(eventService.create).mockRejectedValueOnce(
      new HttpError(422, 'Animal informado não existe', null),
    );
    renderPage(adminUser);
    await screen.findByText('Mel recebeu vermífugo');

    fireEvent.click(screen.getByRole('button', { name: 'Nova ocorrência' }));
    fireEvent.change(screen.getByLabelText(/Descrição/i), {
      target: { value: 'Registro com animal inválido' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar ocorrência' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar registro' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Animal informado não existe');
    expect(vi.mocked(eventService.list)).toHaveBeenCalledTimes(1);
  });

  it('esconde a edição de ocorrência de outra pessoa para bolsista', async () => {
    renderPage(bolsistaUser);
    await screen.findByText('Mel recebeu vermífugo');

    const itemProprio = screen.getByText('Ração recolhida do Bloco A').closest('li');
    const itemDeOutro = screen.getByText('Mel recebeu vermífugo').closest('li');
    expect(itemProprio).not.toBeNull();
    expect(itemDeOutro).not.toBeNull();

    expect(
      within(itemProprio as HTMLElement).getByRole('button', { name: 'Editar' }),
    ).toBeInTheDocument();
    expect(
      within(itemDeOutro as HTMLElement).queryByRole('button', { name: 'Editar' }),
    ).not.toBeInTheDocument();
  });

  it('permite à administração editar ocorrência de outra pessoa', async () => {
    renderPage(adminUser);
    await screen.findByText('Mel recebeu vermífugo');

    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(2);
  });

  it('edita uma ocorrência após confirmação e vê a lista recarregada', async () => {
    renderPage(adminUser);
    await screen.findByText('Mel recebeu vermífugo');

    const itemAlvo = screen.getByText('Mel recebeu vermífugo').closest('li');
    expect(itemAlvo).not.toBeNull();
    fireEvent.click(within(itemAlvo as HTMLElement).getByRole('button', { name: 'Editar' }));
    expect(screen.getByRole('heading', { name: 'Editar ocorrência' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Descrição/i), {
      target: { value: 'Mel recebeu vermífugo e antipulgas' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(screen.getByText('Salvar alterações nesta ocorrência?')).toBeInTheDocument();
    expect(eventService.update).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar alterações' }));

    await waitFor(() => {
      expect(eventService.update).toHaveBeenCalledWith(21, {
        description: 'Mel recebeu vermífugo e antipulgas',
        eventDate: '2026-11-18',
        animalId: 10,
      });
    });
    await waitFor(() => {
      expect(vi.mocked(eventService.list)).toHaveBeenCalledTimes(2);
    });
  });
});
