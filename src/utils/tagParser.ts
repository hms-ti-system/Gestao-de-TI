/**
 * Utilitário para extração e correspondência de TAGs de plaquetas patrimoniais
 */

export interface ParsedTagResult {
  tag: string;
  raw: string;
  isNumeric: boolean;
  numericValue?: number;
}

/**
 * Extrai o código limpo da TAG a partir do texto decodificado do QR Code
 * Ex: "000937" -> "000937"
 * Ex: "TAG:000937" -> "000937"
 * Ex: "https://.../asset/000937" -> "000937"
 * Ex: '{"id":"000937"}' -> "000937"
 */
/**
 * Extrai o código limpo da TAG a partir do texto decodificado do QR Code.
 * REQUISITO: Deve ser cadastrado SOMENTE OS NÚMEROS, excluindo a palavra "Patrimônio"
 * e a frase "Pertence à ISIS TRANSPORTES E TERMINAIS".
 *
 * Exemplos tratados:
 * - "Patrimônio: 000937\nPertence à ISIS TRANSPORTES E TERMINAIS" -> "000937"
 * - "Pertence à ISIS TRANSPORTES E TERMINAIS - Patrimônio 000937" -> "000937"
 * - "Patrimônio 000937" -> "000937"
 * - "000937" -> "000937"
 * - "TAG: 000937" -> "000937"
 * - "https://.../asset/000937" -> "000937"
 */
export function extractTagFromQrCode(decodedText: string): ParsedTagResult {
  const raw = decodedText ? decodedText.trim() : "";
  if (!raw) {
    return { tag: "", raw: "", isNumeric: false };
  }

  let text = raw;

  // 1. Tentar ler se for JSON (ex: {"id": "000937"})
  if ((text.startsWith("{") && text.endsWith("}")) || (text.startsWith("[") && text.endsWith("]"))) {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") {
        const candidate = parsed.tag || parsed.id || parsed.code || parsed.numero || parsed.assetId || parsed.patrimonio;
        if (candidate) {
          text = String(candidate).trim();
        }
      }
    } catch {
      // continua processamento
    }
  }

  // 2. Se for uma URL (ex: https://empresa.com.br/ativo/000937 ou ?tag=000937)
  if (text.startsWith("http://") || text.startsWith("https://")) {
    try {
      const url = new URL(text);
      const queryTag = 
        url.searchParams.get("tag") || 
        url.searchParams.get("id") || 
        url.searchParams.get("code") || 
        url.searchParams.get("asset") ||
        url.searchParams.get("patrimonio");
      
      if (queryTag) {
        text = queryTag.trim();
      } else {
        const segments = url.pathname.split("/").filter(Boolean);
        if (segments.length > 0) {
          text = segments[segments.length - 1].trim();
        }
      }
    } catch {
      // continua
    }
  }

  // 3. Excluir explicitamente a frase institucional e a palavra "Patrimônio":
  // - "Pertence à ISIS TRANSPORTES E TERMINAIS" (com variações de acento à/a/ao/da, maiúsculas/minúsculas e pontuações)
  // - "ISIS TRANSPORTES E TERMINAIS"
  // - "Patrimônio" / "Patrimonio" / "PATRIMÔNIO" / "PATRIMONIO"
  let cleaned = text;

  // Remover a frase institucional
  cleaned = cleaned.replace(/pertence\s+[aàá]?\s*isis\s+transportes\s+e\s+terminais/gi, " ");
  cleaned = cleaned.replace(/isis\s+transportes\s+e\s+terminais/gi, " ");

  // Remover a palavra "Patrimônio" e variações
  cleaned = cleaned.replace(/patrim[oôó]nio[:.]?/gi, " ");

  // Remover prefixos comuns de identificação
  cleaned = cleaned.replace(/\b(tag|n[ºo]|c[oó]d(?:igo)?|id)\s*[:.]?/gi, " ");

  // 4. Cadastrar SOMENTE OS NÚMEROS:
  // Procura sequências numéricas (mantendo zeros à esquerda, ex: "000937")
  const digitMatches = cleaned.match(/\d+/g);
  let tag = "";

  if (digitMatches && digitMatches.length > 0) {
    if (digitMatches.length === 1) {
      // Caso mais comum da plaqueta: uma única sequência numérica (ex: "000937")
      tag = digitMatches[0];
    } else {
      // Se houver múltiplos blocos de dígitos, seleciona preferencialmente o de 6 dígitos
      // (padrão oficial de plaquetas patrimoniais como ISIS 000937) ou o bloco mais longo
      const sixDigit = digitMatches.find((d) => d.length === 6);
      tag = sixDigit || digitMatches.reduce((max, cur) => (cur.length > max.length ? cur : max), digitMatches[0]);
    }
  } else {
    // Fallback se o código não contiver dígitos (apenas letras/hífens)
    tag = cleaned.replace(/^["':\s]+|["':\s]+$/g, "").trim();
  }

  const isNumeric = /^\d+$/.test(tag);
  const numericValue = isNumeric ? parseInt(tag, 10) : undefined;

  return {
    tag,
    raw,
    isNumeric,
    numericValue,
  };
}

/**
 * Verifica se um ativo corresponde à TAG ou ao QR Code escaneado
 */
export function matchAssetWithCode(asset: { 
  id: string; 
  qrCode?: string; 
  seriesNumber?: string; 
  cmId?: string; 
  macAddress?: string; 
  invoiceNumber?: string; 
}, scannedText: string): boolean {
  if (!asset || !scannedText) return false;
  
  const parsed = extractTagFromQrCode(scannedText);
  const scannedTagLower = parsed.tag.toLowerCase();
  const rawLower = parsed.raw.toLowerCase();
  const assetIdLower = (asset.id || "").toLowerCase();

  // 1. Comparação direta com ID/TAG do ativo
  if (assetIdLower === scannedTagLower || assetIdLower === rawLower) {
    return true;
  }

  // 2. Se ambos forem numéricos (ex: "000937" e "937" ou vice-versa)
  if (parsed.isNumeric && /^\d+$/.test(asset.id)) {
    if (parseInt(asset.id, 10) === parsed.numericValue) {
      return true;
    }
  }

  // 3. Comparação com campo qrCode armazenado especificamente
  if (asset.qrCode) {
    const assetQrLower = asset.qrCode.toLowerCase();
    if (assetQrLower === rawLower || assetQrLower === scannedTagLower) {
      return true;
    }
  }

  // 4. Se o texto escaneado contiver o ID exato como substring
  if (rawLower.includes(assetIdLower) && assetIdLower.length >= 3) {
    return true;
  }

  // 5. Comparação com Número de Série
  if (asset.seriesNumber && asset.seriesNumber.toLowerCase() === scannedTagLower) {
    return true;
  }

  // 6. Comparação com CM / ID interno
  if (asset.cmId && asset.cmId.toLowerCase() === scannedTagLower) {
    return true;
  }

  // 7. Comparação com Endereço MAC
  if (asset.macAddress && asset.macAddress.toLowerCase().replace(/[:-]/g, "") === scannedTagLower.replace(/[:-]/g, "")) {
    return true;
  }

  // 8. Comparação com Nota Fiscal
  if (asset.invoiceNumber && asset.invoiceNumber.toLowerCase() === scannedTagLower) {
    return true;
  }

  return false;
}

/**
 * Toca um bip de confirmação sonora após leitura de QR Code usando Web Audio API
 */
export function playScanSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // Nota Lá (A5)
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // Nota Mi (E6)

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    // áudio não essencial
  }
}
