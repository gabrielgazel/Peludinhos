import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatDateTime } from '../../../shared/utils/format';
import type {
  AdoptionIntent,
  IntentAnimal,
  IntentVisitor,
} from '../../adoption/types/adoption.types';
import { AdoptionTermDemoPanel } from './AdoptionTermDemoPanel';

const visitor: IntentVisitor = {
  id: 11,
  name: 'Bruno Visitante',
  email: 'bruno@example.com',
  isUfopaMember: false,
  hasPet: false,
  cpf: null,
};

const animal: IntentAnimal = {
  id: 6,
  name: 'Thor',
  sex: 'M',
  age: '3 anos',
  colorDescription: 'Caramelo',
  status: 'disponivel',
  behavior: 'docil',
  isNeutered: false,
};

const intent: AdoptionIntent = {
  id: 3,
  motivation: 'Tenho espaço e quero um companheiro.',
  status: 'aprovada',
  animalId: 6,
  visitorId: 11,
  createdAt: '2026-02-11T11:00:00',
  updatedAt: null,
  visitor,
  animal,
  adoption: null,
};

describe('AdoptionTermDemoPanel', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('preenche o termo com os dados reais da intenção e do animal', () => {
    vi.stubGlobal('fetch', vi.fn());
    render(<AdoptionTermDemoPanel intent={intent} />);

    const panel = screen.getByRole('region', { name: /Termo de adoção/i });
    expect(panel).toBeInTheDocument();
    expect(screen.getByText('Bruno Visitante')).toBeInTheDocument();
    expect(screen.getByText('bruno@example.com')).toBeInTheDocument();
    expect(screen.getByText('Thor')).toBeInTheDocument();
    expect(screen.getByText('Macho')).toBeInTheDocument();
    expect(screen.getByText('3 anos')).toBeInTheDocument();
    expect(screen.getByText('Caramelo')).toBeInTheDocument();
    expect(screen.getByText('Dócil')).toBeInTheDocument();
    expect(screen.getByText('Não')).toBeInTheDocument();
    expect(screen.getByText(/#3/)).toBeInTheDocument();
    expect(screen.getByText(formatDateTime(intent.createdAt))).toBeInTheDocument();
    expect(screen.getByText(intent.motivation)).toBeInTheDocument();
  });

  it('marca a prévia como demonstração e deixa claro o que falta', () => {
    vi.stubGlobal('fetch', vi.fn());
    render(<AdoptionTermDemoPanel intent={intent} />);

    expect(screen.getByText('DEMONSTRAÇÃO')).toBeInTheDocument();
    expect(
      screen.getByText('Dados de demonstração - esta área ainda não persiste no banco'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('O registro definitivo da adoção entra no backlog (B3).'),
    ).toBeInTheDocument();
  });

  it('usa fallbacks quando a intenção não traz visitante ou animal', () => {
    vi.stubGlobal('fetch', vi.fn());
    render(
      <AdoptionTermDemoPanel
        intent={{ ...intent, visitor: null, animal: null, createdAt: null }}
      />,
    );

    expect(screen.getByText('Visitante #11')).toBeInTheDocument();
    expect(screen.getByText('Animal #6')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('não escreve nem faz requisição: é apenas uma prévia local', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<AdoptionTermDemoPanel intent={intent} />);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
