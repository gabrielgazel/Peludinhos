import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '../../../shared/api/httpsClient';
import type { Member } from '../services/memberService';
import { memberService } from '../services/memberService';
import { MemberFormPage } from './MemberFormPage';

vi.mock('../services/memberService', () => ({
  memberService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
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

const ana = makeMember({ id: 5, name: 'Ana Souza', role: 'bolsista' });

function renderAt(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/painel/membros/novo" element={<MemberFormPage />} />
        <Route path="/painel/membros/:id/editar" element={<MemberFormPage />} />
        <Route path="/painel/membros" element={<div>Lista de membros</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MemberFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(memberService.create).mockResolvedValue(makeMember({ name: 'Novo Membro' }));
    vi.mocked(memberService.update).mockResolvedValue(ana);
    vi.mocked(memberService.getById).mockResolvedValue(ana);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza todos os campos e o cabeçalho no modo novo, com e-mail presente', () => {
    const { container } = renderAt('/painel/membros/novo');

    expect(screen.getByRole('heading', { name: 'Novo membro' })).toBeInTheDocument();
    expect(
      screen.getByText('Cadastre um novo voluntário, bolsista ou coordenador.'),
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/Nome completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Papel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha de acesso/i)).toBeInTheDocument();
    expect(screen.getByText('Mínimo de 8 caracteres.')).toBeInTheDocument();
    expect(screen.getByLabelText(/CPF/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Data de nascimento/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Matrícula Ufopa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Entrada no projeto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Dias de alimentação/i)).toBeInTheDocument();
    expect(screen.getByText('Separe por vírgula. Ex.: segunda, quarta, sexta')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Voltar/ })).toHaveAttribute(
      'href',
      '/painel/membros',
    );
    expect(screen.getByRole('link', { name: /Cancelar/ })).toHaveAttribute(
      'href',
      '/painel/membros',
    );
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ver ficha' })).not.toBeInTheDocument();

    expect(container.querySelector('form[noValidate]')).not.toBeNull();
    expect(screen.getByLabelText(/Nome completo/i)).toHaveAttribute('id', 'member-name');
    expect(screen.getByLabelText(/E-mail/i)).toHaveAttribute('id', 'member-email');
    expect(screen.getByLabelText(/^Papel/i)).toHaveAttribute('id', 'member-role');
    expect(screen.getByLabelText(/Senha de acesso/i)).toHaveAttribute('id', 'member-password');
    expect(screen.getByLabelText(/CPF/i)).toHaveAttribute('id', 'member-cpf');
    expect(screen.getByLabelText(/Data de nascimento/i)).toHaveAttribute('id', 'member-birthDate');
    expect(screen.getByLabelText(/Matrícula Ufopa/i)).toHaveAttribute(
      'id',
      'member-ufopaRegistration',
    );
    expect(screen.getByLabelText(/Entrada no projeto/i)).toHaveAttribute(
      'id',
      'member-projectEntryDate',
    );
    expect(screen.getByLabelText(/Dias de alimentação/i)).toHaveAttribute(
      'id',
      'member-feedingDays',
    );
  });

  it('renderiza o cabeçalho e a senha nova no modo edição, sem e-mail', async () => {
    renderAt('/painel/membros/5/editar');

    expect(await screen.findByRole('heading', { name: 'Editar membro' })).toBeInTheDocument();
    expect(screen.getByText('Atualize os dados ou o papel do membro.')).toBeInTheDocument();
    await screen.findByLabelText(/Nome completo/i);
    expect(screen.getByRole('link', { name: 'Ver ficha' })).toHaveAttribute(
      'href',
      '/painel/membros/5',
    );
    expect(screen.getByLabelText(/Nova senha/i)).toBeInTheDocument();
    expect(screen.getByText('Deixe em branco para manter a senha atual.')).toBeInTheDocument();
    expect(screen.queryByLabelText(/E-mail/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Nome completo/i)).toHaveAttribute('id', 'member-name');
    expect(screen.getByLabelText(/^Papel/i)).toHaveAttribute('id', 'member-role');
    expect(screen.getByLabelText(/Nova senha/i)).toHaveAttribute('id', 'member-password');
  });

  it('CPF inválido bloqueia o submit, mostra a mensagem, foca member-cpf e não chama o serviço', async () => {
    renderAt('/painel/membros/novo');

    fireEvent.change(screen.getByLabelText(/Nome completo/i), {
      target: { value: 'Ana Souza' },
    });
    fireEvent.change(screen.getByLabelText(/E-mail/i), {
      target: { value: 'ana@peludinhos.example' },
    });
    fireEvent.change(screen.getByLabelText(/Senha de acesso/i), {
      target: { value: 'senha123' },
    });
    fireEvent.change(screen.getByLabelText(/CPF/i), {
      target: { value: '111.111.111-11' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Informe um CPF válido.')).toBeInTheDocument();
    expect(document.activeElement?.id).toBe('member-cpf');
    expect(vi.mocked(memberService.create)).not.toHaveBeenCalled();
    expect(vi.mocked(memberService.update)).not.toHaveBeenCalled();
    expect(screen.queryByText('Lista de membros')).not.toBeInTheDocument();
  });

  it('payload de create exato (trim, só dígitos, datas, matrícula e dias parseados) e navega para a lista', async () => {
    renderAt('/painel/membros/novo');

    fireEvent.change(screen.getByLabelText(/Nome completo/i), {
      target: { value: '  Ana Souza  ' },
    });
    fireEvent.change(screen.getByLabelText(/E-mail/i), {
      target: { value: '  ana@peludinhos.example  ' },
    });
    fireEvent.change(screen.getByLabelText(/^Papel/i), { target: { value: 'bolsista' } });
    fireEvent.change(screen.getByLabelText(/Senha de acesso/i), {
      target: { value: 'senha123' },
    });
    fireEvent.change(screen.getByLabelText(/CPF/i), {
      target: { value: '529.982.247-25' },
    });
    fireEvent.change(screen.getByLabelText(/Data de nascimento/i), {
      target: { value: '1998-04-12' },
    });
    fireEvent.change(screen.getByLabelText(/Matrícula Ufopa/i), {
      target: { value: '  2021001234  ' },
    });
    fireEvent.change(screen.getByLabelText(/Entrada no projeto/i), {
      target: { value: '2024-03-15' },
    });
    fireEvent.change(screen.getByLabelText(/Dias de alimentação/i), {
      target: { value: 'segunda, quarta, sexta' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(vi.mocked(memberService.create)).toHaveBeenCalledWith({
        email: 'ana@peludinhos.example',
        password: 'senha123',
        name: 'Ana Souza',
        role: 'bolsista',
        cpf: '52998224725',
        birthDate: '1998-04-12',
        ufopaRegistration: '2021001234',
        projectEntryDate: '2024-03-15',
        feedingDays: ['segunda', 'quarta', 'sexta'],
      });
    });

    expect(await screen.findByText('Lista de membros')).toBeInTheDocument();
    expect(vi.mocked(memberService.update)).not.toHaveBeenCalled();
  });

  it('modo edição: getById pré-preenche (CPF formatado e datas yyyy-mm-dd) e update sem e-mail e sem senha vazia', async () => {
    renderAt('/painel/membros/5/editar');

    await screen.findByDisplayValue('Ana Souza');
    expect(vi.mocked(memberService.getById)).toHaveBeenCalledWith(5);
    expect(screen.getByLabelText(/^Papel/i)).toHaveValue('bolsista');
    expect(screen.getByLabelText(/CPF/i)).toHaveValue('529.982.247-25');
    expect(screen.getByLabelText(/Data de nascimento/i)).toHaveValue('1998-04-12');
    expect(screen.getByLabelText(/Matrícula Ufopa/i)).toHaveValue('2021001234');
    expect(screen.getByLabelText(/Entrada no projeto/i)).toHaveValue('2024-03-15');
    expect(screen.getByLabelText(/Dias de alimentação/i)).toHaveValue('segunda, quarta');
    expect(screen.getByLabelText(/Nova senha/i)).toHaveValue('');

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(vi.mocked(memberService.update)).toHaveBeenCalledWith(5, {
        name: 'Ana Souza',
        role: 'bolsista',
        cpf: '52998224725',
        birthDate: '1998-04-12',
        ufopaRegistration: '2021001234',
        projectEntryDate: '2024-03-15',
        feedingDays: ['segunda', 'quarta'],
      });
    });

    const payload = vi.mocked(memberService.update).mock.calls[0]?.[1] ?? {};
    expect(payload).not.toHaveProperty('email');
    expect(payload).not.toHaveProperty('password');
    expect(vi.mocked(memberService.create)).not.toHaveBeenCalled();
    expect(await screen.findByText('Lista de membros')).toBeInTheDocument();
  });

  it('modo edição: com senha preenchida, update inclui password', async () => {
    renderAt('/painel/membros/5/editar');

    await screen.findByDisplayValue('Ana Souza');
    fireEvent.change(screen.getByLabelText(/Nova senha/i), {
      target: { value: 'novaSenha123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(vi.mocked(memberService.update)).toHaveBeenCalledWith(5, {
        name: 'Ana Souza',
        role: 'bolsista',
        cpf: '52998224725',
        birthDate: '1998-04-12',
        ufopaRegistration: '2021001234',
        projectEntryDate: '2024-03-15',
        feedingDays: ['segunda', 'quarta'],
        password: 'novaSenha123',
      });
    });
    expect(await screen.findByText('Lista de membros')).toBeInTheDocument();
  });

  it('erro HttpError mostra role="alert" com a mensagem', async () => {
    vi.mocked(memberService.create).mockRejectedValueOnce(
      new HttpError(400, 'E-mail já cadastrado.', null),
    );
    renderAt('/painel/membros/novo');

    fireEvent.change(screen.getByLabelText(/Nome completo/i), {
      target: { value: 'Ana Souza' },
    });
    fireEvent.change(screen.getByLabelText(/E-mail/i), {
      target: { value: 'ana@peludinhos.example' },
    });
    fireEvent.change(screen.getByLabelText(/Senha de acesso/i), {
      target: { value: 'senha123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail já cadastrado.');
  });

  it('erro genérico (não HttpError) mostra o fallback em role="alert"', async () => {
    vi.mocked(memberService.create).mockRejectedValueOnce(new Error('falha qualquer'));
    renderAt('/painel/membros/novo');

    fireEvent.change(screen.getByLabelText(/Nome completo/i), {
      target: { value: 'Ana Souza' },
    });
    fireEvent.change(screen.getByLabelText(/E-mail/i), {
      target: { value: 'ana@peludinhos.example' },
    });
    fireEvent.change(screen.getByLabelText(/Senha de acesso/i), {
      target: { value: 'senha123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível salvar. Tente de novo em instantes.',
    );
  });

  it('erro de getById mostra a mensagem em role="alert"', async () => {
    vi.mocked(memberService.getById).mockRejectedValueOnce(new Error('Membro não encontrado.'));
    renderAt('/painel/membros/99/editar');

    expect(await screen.findByRole('alert')).toHaveTextContent('Membro não encontrado.');
  });

  it('durante o submit exibe "Salvando..." e desabilita o botão', async () => {
    vi.mocked(memberService.create).mockReturnValue(new Promise(() => {}));
    renderAt('/painel/membros/novo');

    fireEvent.change(screen.getByLabelText(/Nome completo/i), {
      target: { value: 'Ana Souza' },
    });
    fireEvent.change(screen.getByLabelText(/E-mail/i), {
      target: { value: 'ana@peludinhos.example' },
    });
    fireEvent.change(screen.getByLabelText(/Senha de acesso/i), {
      target: { value: 'senha123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('button', { name: 'Salvando...' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled();
  });

  it('zero classes legadas no modo novo', async () => {
    const { container } = renderAt('/painel/membros/novo');

    await screen.findByLabelText(/Nome completo/i);
    expect(container.querySelector('.page-head')).toBeNull();
    expect(container.querySelector('.btn')).toBeNull();
    expect(container.querySelector('.panel')).toBeNull();
    expect(container.querySelector('.alert')).toBeNull();
    expect(container.querySelector('.empty-state')).toBeNull();
    expect(container.querySelector('.form-grid')).toBeNull();
    expect(container.querySelector('.form-actions')).toBeNull();
    expect(container.querySelector('[class*="page-head"]')).toBeNull();
    expect(container.querySelector('[class*="form-grid"]')).toBeNull();
    expect(container.querySelector('[class*="form-actions"]')).toBeNull();

    expect(container.querySelector('.grid')).not.toBeNull();
    expect(container.querySelector('form.space-y-6')).not.toBeNull();
    expect(container.querySelector('form')).not.toBeNull();
  });

  it('zero classes legadas no modo edição carregado', async () => {
    const { container } = renderAt('/painel/membros/5/editar');

    await screen.findByDisplayValue('Ana Souza');
    expect(container.querySelector('.page-head')).toBeNull();
    expect(container.querySelector('.btn')).toBeNull();
    expect(container.querySelector('.panel')).toBeNull();
    expect(container.querySelector('.alert')).toBeNull();
    expect(container.querySelector('.empty-state')).toBeNull();
    expect(container.querySelector('.form-grid')).toBeNull();
    expect(container.querySelector('.form-actions')).toBeNull();
  });
});
