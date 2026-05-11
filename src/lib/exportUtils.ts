export const exportToPDF = (content: string, filename: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  printWindow.document.write(`
    <html>
      <head>
        <title>${filename}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body { 
            font-family: 'Poppins', sans-serif; 
            padding: 2rem; 
            max-width: 800px; 
            margin: 0 auto; 
            color: #4A4A4A;
            line-height: 1.6;
            background-color: #FFF9F0;
          }
          h1 { color: #FFB7C5; font-size: 2.5rem; margin-bottom: 0.5rem; text-align: center; }
          h2 { color: #C5B9E0; border-bottom: 2px solid #FEE2E2; padding-bottom: 0.5rem; margin-top: 2rem; }
          .date { text-align: center; font-size: 0.8rem; opacity: 0.6; margin-bottom: 2rem; }
          .card { 
            background: white;
            border: 1px solid #C5B9E0; 
            padding: 1.5rem; 
            margin: 1rem 0; 
            border-radius: 1.5rem; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          }
          .emblem { text-align: center; font-size: 3rem; margin: 1rem 0; }
          .footer { text-align: center; margin-top: 4rem; font-size: 0.7rem; opacity: 0.4; }
          .question { font-weight: 700; color: #FFB7C5; }
          .answer { margin-top: 0.5rem; border-top: 1px dashed #FEE2E2; padding-top: 0.5rem; }
          .task { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
          .task-check { color: #C5E6D6; font-size: 1.2rem; }
          @media print {
            body { background: white; }
            .card { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="emblem">🎀</div>
        <h1>Mochi Study</h1>
        <div class="date">Exported on ${new Date().toLocaleDateString()}</div>
        ${content}
        <div class="footer">Created with love by Mochi // Study 🌸</div>
      </body>
    </html>
  `);
  printWindow.document.close();
  // Wait for fonts to load before printing
  printWindow.onload = () => {
    printWindow.print();
  };
};
