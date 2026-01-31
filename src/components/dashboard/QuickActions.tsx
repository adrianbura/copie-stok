import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  FileSpreadsheet,
  Package,
  Upload,
  Download,
} from 'lucide-react';

export function QuickActions() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Acțiuni Rapide</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="h-auto flex-row gap-2 px-4 py-3">
            <Link to="/entries">
              <ArrowDownToLine className="h-4 w-4 text-success" />
              <span className="text-sm">Intrare Nouă</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-row gap-2 px-4 py-3">
            <Link to="/exits">
              <ArrowUpFromLine className="h-4 w-4 text-destructive" />
              <span className="text-sm">Ieșire Nouă</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-row gap-2 px-4 py-3">
            <Link to="/products">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-sm">Produs Nou</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-row gap-2 px-4 py-3">
            <Link to="/reports">
              <FileSpreadsheet className="h-4 w-4 text-accent" />
              <span className="text-sm">Rapoarte</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-row gap-2 px-4 py-3">
            <Link to="/entries" state={{ openDialog: 'importFile' }}>
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Import Excel</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-row gap-2 px-4 py-3">
            <Link to="/entries" state={{ openDialog: 'importInvoice' }}>
              <Download className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Import Factură</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
