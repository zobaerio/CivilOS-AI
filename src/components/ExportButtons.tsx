import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, FileType, Sheet, ChevronDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  downloadAsExcel,
  downloadAsCSV,
  downloadAsPDF,
  downloadAsWord,
  openInGoogleSheets,
} from '@/utils/exportUtils';

interface ExportButtonsProps {
  data: object[];
  sheetName: string;
  fileName: string;
  title: string;
}

export function ExportButtons({ data, sheetName, fileName, title }: ExportButtonsProps) {
  const [loading, setLoading] = useState(false);
  const isEmpty = !data || data.length === 0;

  const handle = async (label: string, fn: () => void | Promise<void>) => {
    if (isEmpty) return;
    setLoading(true);
    toast({ title: '⏳ প্রস্তুত হচ্ছে...', description: `${label} তৈরি হচ্ছে` });
    try {
      await fn();
      toast({ title: '✅ সফল!', description: `${label} সম্পন্ন হয়েছে` });
    } catch {
      toast({ title: '❌ সমস্যা হয়েছে', description: 'আবার চেষ্টা করুন', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isEmpty || loading} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            ডাউনলোড করুন
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuLabel>ফরম্যাট বেছে নিন</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handle('Excel ফাইল', () => downloadAsExcel(data, sheetName, fileName))}>
            <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
            Excel (.xlsx)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handle('PDF ফাইল', () => downloadAsPDF(data, fileName, title))}>
            <FileType className="w-4 h-4 mr-2 text-red-500" />
            PDF (.pdf)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handle('CSV ফাইল', () => downloadAsCSV(data, fileName))}>
            <FileText className="w-4 h-4 mr-2 text-blue-500" />
            CSV (.csv)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handle('Word ফাইল', () => downloadAsWord(data, fileName, title))}>
            <FileText className="w-4 h-4 mr-2 text-blue-700" />
            Word (.docx)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        disabled={isEmpty || loading}
        onClick={() => handle('Google Sheets', () => openInGoogleSheets(data, fileName))}
        className="flex items-center gap-2"
      >
        <Sheet className="w-4 h-4 text-green-600" />
        Google Sheets-এ ওপেন করুন
      </Button>
    </div>
  );
}

export default ExportButtons;
