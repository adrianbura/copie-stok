import { useState } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInventoryDocuments, InventoryDocument } from '@/hooks/useInventoryDocuments';
import { DocumentViewDialog } from './DocumentViewDialog';
import { FileText, Eye, ArrowDownToLine, ArrowUpFromLine, Loader2 } from 'lucide-react';
import { useWarehouseContext } from '@/hooks/useWarehouse';

interface DocumentHistoryListProps {
  type: 'entry' | 'exit';
}

export function DocumentHistoryList({ type }: DocumentHistoryListProps) {
  const { selectedWarehouse } = useWarehouseContext();
  const { data: documents, isLoading } = useInventoryDocuments(type, selectedWarehouse?.id);
  const [selectedDocument, setSelectedDocument] = useState<InventoryDocument | null>(null);

  const Icon = type === 'entry' ? ArrowDownToLine : ArrowUpFromLine;
  const title = type === 'entry' ? 'Istoric Intrări' : 'Istoric Ieșiri';
  const iconColor = type === 'entry' ? 'text-success' : 'text-destructive';

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${iconColor}`} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents && documents.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nr. Document</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>{type === 'entry' ? 'Furnizor' : 'Beneficiar'}</TableHead>
                    <TableHead className="text-center">Produse</TableHead>
                    <TableHead className="text-right">Valoare</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-mono font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {doc.document_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(doc.date), 'dd MMM yyyy', { locale: ro })}
                      </TableCell>
                      <TableCell>
                        {doc.partner || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {doc.items.length} produse
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {doc.total_value.toLocaleString()} RON
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {doc.operator_name}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDocument(doc)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Vezi
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Nu există documente de {type === 'entry' ? 'intrare' : 'ieșire'} salvate.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Documentele vor apărea aici după salvarea operațiunilor din secțiunea{' '}
                {type === 'entry' ? 'Intrări' : 'Ieșiri'}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <DocumentViewDialog
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
      />
    </>
  );
}
