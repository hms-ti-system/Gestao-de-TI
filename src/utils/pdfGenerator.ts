import jsPDF from "jspdf";
import QRCode from "qrcode";
import { Asset } from "../types";

export async function generateAssetPdf(asset: Asset): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  // Header Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, pageWidth - margin * 2, 22, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("FICHA TÉCNICA E PATRIMONIAL DO ATIVO", margin + 6, y + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    `AssetCentral • Sistema de Gestão de Ativos de TI • Emitido em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
    margin + 6,
    y + 17
  );

  y += 28;

  // Generate QR Code as DataURL
  let qrDataUrl = "";
  try {
    const qrPayload = JSON.stringify({
      id: asset.id,
      name: asset.name,
      sn: asset.seriesNumber,
      mac: asset.macAddress || "",
      nf: asset.invoiceNumber || "",
      model: asset.model,
    });
    // Use asset.id or payload
    qrDataUrl = await QRCode.toDataURL(asset.id, {
      width: 250,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    });
  } catch (err) {
    console.error("Failed to generate QR code for PDF:", err);
  }

  // Top Card: Tag, QR Code, and Primary Identification
  const idCardHeight = 44;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(margin, y, pageWidth - margin * 2, idCardHeight, 3, 3, "FD");

  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, "PNG", margin + 4, y + 4, 36, 36);
    } catch {
      // ignore image error
    }
  }

  const textStartX = margin + 44;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(asset.name || "Equipamento Sem Nome", textStartX, y + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Fabricante: ${asset.manufacturer || "—"}  •  Modelo: ${asset.model || "—"}`,
    textStartX,
    y + 16
  );

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `TAG / Identificador: `,
    textStartX,
    y + 24
  );
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(asset.id, textStartX + 29, y + 24);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Número de Série (N/S): `, textStartX, y + 31);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(asset.seriesNumber || "—", textStartX + 34, y + 31);

  if (asset.cmId) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`CM/ID: `, textStartX + 85, y + 31);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(asset.cmId, textStartX + 97, y + 31);
  }

  // Status Badge in card
  const statusColor =
    asset.status === "Disponível"
      ? [22, 163, 74]
      : asset.status === "Atribuído"
      ? [37, 99, 235]
      : [217, 119, 6];
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(pageWidth - margin - 32, y + 6, 26, 7, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(asset.status.toUpperCase(), pageWidth - margin - 19, y + 10.5, { align: "center" });

  y += idCardHeight + 8;

  // Helper function to draw a section
  const drawSectionHeader = (title: string) => {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, y, pageWidth - margin * 2, 6.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(title.toUpperCase(), margin + 4, y + 4.5);
    y += 9.5;
  };

  const drawFieldRow = (
    fields: Array<{ label: string; value: string; isMono?: boolean; alert?: boolean }>
  ) => {
    const colWidth = (pageWidth - margin * 2) / fields.length;
    fields.forEach((f, idx) => {
      const colX = margin + idx * colWidth;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(f.label.toUpperCase(), colX + 2, y);

      doc.setFont(f.isMono ? "courier" : "helvetica", "bold");
      doc.setFontSize(8.5);
      if (f.alert) {
        doc.setTextColor(220, 38, 38); // red-600
      } else {
        doc.setTextColor(15, 23, 42); // slate-900
      }
      doc.text(f.value || "—", colX + 2, y + 4.5);
    });
    y += 9;
  };

  // Section 1: Dados Fiscais, Compra e Garantia
  drawSectionHeader("Informações Fiscais, Compra e Garantia");

  const formatDate = (d?: string) => {
    if (!d) return "—";
    try {
      const clean = d.split("T")[0];
      const p = clean.split("-");
      if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
      return d;
    } catch {
      return d;
    }
  };

  // Calculate warranty status label
  let warrantyLabel = "—";
  let isWarrantyAlert = false;
  if (asset.warrantyDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const wDate = new Date(asset.warrantyDate);
    wDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((wDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      warrantyLabel = `${formatDate(asset.warrantyDate)} (VENCIDA)`;
      isWarrantyAlert = true;
    } else if (diffDays === 0) {
      warrantyLabel = `${formatDate(asset.warrantyDate)} (VENCE HOJE)`;
      isWarrantyAlert = true;
    } else if (diffDays <= 30) {
      warrantyLabel = `${formatDate(asset.warrantyDate)} (${diffDays} dias restantes)`;
      isWarrantyAlert = true;
    } else {
      warrantyLabel = `${formatDate(asset.warrantyDate)} (Válida)`;
    }
  }

  drawFieldRow([
    { label: "Número da Nota Fiscal (NF)", value: asset.invoiceNumber || "Não Informada", isMono: true },
    { label: "Data de Compra", value: formatDate(asset.purchaseDate) },
    { label: "Data de Cadastro no Sistema", value: formatDate(asset.createdAt || asset.registrationDate) },
  ]);

  drawFieldRow([
    { label: "Fornecedor / Loja", value: asset.supplier || "—" },
    { label: "Custo de Aquisição", value: asset.cost || "—" },
    { label: "Validade da Garantia", value: warrantyLabel, alert: isWarrantyAlert },
  ]);

  y += 3;

  // Section 2: Hardware & Conectividade de Rede (com MAC Address)
  drawSectionHeader("Hardware, Conectividade e Endereçamento de Rede");

  drawFieldRow([
    { label: "Endereço MAC (Físico)", value: asset.macAddress || "Não cadastrado", isMono: true },
    { label: "Sistema Operacional", value: asset.os || "—" },
    { label: "Categoria de Equipamento", value: asset.category || "—" },
  ]);

  drawFieldRow([
    { label: "Processador (CPU)", value: asset.cpu || "—" },
    { label: "Memória RAM", value: asset.ram || "—" },
    { label: "Armazenamento", value: asset.storage || "—" },
  ]);

  y += 3;

  // Section 3: Responsável / Portador Atual
  drawSectionHeader("Portador Atual e Localização");

  if (asset.assignedToUser) {
    drawFieldRow([
      { label: "Usuário Responsável", value: asset.assignedToUser.name },
      { label: "Cargo / Função", value: asset.assignedToUser.role },
      { label: "Departamento", value: asset.assignedToUser.department },
    ]);
    drawFieldRow([
      { label: "E-mail Corporativo", value: asset.assignedToUser.email },
      { label: "Local de Trabalho / Filial", value: asset.assignedToUser.location },
      { label: "Status de Posse", value: "Em Uso Ativo pelo Colaborador" },
    ]);
  } else {
    drawFieldRow([
      { label: "Alocação", value: "Equipamento disponível no Estoque Central de TI" },
      { label: "Responsabilidade", value: "Departamento de Infraestrutura & Suporte" },
    ]);
  }

  y += 3;

  // Section 4: Histórico & Termo de Responsabilidade
  drawSectionHeader("Termo de Responsabilidade e Guarda de Patrimônio");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const legalText =
    "O portador declara haver recebido o equipamento acima discriminado em perfeitas condições de uso e funcionamento, " +
    "comprometendo-se a zelar pela sua integridade, guarda e conservação, utilizando-o exclusivamente para as atividades profissionais. " +
    "Em caso de avaria, perda ou extravio, o departamento de Tecnologia da Informação deverá ser comunicado imediatamente.";
  const splitLegal = doc.splitTextToSize(legalText, pageWidth - margin * 2 - 4);
  doc.text(splitLegal, margin + 2, y);

  y += 18;

  // Signature lines
  const sigWidth = (pageWidth - margin * 2 - 20) / 2;
  const sig1X = margin + 5;
  const sig2X = margin + sigWidth + 15;

  doc.setDrawColor(148, 163, 184); // slate-400
  doc.line(sig1X, y + 10, sig1X + sigWidth, y + 10);
  doc.line(sig2X, y + 10, sig2X + sigWidth, y + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    asset.assignedToUser ? asset.assignedToUser.name : "Assinatura do Responsável",
    sig1X + sigWidth / 2,
    y + 14,
    { align: "center" }
  );
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Colaborador / Portador", sig1X + sigWidth / 2, y + 17.5, { align: "center" });

  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text("Gestão de TI & Ativos", sig2X + sigWidth / 2, y + 14, { align: "center" });
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("AssetCentral Responsável", sig2X + sigWidth / 2, y + 17.5, { align: "center" });

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Documento oficial gerado eletronicamente através do AssetCentral • Identificador Único: ${asset.id}`,
    pageWidth / 2,
    pageHeight - 6,
    { align: "center" }
  );

  // Save PDF
  const filename = `Ficha_Tecnica_${asset.id.replace(/[^a-zA-Z0-9-_]/g, "_")}.pdf`;
  doc.save(filename);
}
