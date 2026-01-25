import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCompanySettings, useUpdateCompanySettings } from '@/hooks/useCompanySettings';
import { Building2, Save, Loader2 } from 'lucide-react';

interface CompanySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompanySettingsDialog({ open, onOpenChange }: CompanySettingsDialogProps) {
  const { data: settings, isLoading } = useCompanySettings();
  const updateSettings = useUpdateCompanySettings();

  const [formData, setFormData] = useState({
    company_name: '',
    registration_number: '',
    cui: '',
    address: '',
    phone: '',
    email: '',
    bank_name: '',
    bank_account: '',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        company_name: settings.company_name || '',
        registration_number: settings.registration_number || '',
        cui: settings.cui || '',
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || '',
        bank_name: settings.bank_name || '',
        bank_account: settings.bank_account || '',
      });
    }
  }, [settings]);

  const handleSave = () => {
    if (!settings?.id) return;
    
    updateSettings.mutate({
      id: settings.id,
      ...formData,
    }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Date Firmă
          </DialogTitle>
          <DialogDescription>
            Aceste date vor fi folosite în antetul documentelor generate (Aviz, NIR, etc.)
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="company_name">Denumire Firmă *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="SC FIRMA MEA SRL"
              />
            </div>

            {/* CUI and Registration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cui">CUI</Label>
                <Input
                  id="cui"
                  value={formData.cui}
                  onChange={(e) => setFormData(prev => ({ ...prev, cui: e.target.value }))}
                  placeholder="RO 12345678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registration_number">Nr. Reg. Com.</Label>
                <Input
                  id="registration_number"
                  value={formData.registration_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, registration_number: e.target.value }))}
                  placeholder="J40/1234/2020"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Sediul</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Str. Exemplu Nr. 1, București, Sector 1"
                rows={2}
              />
            </div>

            {/* Contact */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="0721 123 456"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contact@firma.ro"
                />
              </div>
            </div>

            {/* Bank Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bancă</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                  placeholder="Banca Transilvania"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_account">IBAN</Label>
                <Input
                  id="bank_account"
                  value={formData.bank_account}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_account: e.target.value }))}
                  placeholder="RO49 AAAA 1B31 0075 9384 0000"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anulează
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={updateSettings.isPending || !formData.company_name}
          >
            {updateSettings.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvează
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
