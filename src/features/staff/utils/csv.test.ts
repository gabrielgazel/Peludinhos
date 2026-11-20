import { describe, expect, it, vi } from 'vitest';
import { csvFilename, downloadCsv, escapeCsvField, toCsv, toCsvFile } from './csv';

describe('csv', () => {
  it('junta as linhas com ponto e vírgula e CRLF', () => {
    const csv = toCsv([
      ['Status', 'Animais'],
      ['Disponível', 3],
      ['Adotado', 1],
    ]);
    expect(csv).toBe('Status;Animais\r\nDisponível;3\r\nAdotado;1');
  });

  it('preserva acentos sem alterar o texto', () => {
    expect(toCsv([['Ração', 'Indisponível']])).toBe('Ração;Indisponível');
  });

  it('coloca entre aspas campos com separador, aspas ou quebra de linha', () => {
    expect(escapeCsvField('Ração "premium"')).toBe('"Ração ""premium"""');
    expect(escapeCsvField('Bloco A; tarde')).toBe('"Bloco A; tarde"');
    expect(escapeCsvField('linha 1\nlinha 2')).toBe('"linha 1\nlinha 2"');
    expect(escapeCsvField('Mel, Thor')).toBe('Mel, Thor');
    expect(escapeCsvField(0)).toBe('0');
  });

  it('prepara o arquivo com BOM (Excel pt-BR) e quebra de linha final', () => {
    const file = toCsvFile([['Ração', '7,5']]);
    expect(file.startsWith('\uFEFF')).toBe(true);
    expect(file).toBe('\uFEFFRação;7,5\r\n');
  });

  it('gera nome de arquivo com slug e data local', () => {
    expect(csvFilename('animais-por-status', new Date(2026, 10, 18))).toBe(
      'relatorio-animais-por-status-2026-11-18.csv',
    );
  });

  it('dispara o download com Blob UTF-8 e libera a URL depois', () => {
    const createObjectURL = vi.fn((blob: Blob) => {
      void blob; // inspecionado abaixo via mock.calls[0][0]
      return 'blob:relatorio';
    });
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

    const click = vi.fn();
    const remove = vi.fn();
    const setAttribute = vi.fn();
    const link = { click, remove, setAttribute, style: {}, download: '' };
    const appendChild = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) =>
      tag === 'a' ? (link as unknown as HTMLAnchorElement) : originalCreateElement(tag),
    );
    vi.spyOn(document.body, 'appendChild').mockImplementation(appendChild as never);

    downloadCsv('relatorio.csv', '\uFEFFRação;7,5\r\n');

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('text/csv;charset=utf-8');
    expect(setAttribute).toHaveBeenCalledWith('download', 'relatorio.csv');
    expect(appendChild).toHaveBeenCalledWith(link);
    expect(click).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:relatorio');

    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
});
