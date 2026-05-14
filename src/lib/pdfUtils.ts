import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export interface PDFStudyData {
  title: string;
  topic: string;
  sections: {
    heading: string;
    content: string;
    keyPoints?: string[];
  }[];
  summary: string;
  definitions?: { term: string; definition: string }[];
}

export const generateStudyPDF = (data: PDFStudyData) => {
  const doc = new jsPDF();
  const pink = [255, 182, 193];
  const pastelBlue = [224, 247, 250];
  
  // Helper for text wrapping and auto-paging
  const addTextWithPaging = (text: string, x: number, y: number, maxWidth: number, fontSize: number, style: 'normal' | 'bold' = 'normal'): number => {
    doc.setFont('helvetica', style);
    doc.setFontSize(fontSize);
    const lines: string[] = doc.splitTextToSize(text, maxWidth);
    let currentY = y;
    
    lines.forEach(line => {
      if (currentY > 280) {
        doc.addPage();
        // Add minimal header to new page
        doc.setFillColor(255, 245, 247);
        doc.rect(0, 0, 210, 10, 'F');
        currentY = 25;
      }
      doc.text(line, x, currentY);
      currentY += (fontSize * 0.5);
    });
    
    return currentY;
  };

  // Title Page
  doc.setFillColor(255, 245, 247);
  doc.rect(0, 0, 210, 297, 'F');
  
  // Decorative circles
  doc.setFillColor(255, 182, 193, 0.2);
  doc.circle(210, 0, 80, 'F');
  doc.setFillColor(162, 210, 255, 0.2);
  doc.circle(0, 297, 60, 'F');

  doc.setTextColor(255, 105, 180);
  doc.setFontSize(42);
  doc.setFont('helvetica', 'bold');
  doc.text('MOCHI AI', 105, 100, { align: 'center' });
  
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(28);
  doc.text('Smart Study Series', 105, 115, { align: 'center' });
  
  doc.setDrawColor(255, 182, 193);
  doc.setLineWidth(1);
  doc.line(40, 130, 170, 130);

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(18);
  doc.text(data.title, 105, 150, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'italic');
  doc.text(`Focus Topic: ${data.topic}`, 105, 160, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 270, { align: 'center' });
  doc.text('🍡 Designed with love by Mochi AI Study Assistant 🎀', 105, 280, { align: 'center' });
  
  // Content Pages
  data.sections.forEach((section, index) => {
    doc.addPage();
    
    // Page Header
    doc.setFillColor(255, 182, 193);
    doc.rect(0, 0, 210, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`PART ${index + 1}: ${section.heading.toUpperCase()}`, 15, 10);
    
    // Content Heading
    doc.setTextColor(255, 105, 180);
    doc.setFontSize(22);
    doc.text(section.heading, 15, 35);
    
    let currentY = 45;
    
    // Summary of section
    doc.setTextColor(60, 60, 60);
    currentY = addTextWithPaging(section.content, 15, currentY, 180, 11);
    currentY += 10;
    
    if (section.keyPoints && section.keyPoints.length > 0) {
      doc.setFillColor(255, 240, 245);
      doc.roundedRect(15, currentY - 5, 180, (section.keyPoints.length * 7) + 10, 5, 5, 'F');
      
      doc.setTextColor(255, 105, 180);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('✨ Key Takeaways', 20, currentY + 2);
      currentY += 10;
      
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      section.keyPoints.forEach(point => {
        if (currentY > 280) {
            doc.addPage();
            currentY = 20;
        }
        doc.text(`🍡 ${point}`, 25, currentY);
        currentY += 7;
      });
    }
  });

  // Definitions Page
  if (data.definitions && data.definitions.length > 0) {
    doc.addPage();
    doc.setFillColor(162, 210, 255);
    doc.rect(0, 0, 210, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('VOCABULARY & CONCEPTS', 15, 10);

    doc.setTextColor(45, 90, 142);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('The Glossary 📖', 15, 35);
    
    let currentY = 45;
    data.definitions.forEach(def => {
      if (currentY > 260) {
        doc.addPage();
        currentY = 25;
      }
      doc.setTextColor(255, 105, 180);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(def.term, 15, currentY);
      currentY += 6;
      
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      currentY = addTextWithPaging(def.definition, 20, currentY, 170, 10);
      currentY += 8;
    });
  }
  
  // Summary Page
  doc.addPage();
  doc.setFillColor(255, 245, 247);
  doc.rect(0, 0, 210, 297, 'F');
  
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, 30, 180, 100, 10, 10, 'F');
  
  doc.setTextColor(255, 105, 180);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Final Conclusion ✨', 105, 55, { align: 'center' });
  
  doc.setTextColor(110, 110, 110);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'italic');
  addTextWithPaging(data.summary, 25, 75, 160, 11);

  // Quote
  doc.setTextColor(255, 182, 193);
  doc.setFontSize(14);
  doc.text('"Success is the sum of small efforts, repeated day in and day out."', 105, 200, { align: 'center' });
  doc.setFontSize(10);
  doc.text('- Mochi AI', 105, 210, { align: 'center' });

  // Footer on all content pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(`Mochi AI Study Series | Page ${i-1} of ${pageCount-1}`, 105, 290, { align: 'center' });
  }

  doc.save(`${data.title.replace(/\s+/g, '_')}_Study_Notes.pdf`);
};
