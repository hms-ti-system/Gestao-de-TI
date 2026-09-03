import React from "react";

interface IsisLogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
}

/**
 * Logotipo oficial ISIS Transportes e Terminais conforme modelo da plaqueta patrimonial física.
 * Reproduz fielmente:
 * - Globo terrestre 3D em azul profundo com a rodovia/pista branca em curva "S" ascendente
 * - Esfera/ponto cinza superior
 * - Tipografia "isis" em itálico encorpado (is em preto, i em preto com pingo ovalado inclinado, s final em azul ciano vivo)
 * - Subtítulo "Transportes e Terminais" em cinza itálico
 */
export const IsisLogo: React.FC<IsisLogoProps> = ({
  className = "",
  size = "md",
  showTagline = true,
}) => {
  const sizeStyles = {
    xs: "h-5 w-auto",
    sm: "h-7 w-auto",
    md: "h-10 w-auto",
    lg: "h-14 w-auto",
    xl: "h-18 w-auto",
  }[size];

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        viewBox="0 0 350 96"
        className={`${sizeStyles} max-w-full drop-shadow-2xs`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="ISIS Transportes e Terminais"
      >
        <defs>
          {/* Gradiente do Globo Terrestre */}
          <radialGradient
            id="isisGlobeGrad"
            cx="38%"
            cy="36%"
            r="68%"
            fx="30%"
            fy="30%"
          >
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="45%" stopColor="#1d4ed8" />
            <stop offset="85%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>

          {/* Sombra interna do globo para efeito 3D */}
          <radialGradient
            id="isisGlobeShadow"
            cx="50%"
            cy="50%"
            r="50%"
          >
            <stop offset="70%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
          </radialGradient>

          {/* Gradiente da Pista / Rodovia em curva S */}
          <linearGradient id="isisRoadGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="25%" stopColor="#f8fafc" />
            <stop offset="70%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>

          {/* Gradiente do Ponto / Esfera Superior Cinza */}
          <radialGradient id="isisDotGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </radialGradient>

          {/* Recorte do Globo para a Pista e Continentes */}
          <clipPath id="isisGlobeClip">
            <circle cx="48" cy="52" r="40" />
          </clipPath>
        </defs>

        {/* 1. GLOBO TERRESTRE COM PISTA EM "S" */}
        <g id="globe-group">
          {/* Base da Esfera */}
          <circle cx="48" cy="52" r="40" fill="url(#isisGlobeGrad)" />

          {/* Continentes estilizados dentro do globo */}
          <g clipPath="url(#isisGlobeClip)">
            {/* Silhueta América do Sul */}
            <path
              d="M32 45 C30 52, 28 62, 34 72 C37 77, 43 82, 45 88 C40 85, 34 78, 29 70 C24 62, 25 50, 29 44 Z"
              fill="#0f2b5c"
              opacity="0.9"
            />
            {/* Silhueta América do Norte / Central */}
            <path
              d="M18 24 C22 18, 30 16, 38 22 C34 26, 30 32, 24 35 C18 36, 15 30, 18 24 Z"
              fill="#0f2b5c"
              opacity="0.85"
            />
            {/* Silhueta Europa / África */}
            <path
              d="M62 26 C68 22, 78 25, 84 32 C80 40, 76 52, 82 62 C80 68, 72 65, 68 56 C65 48, 60 38, 62 26 Z"
              fill="#0f2b5c"
              opacity="0.9"
            />
            {/* Brilho oceânico suave */}
            <circle cx="48" cy="52" r="40" fill="url(#isisGlobeShadow)" />

            {/* Pista / Rodovia Branca em Curva S Transversal */}
            <path
              d="M26 88 C20 72, 34 60, 48 48 C60 36, 68 24, 60 14 C56 12, 53 14, 52 16 C58 26, 48 38, 36 50 C24 62, 14 74, 26 88 Z"
              fill="url(#isisRoadGrad)"
              stroke="#cbd5e1"
              strokeWidth="0.5"
            />
          </g>

          {/* Anel de acabamento do globo */}
          <circle
            cx="48"
            cy="52"
            r="40"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1"
            fill="none"
          />

          {/* Ponto/Esfera superior cinza (topo da curva/i) */}
          <circle cx="60" cy="11" r="6.5" fill="url(#isisDotGrad)" />
        </g>

        {/* 2. TIPOGRAFIA "isis" OFICIAL */}
        <g id="isis-letters" transform="translate(100, 0)">
          {/* PRIMEIRO 'i' (PRETO) */}
          {/* Pingo oval inclinado do primeiro i */}
          <ellipse
            cx="26"
            cy="14"
            rx="12"
            ry="6"
            transform="rotate(-18 26 14)"
            fill="#09090b"
          />
          {/* Haste inclinada do primeiro i */}
          <path
            d="M8 70 L28 26 L48 26 L28 70 Z"
            fill="#09090b"
          />

          {/* PRIMEIRO 's' (PRETO, ITÁLICO ENCORPADO) */}
          <path
            d="M98 28 C90 25, 78 25, 70 28 C59 32, 54 39, 56 46 C58 54, 68 56, 82 59 C95 62, 102 65, 104 73 C106 82, 95 89, 78 89 C64 89, 52 85, 46 80 L52 68 C58 73, 68 77, 78 77 C84 77, 89 74, 88 70 C87 66, 80 63, 68 60 C53 56, 44 52, 42 43 C40 33, 50 24, 68 24 C80 24, 91 27, 96 30 Z"
            fill="#09090b"
          />

          {/* SEGUNDO 'i' (PRETO) */}
          {/* Pingo oval inclinado do segundo i */}
          <ellipse
            cx="136"
            cy="14"
            rx="12"
            ry="6"
            transform="rotate(-18 136 14)"
            fill="#09090b"
          />
          {/* Haste inclinada do segundo i */}
          <path
            d="M118 70 L138 26 L158 26 L138 70 Z"
            fill="#09090b"
          />

          {/* SEGUNDO 's' (AZUL CIANO VIBRANTE ISIS: #0088cc / #0284c7) */}
          <path
            d="M208 28 C200 25, 188 25, 180 28 C169 32, 164 39, 166 46 C168 54, 178 56, 192 59 C205 62, 212 65, 214 73 C216 82, 205 89, 188 89 C174 89, 162 85, 156 80 L162 68 C168 73, 178 77, 188 77 C194 77, 199 74, 198 70 C197 66, 190 63, 178 60 C163 56, 154 52, 152 43 C150 33, 160 24, 178 24 C190 24, 201 27, 206 30 Z"
            fill="#0088cc"
          />
        </g>

        {/* 3. SUBTÍTULO "Transportes e Terminais" */}
        {showTagline && (
          <text
            x="106"
            y="94"
            fill="#64748b"
            fontSize="14.5"
            fontStyle="italic"
            fontWeight="600"
            fontFamily="'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif"
            letterSpacing="0.2"
          >
            Transportes e Terminais
          </text>
        )}
      </svg>
    </div>
  );
};
