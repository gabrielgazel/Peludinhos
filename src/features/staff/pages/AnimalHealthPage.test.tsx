import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../../auth/types/auth.types';
import { useAuth } from '../../auth/hooks/useAuth';
import type { Animal } from '../../animals/types/animal.types';
import { useAnimal } from '../../animals/hooks/useAnimals';
import { animalService } from '../../animals/services/animalService';
import {
  veterinaryHistoryService,
  type VeterinaryHistory,
} from '../../animals/services/veterinaryHistoryService';
import {
  vaccinationService,
  type Vaccination,
} from '../../animals/services/vaccinationService';
import {
  prescriptionService,
  type Prescription,
} from '../../animals/services/prescriptionService';
import { AnimalHealthPage } from './AnimalHealthPage';

vi.mock('../../auth/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../../animals/hooks/useAnimals', () => ({ useAnimal: vi.fn() }));
vi.mock('../../animals/services/animalService', () => ({
  animalService: { list: vi.fn(), getById: vi.fn(), markDeceased: vi.fn() },
}));
vi.mock('../../animals/services/veterinaryHistoryService', () => ({
  veterinaryHistoryService: { list: vi.fn(), create: vi.fn(), update: vi.fn() },
}));
vi.mock('../../animals/services/vaccinationService', () => ({
  vaccinationService: { list: vi.fn(), create: vi.fn(), update: vi.fn() },
}));
vi.mock('../../animals/services/prescriptionService', () => ({
  prescriptionService: { list: vi.fn(), create: vi.fn(), update: vi.fn() },
}));

const bolsistaUser: AuthUser = {
  id: 'user-bolsista-1',
  email: 'bolsista@peludinhos.example',
  name: 'João Pedro',
  actorType: 'membro',
  role: 'bolsista',
  memberId: 7,
  visitorId: null,
};

const adminUser: AuthUser = {
  ...bolsistaUser,
  id: 'user-admin-1',
  email: 'admin@peludinhos.example',
  name: 'Maria Silva',
  role: 'administrador',
  memberId: 42,
};

const semMemberUser: AuthUser = {
  ...bolsistaUser,
  id: 'user-sem-member-1',
  email: 'sem-member@peludinhos.example',
  name: 'Sem Vínculo',
  memberId: null,
};

const mel: Animal = {
  id: 5,
  name: 'Mel',
  sex: 'F',
  colorDescription: null,
  age: '2 anos',
  isNeutered: true,
  status: 'disponivel',
  behavior: 'docil',
  notes: null,
  isDeceased: false,
  photoUrl: null,
  createdAt: null,
  updatedAt: null,
};

const historyWithDate: VeterinaryHistory = {
  id: 1,
  animalId: 5,
  recordDate: '2026-10-02',
  title: 'Consulta',
  description: 'Animal saudável.',
  createdByMemberId: 7,
  createdAt: null,
  updatedAt: null,
};

const historyWithoutDate = {
  id: 2,
  animalId: 5,
  recordDate: null,
  title: 'Revisão',
  description: 'Sem data registrada.',
  createdByMemberId: 9,
  createdAt: null,
  updatedAt: null,
} as unknown as VeterinaryHistory;

const histories: VeterinaryHistory[] = [historyWithDate, historyWithoutDate];

const vaccine: Vaccination = {
  id: 8,
  animalId: 5,
  vaccine: 'V10',
  applicationDate: '2026-09-12',
  dose: null,
  notes: null,
  createdByMemberId: 9,
  createdAt: null,
  updatedAt: null,
};

const prescription: Prescription = {
  id: 12,
  animalId: 5,
  medication: 'Amoxicilina',
  dosage: '1 comprimido',
  prescriptionDate: '2026-10-05',
  notes: null,
  createdByMemberId: 7,
  createdAt: null,
  updatedAt: null,
};

function page<T>(items: T[]) {
  return { items, total: items.length, limit: 200, offset: 0 };
}

function renderPage(user: AuthUser) {
  vi.mocked(useAuth).mockReturnValue({ user } as ReturnType<typeof useAuth>);
  vi.mocked(useAnimal).mockReturnValue({ animal: mel, loading: false, failed: false });
  return render(
    <MemoryRouter initialEntries={['/painel/animais/5']}>
      <Routes>
        <Route path="/painel/animais/:id" element={<AnimalHealthPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function openSaude() {
  fireEvent.click(screen.getByRole('button', { name: 'Saúde' }));
}

describe('AnimalHealthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(animalService.list).mockResolvedValue(page([mel]));
    vi.mocked(animalService.getById).mockResolvedValue(mel);
    vi.mocked(veterinaryHistoryService.list).mockResolvedValue(page(histories));
    vi.mocked(vaccinationService.list).mockResolvedValue(page([vaccine]));
    vi.mocked(prescriptionService.list).mockResolvedValue(page([prescription]));
    vi.mocked(veterinaryHistoryService.create).mockResolvedValue(historyWithDate);
    vi.mocked(vaccinationService.create).mockResolvedValue(vaccine);
    vi.mocked(prescriptionService.create).mockResolvedValue(prescription);
    vi.mocked(veterinaryHistoryService.update).mockResolvedValue(historyWithDate);
    vi.mocked(vaccinationService.update).mockResolvedValue(vaccine);
    vi.mocked(prescriptionService.update).mockResolvedValue(prescription);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('carrega o animal e as três listagens com limit 200', async () => {
    renderPage(bolsistaUser);

    expect(useAnimal).toHaveBeenCalledWith(5);
    expect(screen.getByRole('heading', { name: 'Ficha de Mel' })).toBeInTheDocument();
    await waitFor(() => {
      expect(veterinaryHistoryService.list).toHaveBeenCalledWith(5, { limit: 200 });
      expect(vaccinationService.list).toHaveBeenCalledWith(5, { limit: 200 });
      expect(prescriptionService.list).toHaveBeenCalledWith(5, { limit: 200 });
    });
  });

  it('mostra as abas Dados e Saúde com as três seções', async () => {
    renderPage(bolsistaUser);

    expect(screen.getByRole('button', { name: 'Dados' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Saúde' })).toHaveAttribute('aria-pressed', 'false');

    openSaude();

    const history = await screen.findByRole('region', { name: 'Histórico veterinário' });
    const vaccines = screen.getByRole('region', { name: 'Vacinação' });
    const prescriptions = screen.getByRole('region', { name: 'Receitas' });

    for (const region of [history, vaccines, prescriptions]) {
      expect(within(region).getByRole('columnheader', { name: 'Data' })).toBeInTheDocument();
      expect(within(region).getByRole('columnheader', { name: 'Autor' })).toBeInTheDocument();
      expect(within(region).getByRole('columnheader', { name: 'Ações' })).toBeInTheDocument();
    }

    expect(within(history).getByText('Consulta')).toBeInTheDocument();
    expect(within(history).getByText('Revisão')).toBeInTheDocument();
    expect(within(vaccines).getByText('V10')).toBeInTheDocument();
    expect(within(prescriptions).getByText('Amoxicilina')).toBeInTheDocument();
  });

  it('formata datas nulas como travessão', async () => {
    renderPage(bolsistaUser);
    openSaude();

    const history = await screen.findByRole('region', { name: 'Histórico veterinário' });
    await within(history).findByText('Revisão');
    const row = within(history).getByText('Revisão').closest('tr') as HTMLElement;
    expect(within(row).getByText('—')).toBeInTheDocument();
  });

  it('mostra erro em alerta quando uma listagem falha', async () => {
    vi.mocked(prescriptionService.list).mockRejectedValueOnce(
      new Error('Não foi possível carregar receitas.'),
    );
    renderPage(bolsistaUser);
    openSaude();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar receitas.',
    );
  });

  it('mostra estado vazio quando não há registros', async () => {
    vi.mocked(veterinaryHistoryService.list).mockResolvedValue(page([]));
    vi.mocked(vaccinationService.list).mockResolvedValue(page([]));
    vi.mocked(prescriptionService.list).mockResolvedValue(page([]));
    renderPage(bolsistaUser);
    openSaude();

    expect(await screen.findByText('Nenhum registro clínico ainda.')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma vacina registrada.')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma receita registrada.')).toBeInTheDocument();
  });

  it('mostra aviso e desabilita criação para sessão sem vínculo de membro', async () => {
    renderPage(semMemberUser);
    openSaude();

    expect(
      screen.getByText('É necessário vínculo com membro para registrar dados clínicos.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Novo registro' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Nova vacina' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Nova receita' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Novo registro' }));
    expect(veterinaryHistoryService.create).not.toHaveBeenCalled();
    expect(vaccinationService.create).not.toHaveBeenCalled();
    expect(prescriptionService.create).not.toHaveBeenCalled();
  });

  it('bolsista edita apenas registro próprio', async () => {
    renderPage(bolsistaUser);
    openSaude();

    const history = await screen.findByRole('region', { name: 'Histórico veterinário' });
    await within(history).findByText('Consulta');
    expect(within(history).getAllByRole('button', { name: 'Editar' })).toHaveLength(1);

    const vaccines = screen.getByRole('region', { name: 'Vacinação' });
    await within(vaccines).findByText('V10');
    expect(within(vaccines).queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
  });

  it('administração edita registros de qualquer autor', async () => {
    renderPage(adminUser);
    openSaude();

    const history = await screen.findByRole('region', { name: 'Histórico veterinário' });
    await within(history).findByText('Consulta');
    expect(within(history).getAllByRole('button', { name: 'Editar' }).length).toBeGreaterThan(0);

    const vaccines = screen.getByRole('region', { name: 'Vacinação' });
    await within(vaccines).findByText('V10');
    expect(within(vaccines).getAllByRole('button', { name: 'Editar' }).length).toBeGreaterThan(0);

    const prescriptions = screen.getByRole('region', { name: 'Receitas' });
    await within(prescriptions).findByText('Amoxicilina');
    expect(
      within(prescriptions).getAllByRole('button', { name: 'Editar' }).length,
    ).toBeGreaterThan(0);
  });

  it('cria registro de histórico e recarrega a lista', async () => {
    renderPage(bolsistaUser);
    openSaude();
    fireEvent.click(screen.getByRole('button', { name: 'Novo registro' }));

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Consulta' } });
    fireEvent.change(screen.getByLabelText('Data do registro'), {
      target: { value: '2026-10-02' },
    });
    fireEvent.change(screen.getByLabelText('Descrição'), {
      target: { value: 'Animal saudável.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar registro' }));

    await waitFor(() => {
      expect(veterinaryHistoryService.create).toHaveBeenCalledWith(5, {
        title: 'Consulta',
        recordDate: '2026-10-02',
        description: 'Animal saudável.',
        createdByMemberId: 7,
      });
    });
    await waitFor(() => {
      expect(veterinaryHistoryService.list).toHaveBeenCalledTimes(2);
    });
  });

  it('cria vacina com campos opcionais vazios enviando null', async () => {
    renderPage(bolsistaUser);
    openSaude();
    fireEvent.click(screen.getByRole('button', { name: 'Nova vacina' }));

    fireEvent.change(screen.getByLabelText('Vacina'), { target: { value: 'V10' } });
    fireEvent.change(screen.getByLabelText('Data de aplicação'), {
      target: { value: '2026-09-12' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar vacina' }));

    await waitFor(() => {
      expect(vaccinationService.create).toHaveBeenCalledWith(5, {
        vaccine: 'V10',
        applicationDate: '2026-09-12',
        dose: null,
        notes: null,
        createdByMemberId: 7,
      });
    });
  });

  it('edita receita existente com payload parcial', async () => {
    renderPage(bolsistaUser);
    openSaude();

    const prescriptions = await screen.findByRole('region', { name: 'Receitas' });
    await within(prescriptions).findByText('Amoxicilina');
    fireEvent.click(within(prescriptions).getByRole('button', { name: 'Editar' }));

    fireEvent.change(screen.getByLabelText('Posologia'), {
      target: { value: '2 comprimidos ao dia' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar receita' }));

    await waitFor(() => {
      expect(prescriptionService.update).toHaveBeenCalledWith(12, {
        dosage: '2 comprimidos ao dia',
      });
    });
  });

  it('não envia POST quando campo obrigatório está vazio', async () => {
    renderPage(bolsistaUser);
    openSaude();
    fireEvent.click(screen.getByRole('button', { name: 'Novo registro' }));

    fireEvent.click(screen.getByRole('button', { name: 'Salvar registro' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Preencha os campos obrigatórios.');
    expect(veterinaryHistoryService.create).not.toHaveBeenCalled();
  });
});
