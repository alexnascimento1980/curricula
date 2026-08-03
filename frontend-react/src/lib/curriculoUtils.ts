// Se a pessoa colar a URL completa (o normal ao copiar do navegador), tira
// o https://www. automaticamente — o backend já monta esse prefixo
// sozinho, então mantê-lo aqui faria o link final sair duplicado/quebrado.
export function limparUrlPerfil(valor: string): string {
  return valor.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
}

// Converte "2024-03" (formato nativo do <input type="month">) para
// "03/2024" (formato exibido no PDF). Valores já no formato certo, ou
// vazios, passam direto.
export function formatarDataMesAno(v: string): string {
  if (!v) return "";
  const p = v.split("-");
  return p.length === 2 ? `${p[1]}/${p[0]}` : v;
}

// Máscara de telefone extraída do listener inline do script.js original
// para ficar testável isoladamente.
export function aplicarMascaraTelefone(valorDigitado: string): string {
  let v = valorDigitado.replace(/\D/g, "");
  if (v.length > 11) v = v.substring(0, 11);
  if (v.length <= 10) {
    v = v
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  } else {
    v = v
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
  }
  return v;
}

// Converte um Blob (o PDF recebido do backend) para uma string base64 —
// necessário no Android/iOS, onde o Filesystem plugin do Capacitor espera
// os dados nesse formato para gravar o arquivo localmente antes de abrir
// a folha de compartilhamento nativa.
export function blobParaBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const resultado = reader.result as string;
      resolve(resultado.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
