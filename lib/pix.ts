// Generates a PIX "Copia e Cola" string following the Brazilian Central Bank EMV spec.
// https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf

function tlv(id: string, value: string): string {
  const len = String(value.length).padStart(2, '0')
  return `${id}${len}${value}`
}

function crc16(payload: string): string {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export type PixOptions = {
  key: string         // CPF, CNPJ, e-mail, telefone ou chave aleatória
  name: string        // Nome do recebedor (máx 25 chars)
  city: string        // Cidade do recebedor (máx 15 chars)
  amount?: number     // Valor em reais (ex: 59.90). Omitir para valor em aberto.
  txid?: string       // Referência da transação (máx 25 chars)
  description?: string
}

export function generatePix(opts: PixOptions): string {
  const name = opts.name.slice(0, 25).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9 ]/g, '')
  const city = opts.city.slice(0, 15).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9 ]/g, '')
  const txid = (opts.txid ?? '***').slice(0, 25).replace(/[^A-Za-z0-9*]/g, '*') || '***'

  const merchantAccountInfo = tlv('26',
    tlv('00', 'BR.GOV.BCB.PIX') +
    tlv('01', opts.key) +
    (opts.description ? tlv('02', opts.description.slice(0, 72)) : '')
  )

  const amountField = opts.amount != null ? tlv('54', opts.amount.toFixed(2)) : ''

  const additionalData = tlv('62', tlv('05', txid))

  const payload =
    tlv('00', '01') +           // Payload Format Indicator
    tlv('01', '12') +           // Point of Initiation (12 = dynamic/one-time, 11 = static/reusable)
    merchantAccountInfo +
    tlv('52', '0000') +         // MCC
    tlv('53', '986') +          // Currency (BRL)
    amountField +
    tlv('58', 'BR') +           // Country
    tlv('59', name) +           // Merchant name
    tlv('60', city) +           // Merchant city
    additionalData +
    '6304'                       // CRC placeholder

  return payload + crc16(payload)
}
