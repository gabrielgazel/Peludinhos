import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Member } from '../services/memberService';
import { memberService } from '../services/memberService';
import { MemberDetailPage } from './MemberDetailPage';

vi.mock('../services/memberService', () => ({
  memberService: { list: vi.fn(), getById: vi.fn(), create: vi.fn(), update: vi.fn() },
}));

function makeMember(partial: Partial<Member> & { name: string }): Member {
  return {
    id: 5,
    role: 'bolsista',
    email: 'ana@peludinhos.example',
    birthDate: '1998-04-12T00:00:00',
    cpf: '52998224725',
    ufopaRegistration: '2021001234',
    projectEntryDate: '2024-03-15T00:00:00',
    feedingDays: ['segunda', 'quarta'],
    ...partial,
  };
}

function renderAt(memberId = '5') {
  return render(
    <MemoryRouter initialEntries={[`/painel/membros/${memberId}`]}>
      <Routes>
        <Route path="/painel/membros/:id" element={<MemberDetailPage />} />
        <Route path="/painel/membros" element={<div>Lista de membros</div>} />
        <Route path="/painel/membros/:id/editar" element={<div>Formulário de edição</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MemberDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(memberService.getById).mockResolvedValue(makeMember({ name: 'Ana Souza' }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mostra Carregando membro... enquanto a ficha carrega', () => {
    vi.mocked(memberService.getById).mockReturnValue(new Promise(() => {}));
    renderAt();

    expect(screen.getByText('Carregando membro...')).toBeInTheDocument();
  });

  it('mostra dados pessoais, vínculo e ações da ficha', async () => {
    renderAt();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ana Souza' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Bolsista')).toHaveLength(2);

    const personal = screen.getByRole('region', { name: 'Dados pessoais' });
    expect(within(personal).getByText('ana@peludinhos.example')).toBeInTheDocument();
    expect(within(personal).getByText('529.982.247-25')).toBeInTheDocument();
    expect(within(personal).getByText('12/04/1998')).toBeInTheDocument();

    const affiliation = screen.getByRole('region', { name: 'Vínculo' });
    expect(within(affiliation).getByText('Bolsista')).toBeInTheDocument();
    expect(within(affiliation).getByText('2021001234')).toBeInTheDocument();
    expect(within(affiliation).getByText('15/03/2024')).toBeInTheDocument();
    expect(within(affiliation).getByText('segunda, quarta')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Editar' })).toHaveAttribute(
      'href',
      '/painel/membros/5/editar',
    );
    expect(screen.getByRole('link', { name: /Voltar/ })).toHaveAttribute(
      'href',
      '/painel/membros',
    );
  });

  it('usa — nos campos opcionais vazios', async () => {
    vi.mocked(memberService.getById).mockResolvedValue(
      makeMember({
        name: 'Bruno Lima',
        email: null,
        birthDate: null,
        cpf: null,
        ufopaRegistration: null,
        projectEntryDate: null,
        feedingDays: [],
      }),
    );
    renderAt();

    await screen.findByRole('heading', { level: 1, name: 'Bruno Lima' });
    expect(screen.getAllByText('—').length).toBe(6);
  });

  it('mostra role=alert com a mensagem quando a ficha falha', async () => {
    vi.mocked(memberService.getById).mockRejectedValue(new Error('rede indisponível'));
    renderAt();

    expect(await screen.findByRole('alert')).toHaveTextContent('rede indisponível');
    expect(screen.getByRole('link', { name: /Voltar/ })).toHaveAttribute(
      'href',
      '/painel/membros',
    );
  });
});
