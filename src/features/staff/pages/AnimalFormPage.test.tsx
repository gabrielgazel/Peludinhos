import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '../../../shared/api/httpsClient';
import type { Animal } from '../../animals/types/animal.types';
import { animalService } from '../../animals/services/animalService';
import { AnimalFormPage } from './AnimalFormPage';

vi.mock('../../animals/services/animalService', () => ({
  animalService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    uploadPhoto: vi.fn(),
    removePhoto: vi.fn(),
    markDeceased: vi.fn(),
  },
}));

function makeAnimal(partial: Partial<Animal> & { id: number; name: string }): Animal {
  return {
    sex: 'F',
    colorDescription: null,
    age: null,
    isNeutered: false,
    status: 'disponivel',
    behavior: 'docil',
    notes: null,
    isDeceased: false,
    photoUrl: null,
    createdAt: null,
    updatedAt: null,
    ...partial,
  };
}

const thor = makeAnimal({
  id: 7,
  name: 'Thor',
  sex: 'M',
  status: 'em_processo',
  behavior: 'sociavel',
  age: '2 anos',
  colorDescription: 'Caramelo',
  isNeutered: true,
  notes: 'Muito dócil',
  photoUrl: 'https://example.com/thor.jpg',
});

function renderAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/painel/animais/novo" element={<AnimalFormPage />} />
        <Route path="/painel/animais/:id/editar" element={<AnimalFormPage />} />
        <Route path="/painel/animais" element={<div>Lista de animais</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AnimalFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(animalService.create).mockResolvedValue(makeAnimal({ id: 10, name: 'Mel' }));
    vi.mocked(animalService.update).mockResolvedValue(thor);
    vi.mocked(animalService.getById).mockResolvedValue(thor);
    vi.mocked(animalService.uploadPhoto).mockResolvedValue(thor);
    vi.mocked(animalService.removePhoto).mockResolvedValue(thor);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza todos os campos e o cabeçalho no modo novo', () => {
    const { container } = renderAt('/painel/animais/novo');

    expect(screen.getByRole('heading', { name: 'Novo animal' })).toBeInTheDocument();
    expect(screen.getByText('Cadastre um animal para a página de adoção.')).toBeInTheDocument();

    expect(screen.getByText('Foto do animal')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Sexo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Comportamento/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Idade aproximada/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cor \/ pelagem/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Castrado/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Observações/i)).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Voltar/ })).toHaveAttribute(
      'href',
      '/painel/animais',
    );
    expect(screen.getByRole('link', { name: /Cancelar/ })).toHaveAttribute(
      'href',
      '/painel/animais',
    );

    expect(container.querySelector('form[noValidate]')).not.toBeNull();
  });

  it('renderiza o cabeçalho no modo edição', async () => {
    renderAt('/painel/animais/7/editar');

    expect(await screen.findByRole('heading', { name: 'Editar animal' })).toBeInTheDocument();
    expect(screen.getByText('Atualize as informações do peludinho.')).toBeInTheDocument();
    await screen.findByText('Foto do animal');
    expect(screen.getByLabelText(/Nome/i)).toBeInTheDocument();
  });

  it('submit com dados válidos chama create com o payload exato e navega para a lista', async () => {
    renderAt('/painel/animais/novo');

    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: '  Mel  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(vi.mocked(animalService.create)).toHaveBeenCalledWith({
        name: 'Mel',
        sex: 'F',
        status: 'disponivel',
        behavior: null,
        age: null,
        color_description: null,
        is_neutered: false,
        notes: null,
      });
    });

    expect(await screen.findByText('Lista de animais')).toBeInTheDocument();
    expect(vi.mocked(animalService.uploadPhoto)).not.toHaveBeenCalled();
    expect(vi.mocked(animalService.removePhoto)).not.toHaveBeenCalled();
  });

  it('nome vazio mostra a mensagem, foca animal-name e não chama o serviço', async () => {
    renderAt('/painel/animais/novo');

    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Informe o nome do animal.')).toBeInTheDocument();
    expect(document.activeElement?.id).toBe('animal-name');
    expect(vi.mocked(animalService.create)).not.toHaveBeenCalled();
    expect(vi.mocked(animalService.update)).not.toHaveBeenCalled();

    expect(screen.queryByText('Lista de animais')).not.toBeInTheDocument();
  });

  it('modo edição: getById popula os campos e submit chama update(id, payload)', async () => {
    renderAt('/painel/animais/7/editar');

    await screen.findByDisplayValue('Thor');
    expect(vi.mocked(animalService.getById)).toHaveBeenCalledWith(7);
    expect(screen.getByLabelText(/^Sexo/i)).toHaveValue('M');
    expect(screen.getByLabelText(/^Status/i)).toHaveValue('em_processo');
    expect(screen.getByLabelText(/Comportamento/i)).toHaveValue('sociavel');
    expect(screen.getByLabelText(/Idade aproximada/i)).toHaveValue('2 anos');
    expect(screen.getByLabelText(/Cor \/ pelagem/i)).toHaveValue('Caramelo');
    expect(screen.getByLabelText(/Castrado/i)).toBeChecked();
    expect(screen.getByLabelText(/Observações/i)).toHaveValue('Muito dócil');
    expect(
      screen.getByAltText('Pré-visualização da foto do animal'),
    ).toHaveAttribute('src', 'https://example.com/thor.jpg');

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(vi.mocked(animalService.update)).toHaveBeenCalledWith(7, {
        name: 'Thor',
        sex: 'M',
        status: 'em_processo',
        behavior: 'sociavel',
        age: '2 anos',
        color_description: 'Caramelo',
        is_neutered: true,
        notes: 'Muito dócil',
      });
    });
    expect(await screen.findByText('Lista de animais')).toBeInTheDocument();
    expect(vi.mocked(animalService.create)).not.toHaveBeenCalled();
  });

  it('erro de create HttpError mostra role="alert" com a mensagem', async () => {
    vi.mocked(animalService.create).mockRejectedValueOnce(
      new HttpError(400, 'Nome já cadastrado.', null),
    );
    renderAt('/painel/animais/novo');

    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: 'Mel' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Nome já cadastrado.');
  });

  it('erro de create genérico mostra o fallback em role="alert"', async () => {
    vi.mocked(animalService.create).mockRejectedValueOnce(new Error('falha qualquer'));
    renderAt('/painel/animais/novo');

    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: 'Mel' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível salvar. Tente de novo em instantes.',
    );
  });

  it('saving mostra "Salvando..."', async () => {
    vi.mocked(animalService.create).mockReturnValue(new Promise(() => {}));
    renderAt('/painel/animais/novo');

    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: 'Mel' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('button', { name: 'Salvando...' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled();
  });

  it('zero classes legadas no novo e no edição', async () => {
    const { container } = renderAt('/painel/animais/novo');

    await screen.findByLabelText(/Nome/i);
    expect(container.querySelector('.page-head')).toBeNull();
    expect(container.querySelector('.btn')).toBeNull();
    expect(container.querySelector('.panel')).toBeNull();
    expect(container.querySelector('.alert')).toBeNull();
    expect(container.querySelector('.empty-state')).toBeNull();
    expect(container.querySelector('.form-grid')).toBeNull();
    expect(container.querySelector('.form-actions')).toBeNull();
    expect(container.querySelector('.photo-field')).toBeNull();
    expect(container.querySelector('[class*="page-head"]')).toBeNull();
    expect(container.querySelector('[class*="form-grid"]')).toBeNull();
    expect(container.querySelector('[class*="form-actions"]')).toBeNull();
    expect(container.querySelector('[class*="photo-field"]')).toBeNull();

    // Estrutura nova
    expect(container.querySelector('.grid')).not.toBeNull();
    expect(container.querySelector('form.space-y-6')).not.toBeNull();
  });

  it('zero classes legadas no modo edição carregado', async () => {
    const { container } = renderAt('/painel/animais/7/editar');

    await screen.findByDisplayValue('Thor');
    expect(container.querySelector('.page-head')).toBeNull();
    expect(container.querySelector('.btn')).toBeNull();
    expect(container.querySelector('.panel')).toBeNull();
    expect(container.querySelector('.alert')).toBeNull();
    expect(container.querySelector('.empty-state')).toBeNull();
    expect(container.querySelector('.form-grid')).toBeNull();
    expect(container.querySelector('.form-actions')).toBeNull();
    expect(container.querySelector('.photo-field')).toBeNull();
  });
});
