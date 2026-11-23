import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { buildAdoptionTerm } from '../utils/adoptionTerm';
import type { AdoptionIntent, IntentAnimal, IntentVisitor } from '../../adoption/types/adoption.types';
import { AdoptionTermPanel } from './AdoptionTermPanel';

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

const termText = buildAdoptionTerm(intent, 7, '2026-11-23');

describe('AdoptionTermPanel', () => {
  it('mostra o termo preenchido e somente leitura', () => {
    render(
      <AdoptionTermPanel
        intent={intent}
        adoptionDate="2026-11-23"
        responsibleMemberId={7}
        termText={termText}
        onPrint={vi.fn()}
      />,
    );

    const panel = screen.getByRole('region', { name: /Termo de adoção/i });
    expect(panel).toBeInTheDocument();
    expect(screen.getByText('Bruno Visitante')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument(); // CPF sem cadastro
    expect(screen.getByText('bruno@example.com')).toBeInTheDocument();
    expect(screen.getByText('Thor')).toBeInTheDocument();
    expect(screen.getByText('3 anos')).toBeInTheDocument(); // Idade
    expect(screen.getByText('Caramelo')).toBeInTheDocument(); // Pelagem
    expect(screen.getByText('Macho')).toBeInTheDocument();
    expect(screen.getByText('Não')).toBeInTheDocument(); // Castrado
    expect(screen.getByText('Dócil')).toBeInTheDocument(); // Temperamento
    expect(screen.getByText('#3')).toBeInTheDocument(); // Pedido
    expect(screen.getByText('23/11/2026')).toBeInTheDocument();
    expect(screen.getByText('Membro #7')).toBeInTheDocument();
    expect(screen.getByText(intent.motivation)).toBeInTheDocument();
    expect(screen.getByText(termText, { normalizer: (content: string) => content })).toBeInTheDocument();

    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Imprimir termo' })).toBeInTheDocument();
  });

  it('marca a área imprimível e mantém o botão fora dela', () => {
    const onPrint = vi.fn();
    render(
      <AdoptionTermPanel
        intent={intent}
        adoptionDate="2026-11-23"
        responsibleMemberId={7}
        termText={termText}
        onPrint={onPrint}
      />,
    );

    const termElement = screen.getByText(termText, { normalizer: (content: string) => content });
    expect(termElement).toHaveClass('adoption-term-print');
    expect(termElement).toHaveClass('whitespace-pre-line');

    const printButton = screen.getByRole('button', { name: 'Imprimir termo' });
    expect(termElement).not.toContainElement(printButton);

    fireEvent.click(printButton);
    expect(onPrint).toHaveBeenCalledTimes(1);
  });

  it('formata datas nulas como travessão', () => {
    render(
      <AdoptionTermPanel
        intent={{ ...intent, createdAt: null }}
        adoptionDate=""
        responsibleMemberId={7}
        termText={buildAdoptionTerm({ ...intent, createdAt: null }, 7, '')}
        onPrint={vi.fn()}
      />,
    );

    expect(screen.getByText('CPF')).toBeInTheDocument();
    expect(screen.getByText('Data da adoção')).toBeInTheDocument();
    expect(screen.getByText('Data do pedido')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(3);
  });
});
