
/** Aplica máscara de CPF: 000.000.000-00 */
export function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/** Aplica máscara de CNPJ: 00.000.000/0000-00 */
export function maskCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/** Aplica máscara de CPF ou CNPJ automaticamente conforme quantidade de dígitos */
export function maskCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 11) {
    return maskCpf(value);
  }
  return maskCnpj(value);
}

/** Remove máscara, retornando apenas dígitos */
export function unmask(value: string): string {
  return value.replace(/\D/g, '');
}

/** Formata CPF para exibição: 000.000.000-00 (sempre 11 dígitos). Retorna string vazia se inválido. */
export function formatCpfDisplay(value: string | undefined | null): string {
  if (value == null || value === '') return '';
  const d = value.replace(/\D/g, '');
  if (d.length !== 11) return value;
  return maskCpf(value);
}

/** Formata CPF ou CNPJ para exibição: 000.000.000-00 ou 00.000.000/0000-00. */
export function formatCpfCnpjDisplay(value: string | undefined | null): string {
  if (value == null || value === '') return '';
  const d = value.replace(/\D/g, '');
  if (d.length <= 11) return d.length === 11 ? maskCpf(value) : value;
  return d.length === 14 ? maskCnpj(value) : value;
}

/** Aplica máscara de CEP: 00000-000 */
export function maskCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/** Formata CEP para exibição: 00000-000 */
export function formatCepDisplay(value: string | undefined | null): string {
  if (value == null || value === '') return '';
  return maskCep(value);
}

/** Aplica máscara de telefone: (00) 00000-0000 ou (00) 0000-0000 */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}
