/**
 * Utilitário para compressão e otimização de imagens antes de salvar no Firestore / LocalStorage
 * Evita estourar o limite rígido de 1MB por documento do Firebase Firestore e a cota do LocalStorage.
 */
export async function compressImageFile(file: File, maxWidth = 1000, maxHeight = 1000, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    // Se não for imagem, rejeita
    if (!file.type.startsWith("image/")) {
      reject(new Error("O arquivo fornecido não é uma imagem válida."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo de imagem."));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Falha ao processar o formato da imagem."));
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          // Redimensionamento proporcional se ultrapassar limites
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            // Fallback caso não obtenha context 2d
            resolve(event.target?.result as string);
            return;
          }

          // Fundo branco para imagens com transparência
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Converte para JPEG com qualidade compactada (ótimo equilíbrio visual e tamanho ~50-120KB)
          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedDataUrl);
        } catch (err) {
          // Fallback caso ocorra algum erro no canvas
          resolve(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
