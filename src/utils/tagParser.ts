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
export function extractTagFromQrCode(decodedText: string): ParsedTagResult {
  const raw = decodedText ? decodedText.trim() : "";
  if (!raw) {
    return { tag: "", raw: "", isNumeric: false };
  }

  let tag = raw;

  // 1. Tentar ler se for JSON
  if ((tag.startsWith("{") && tag.endsWith("}")) || (tag.startsWith("[") && tag.endsWith("]"))) {
    try {
      const parsed = JSON.parse(tag);
      if (parsed && typeof parsed === "object") {
        const candidate = parsed.tag || parsed.id || parsed.code || parsed.numero || parsed.assetId || parsed.patrimonio;
        if (candidate) {
          tag = String(candidate).trim();
        }
      }
    } catch {
      // continua processamento
    }
  }

  // 2. Se for uma URL (ex: https://empresa.com.br/ativo/000937 ou ?tag=000937)
  if (tag.startsWith("http://") || tag.startsWith("https://")) {
    try {
      const url = new URL(tag);
      const queryTag = 
        url.searchParams.get("tag") || 
        url.searchParams.get("id") || 
        url.searchParams.get("code") || 
        url.searchParams.get("asset") ||
        url.searchParams.get("patrimonio");
      
      if (queryTag) {
        tag = queryTag.trim();
      } else {
        const segments = url.pathname.split("/").filter(Boolean);
        if (segments.length > 0) {
          tag = segments[segments.length - 1].trim();
        }
      }
    } catch {
      // continua
    }
  }

  // 3. Se contiver prefixo como "TAG: 000937" ou "PATRIMONIO: 000937" ou "ISIS: 000937"
  if (tag.includes(":")) {
    const parts = tag.split(":");
    const lastPart = parts[parts.length - 1].trim();
    if (lastPart) {
      tag = lastPart;
    }
  }

  // 4. Limpar aspas ou colchetes residuais
  tag = tag.replace(/^["']|["']$/g, "").trim();

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
