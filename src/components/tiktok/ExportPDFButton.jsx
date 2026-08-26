import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download, Loader2 } from 'lucide-react';

export const ExportPDFButton = ({ targetId = 'dashboard-content', filename = 'Rapport_Lumina_TikTok.pdf' }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById(targetId);
      if (!element) {
        console.error(`Element with id ${targetId} not found`);
        setIsExporting(false);
        return;
      }

      // Hide elements not needed in PDF (like buttons)
      const elementsToHide = document.querySelectorAll('.no-print');
      elementsToHide.forEach(el => el.classList.add('hidden'));

      // Configure html2canvas to ensure good quality
      const canvas = await html2canvas(element, {
        scale: 2, // Better resolution
        useCORS: true, // Handle external images (like avatars)
        logging: false,
        backgroundColor: '#ffffff'
      });

      elementsToHide.forEach(el => el.classList.remove('hidden'));

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(filename);
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`no-print flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-xl ${isExporting ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
      <span>{isExporting ? 'Génération...' : 'Export PDF'}</span>
    </button>
  );
};
