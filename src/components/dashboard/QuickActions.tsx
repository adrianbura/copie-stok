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
    <Card className="col-span-full lg:col-span-1">
      <CardHeader>
        <CardTitle>Acțiuni Rapide</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
            <Link to="/entries">
              <ArrowDownToLine className="h-5 w-5 text-success" />
              <span className="text-xs">Intrare Nouă</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
            <Link to="/exits">
              <ArrowUpFromLine className="h-5 w-5 text-destructive" />
              <span className="text-xs">Ieșire Nouă</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
            <Link to="/products">
              <Package className="h-5 w-5 text-primary" />
              <span className="text-xs">Produs Nou</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
            <Link to="/reports">
              <FileSpreadsheet className="h-5 w-5 text-accent" />
              <span className="text-xs">Rapoarte</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-4 col-span-1">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs">Import Excel</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-4 col-span-1">
            <Download className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs">Export Excel</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
