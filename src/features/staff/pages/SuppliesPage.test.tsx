import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../auth/hooks/useAuth';
import type { AuthUser } from '../../auth/types/auth.types';
import { medicationService, type Medication } from '../services/medicationService';
import { productService, type Product } from '../services/productService';
import { SuppliesPage } from './SuppliesPage';

vi.mock('../../auth/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../services/medicationService', () => ({
  medicationService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));
vi.mock('../services/productService', () => ({
  productService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
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
};

const remedio: Medication = {
  id: 7,
  name: 'Amoxicilina',
  type: 'Antibiótico',
  quantity: 10,
  unit: 'comprimido',
  validity: '2027-05-20',
  point: 'Enfermaria',
  notes: 'Uso controlado',
  createdAt: null,
  updatedAt: null,
};

const insumo: Product = {
  id: 12,
  name: 'Papel higiênico',
  type: 'Higiene',
  quantity: 30,
  unit: 'rolo',
  validity: null,
  point: 'Abrigo',
  notes: null,
  createdAt: null,
  updatedAt: null,
};

function pageOf<T>(items: T[]) {
  return { items, total: items.length, limit: 200, offset: 0 };
}

function renderPage(user: AuthUser = adminUser) {
  vi.mocked(useAuth).mockReturnValue({ user } as ReturnType<typeof useAuth>);
  return render(<SuppliesPage />);
}

describe('SuppliesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(medicationService.list).mockResolvedValue(pageOf([remedio]));
    vi.mocked(productService.list).mockResolvedValue(pageOf([insumo]));
    vi.mocked(medicationService.create).mockResolvedValue(remedio);
    vi.mocked(medicationService.update).mockResolvedValue(remedio);
    vi.mocked(productService.create).mockResolvedValue(insumo);
    vi.mocked(productService.update).mockResolvedValue(insumo);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('não mostra o banner de demonstração', async () => {
    renderPage();

    await screen.findByText(remedio.name);
    expect(
      screen.queryByText('Dados de demonstração - esta área ainda não persiste no banco'),
    ).not.toBeInTheDocument();
  });

  it('lista medicamentos e produtos com as colunas atuais', async () => {
    renderPage();

    expect(await screen.findByText(remedio.name)).toBeInTheDocument();
    expect(await screen.findByText(insumo.name)).toBeInTheDocument();

    const medicines = screen.getByRole('region', { name: /Medicamentos/i });
    const products = screen.getByRole('region', { name: /Produtos/i });

    expect(within(medicines).getByRole('table')).toBeInTheDocument();
    expect(within(products).getByRole('table')).toBeInTheDocument();
    for (const heading of ['Nome', 'Tipo', 'Quantidade', 'Validade', 'Ponto/uso']) {
      expect(within(medicines).getByRole('columnheader', { name: heading })).toBeInTheDocument();
      expect(within(products).getByRole('columnheader', { name: heading })).toBeInTheDocument();
    }
  });

  it('chama as duas listagens com limit 200', async () => {
    renderPage();

    await screen.findByText(remedio.name);
    await screen.findByText(insumo.name);

    expect(medicationService.list).toHaveBeenCalledWith({ limit: 200 });
    expect(productService.list).toHaveBeenCalledWith({ limit: 200 });
  });

  it('mostra "Sem validade" para validade nula', async () => {
    renderPage();

    expect(await screen.findByText(insumo.name)).toBeInTheDocument();
    const products = screen.getByRole('region', { name: /Produtos/i });
    expect(within(products).getByText('Sem validade')).toBeInTheDocument();
  });

  it('mostra alerta de erro quando a listagem falha', async () => {
    vi.mocked(medicationService.list).mockRejectedValueOnce(
      new Error('Não foi possível carregar medicamentos.'),
    );
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar medicamentos.',
    );
  });

  it('não oferece criação/edição para membro', async () => {
    renderPage(bolsistaUser);

    await screen.findByText(remedio.name);
    expect(
      screen.queryByRole('button', { name: /Novo medicamento|Novo produto|Editar/i }),
    ).not.toBeInTheDocument();
  });

  it('oferece criação e edição para administrador', async () => {
    renderPage();

    await screen.findByText(remedio.name);
    expect(screen.getByRole('button', { name: 'Novo medicamento' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Novo produto' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Editar' }).length).toBeGreaterThan(0);
  });

  it('cria medicamento e recarrega a lista', async () => {
    renderPage();
    await screen.findByText(remedio.name);

    fireEvent.click(screen.getByRole('button', { name: 'Novo medicamento' }));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Dipirona' } });
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'Analgésico' } });
    fireEvent.change(screen.getByLabelText('Quantidade'), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText('Unidade'), { target: { value: 'comprimido' } });
    fireEvent.change(screen.getByLabelText(/^Validade/), { target: { value: '2027-03-15' } });
    fireEvent.change(screen.getByLabelText('Ponto'), { target: { value: 'Enfermaria' } });
    fireEvent.change(screen.getByLabelText(/^Observação/), {
      target: { value: 'Uso sob demanda' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar medicamento' }));

    await waitFor(() => {
      expect(medicationService.create).toHaveBeenCalledWith({
        name: 'Dipirona',
        type: 'Analgésico',
        quantity: 12,
        unit: 'comprimido',
        point: 'Enfermaria',
        validity: '2027-03-15',
        notes: 'Uso sob demanda',
      });
    });
    await waitFor(() => {
      expect(vi.mocked(medicationService.list)).toHaveBeenCalledTimes(2);
    });
    expect(screen.queryByRole('button', { name: 'Salvar medicamento' })).not.toBeInTheDocument();
  });

  it('mostra erro do cadastro e mantém o formulário aberto quando a criação falha', async () => {
    vi.mocked(medicationService.create).mockRejectedValueOnce(
      new Error('Não foi possível salvar o medicamento.'),
    );
    renderPage();
    await screen.findByText(remedio.name);

    fireEvent.click(screen.getByRole('button', { name: 'Novo medicamento' }));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Dipirona' } });
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'Analgésico' } });
    fireEvent.change(screen.getByLabelText('Quantidade'), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText('Unidade'), { target: { value: 'comprimido' } });
    fireEvent.change(screen.getByLabelText('Ponto'), { target: { value: 'Enfermaria' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar medicamento' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível salvar o medicamento.',
    );
    expect(screen.getByRole('heading', { name: 'Novo medicamento' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar medicamento' })).toBeInTheDocument();
  });

  it('edita produto existente com os dados preenchidos', async () => {
    renderPage();
    await screen.findByText(insumo.name);

    const products = screen.getByRole('region', { name: /Produtos/i });
    fireEvent.click(within(products).getByRole('button', { name: 'Editar' }));

    expect(screen.getByLabelText('Nome')).toHaveValue(insumo.name);
    fireEvent.change(screen.getByLabelText('Quantidade'), { target: { value: '24' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar produto' }));

    await waitFor(() => {
      expect(productService.update).toHaveBeenCalledWith(insumo.id, { quantity: 24 });
    });
    await waitFor(() => {
      expect(vi.mocked(productService.list)).toHaveBeenCalledTimes(2);
    });
  });
});
