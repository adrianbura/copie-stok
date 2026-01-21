import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePendingApprovals, PendingApproval } from '@/hooks/usePendingApprovals';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Check, X, Clock, UserCheck, UserX, Users, Loader2 } from 'lucide-react';

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
          <Clock className="h-3 w-3 mr-1" />
          În așteptare
        </Badge>
      );
    case 'approved':
      return (
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
          <UserCheck className="h-3 w-3 mr-1" />
          Aprobat
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
          <UserX className="h-3 w-3 mr-1" />
          Respins
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function UserRow({ 
  approval, 
  onApprove, 
  onReject,
  isApproving,
  isRejecting 
}: { 
  approval: PendingApproval;
  onApprove: (approval: PendingApproval) => void;
  onReject: (approval: PendingApproval) => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{approval.full_name || 'Fără nume'}</span>
          <span className="text-sm text-muted-foreground">{approval.email}</span>
        </div>
      </TableCell>
      <TableCell>
        {format(new Date(approval.created_at), 'dd MMM yyyy, HH:mm', { locale: ro })}
      </TableCell>
      <TableCell>
        {getStatusBadge(approval.status)}
      </TableCell>
      <TableCell>
        {approval.status === 'pending' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onApprove(approval)}
              disabled={isApproving || isRejecting}
              className="bg-primary hover:bg-primary/90"
            >
              {isApproving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Aprobă
                </>
              )}
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={isApproving || isRejecting}
                >
                  {isRejecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Respinge
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Respinge utilizatorul?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ești sigur că vrei să respingi cererea de înregistrare pentru{' '}
                    <strong>{approval.full_name || approval.email}</strong>?
                    Utilizatorul nu va putea accesa aplicația.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anulează</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onReject(approval)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Respinge
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
        {approval.status === 'approved' && approval.approved_at && (
          <span className="text-sm text-muted-foreground">
            Aprobat la {format(new Date(approval.approved_at), 'dd MMM yyyy', { locale: ro })}
          </span>
        )}
        {approval.status === 'rejected' && approval.rejected_at && (
          <span className="text-sm text-muted-foreground">
            Respins la {format(new Date(approval.rejected_at), 'dd MMM yyyy', { locale: ro })}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function AdminUsers() {
  const { isAdmin, loading } = useAuth();
  const { 
    approvals, 
    isLoading, 
    approveUser, 
    rejectUser,
    pendingCount 
  } = usePendingApprovals();

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const approvedApprovals = approvals.filter(a => a.status === 'approved');
  const rejectedApprovals = approvals.filter(a => a.status === 'rejected');

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestionare Utilizatori</h1>
          <p className="text-muted-foreground">
            Aprobă sau respinge cererile de înregistrare
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>În așteptare</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                {pendingApprovals.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Aprobați</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                {approvedApprovals.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Respinși</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <UserX className="h-5 w-5 text-destructive" />
                {rejectedApprovals.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Utilizatori Înregistrați
            </CardTitle>
            <CardDescription>
              Lista tuturor utilizatorilor care s-au înregistrat în aplicație
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="mb-4">
                <TabsTrigger value="pending" className="gap-2">
                  În așteptare
                  {pendingCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {pendingCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approved">Aprobați</TabsTrigger>
                <TabsTrigger value="rejected">Respinși</TabsTrigger>
                <TabsTrigger value="all">Toți</TabsTrigger>
              </TabsList>

              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <TabsContent value="pending">
                    <UsersTable 
                      approvals={pendingApprovals}
                      onApprove={(a) => approveUser.mutate(a)}
                      onReject={(a) => rejectUser.mutate(a)}
                      isApproving={approveUser.isPending}
                      isRejecting={rejectUser.isPending}
                      emptyMessage="Nu există cereri de înregistrare în așteptare."
                    />
                  </TabsContent>
                  <TabsContent value="approved">
                    <UsersTable 
                      approvals={approvedApprovals}
                      onApprove={(a) => approveUser.mutate(a)}
                      onReject={(a) => rejectUser.mutate(a)}
                      isApproving={approveUser.isPending}
                      isRejecting={rejectUser.isPending}
                      emptyMessage="Nu există utilizatori aprobați."
                    />
                  </TabsContent>
                  <TabsContent value="rejected">
                    <UsersTable 
                      approvals={rejectedApprovals}
                      onApprove={(a) => approveUser.mutate(a)}
                      onReject={(a) => rejectUser.mutate(a)}
                      isApproving={approveUser.isPending}
                      isRejecting={rejectUser.isPending}
                      emptyMessage="Nu există utilizatori respinși."
                    />
                  </TabsContent>
                  <TabsContent value="all">
                    <UsersTable 
                      approvals={approvals}
                      onApprove={(a) => approveUser.mutate(a)}
                      onReject={(a) => rejectUser.mutate(a)}
                      isApproving={approveUser.isPending}
                      isRejecting={rejectUser.isPending}
                      emptyMessage="Nu există utilizatori înregistrați."
                    />
                  </TabsContent>
                </>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

function UsersTable({ 
  approvals, 
  onApprove, 
  onReject,
  isApproving,
  isRejecting,
  emptyMessage 
}: { 
  approvals: PendingApproval[];
  onApprove: (approval: PendingApproval) => void;
  onReject: (approval: PendingApproval) => void;
  isApproving: boolean;
  isRejecting: boolean;
  emptyMessage: string;
}) {
  if (approvals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Utilizator</TableHead>
          <TableHead>Data înregistrării</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Acțiuni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {approvals.map((approval) => (
          <UserRow
            key={approval.id}
            approval={approval}
            onApprove={onApprove}
            onReject={onReject}
            isApproving={isApproving}
            isRejecting={isRejecting}
          />
        ))}
      </TableBody>
    </Table>
  );
}
