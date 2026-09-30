// Gera o BR Code Pix estático, o QR da página (docs/index.html) e o QR da placa.
// Uso: npm install && npm run gerar
import { readFileSync, writeFileSync } from 'node:fs';
import QRCode from 'qrcode';

const CHAVE = '+5517991028063';
const CHAVE_VISIVEL = '(17) 99102-8063';
const CHAVE_COPIA = '17991028063'; // o que o toque na chave copia
const NOME_NO_BANCO = 'Rafael Costa';
const COR_BOTAO = '#4b2470';
const NOME = 'RAFAEL COSTA'; // campo 59, até 25
const CIDADE = 'S J RIO PRETO'; // campo 60, até 15

const campo = (id, valor) => id + String(valor.length).padStart(2, '0') + valor;

function crc16(texto) {
  let crc = 0xffff;
  for (const byte of Buffer.from(texto, 'utf8')) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function brcode() {
  if (NOME.length > 25 || CIDADE.length > 15) throw new Error('nome ou cidade longos demais');
  if (/[^A-Z0-9 ]/.test(NOME + CIDADE)) throw new Error('nome e cidade: só A-Z, 0-9 e espaço');
  const semCrc =
    campo('00', '01') +
    campo('26', campo('00', 'br.gov.bcb.pix') + campo('01', CHAVE)) +
    campo('52', '0000') +
    campo('53', '986') +
    campo('58', 'BR') +
    campo('59', NOME) +
    campo('60', CIDADE) +
    campo('62', campo('05', '***')) +
    '6304';
  return semCrc + crc16(semCrc);
}

// Exemplo do manual do BC, para conferir o CRC
const exemplo = '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***6304';
if (crc16(exemplo) !== '1D3D') throw new Error('CRC16 não confere com o exemplo do manual');

const payload = brcode();
const svg = await QRCode.toString(payload, {
  type: 'svg',
  errorCorrectionLevel: 'M',
  margin: 4,
  color: { dark: '#000000', light: '#ffffff' },
});

writeFileSync(new URL('../placa-qr.svg', import.meta.url), svg);

const svgInline = svg
  .trim()
  .replace(' xmlns="http://www.w3.org/2000/svg"', '')
  .replace('<svg ', '<svg role="img" aria-label="QR Code Pix" ');

const html = readFileSync(new URL('modelo.html', import.meta.url), 'utf8')
  .replace('{{QR}}', svgInline)
  .replace('{{CHAVE}}', CHAVE_VISIVEL)
  .replaceAll('{{CHAVE_COPIA}}', CHAVE_COPIA)
  .replace('{{NOME_NO_BANCO}}', NOME_NO_BANCO)
  .replace('{{COR_BOTAO}}', COR_BOTAO);
writeFileSync(new URL('../docs/index.html', import.meta.url), html);

console.log(payload);
