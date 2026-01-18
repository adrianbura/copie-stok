import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES } from '@/types';
import { useProducts, useProductStats } from '@/hooks/useProducts';
import { FileSpreadsheet, Download, BarChart3, PieChart, TrendingUp, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Reports() {
  const { data: products } = useProducts();
  const { totalProducts, totalStockValue, lowStockCount, stockByCategory } = useProductStats();

  const categoryChartData = CATEGORIES.map((cat, index) => ({
    name: `Cat. ${cat.id}`,
    fullName: cat.name,
    value: stockByCategory[cat.id] || 0,
    color: COLORS[index],
  }));

  const valueByCategory = CATEGORIES.map((cat, index) => {
    const categoryProducts = products?.filter((p) => p.category === cat.id) || [];
    const value = categoryProducts.reduce((sum, p) => sum + p.quantity * Number(p.unit_price), 0);
    return { name: `Cat. ${cat.id}`, value: Math.round(value), color: COLORS[index] };
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              Rapoarte
            </h1>
            <p className="text-muted-foreground mt-1">Analize și statistici despre stocul de produse pirotehnice</p>
          </div>
          <div className="flex gap-2">
            <Select defaultValue="month">
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Ultima săptămână</SelectItem>
                <SelectItem value="month">Ultima lună</SelectItem>
                <SelectItem value="quarter">Ultimul trimestru</SelectItem>
                <SelectItem value="year">Ultimul an</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2"><Download className="h-4 w-4" />Export PDF</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Package className="h-6 w-6" /></div><div><p className="text-sm text-muted-foreground">Total Produse</p><p className="text-2xl font-bold">{totalProducts}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success"><TrendingUp className="h-6 w-6" /></div><div><p className="text-sm text-muted-foreground">Valoare Totală</p><p className="text-2xl font-bold">{totalStockValue.toLocaleString()} RON</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 text-warning"><BarChart3 className="h-6 w-6" /></div><div><p className="text-sm text-muted-foreground">Stoc Scăzut</p><p className="text-2xl font-bold">{lowStockCount} produse</p></div></div></CardContent></Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Cantitate pe Categorii</CardTitle></CardHeader><CardContent><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={categoryChartData}><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="name" className="text-xs" /><YAxis className="text-xs" /><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number, name: string, props: any) => [`${value} buc`, props.payload.fullName]} /><Bar dataKey="value" radius={[4, 4, 0, 0]}>{categoryChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Bar></BarChart></ResponsiveContainer></div></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5" />Valoare pe Categorii</CardTitle></CardHeader><CardContent><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><RechartsPie><Pie data={valueByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">{valueByCategory.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`${value.toLocaleString()} RON`]} /><Legend /></RechartsPie></ResponsiveContainer></div></CardContent></Card>
        </div>

        <Card><CardHeader><CardTitle>Detalii pe Categorii</CardTitle></CardHeader><CardContent><div className="rounded-lg border overflow-hidden"><table className="w-full"><thead><tr className="bg-muted/50"><th className="text-left p-3 font-semibold">Categorie</th><th className="text-left p-3 font-semibold">Descriere</th><th className="text-right p-3 font-semibold">Produse</th><th className="text-right p-3 font-semibold">Cantitate</th><th className="text-right p-3 font-semibold">Valoare</th></tr></thead><tbody>{CATEGORIES.map((cat) => { const catProducts = products?.filter((p) => p.category === cat.id) || []; const catValue = catProducts.reduce((sum, p) => sum + p.quantity * Number(p.unit_price), 0); return (<tr key={cat.id} className="border-t hover:bg-muted/30"><td className="p-3"><span className="flex items-center gap-2"><span>{cat.icon}</span><span className="font-medium">{cat.name}</span></span></td><td className="p-3 text-sm text-muted-foreground">{cat.description}</td><td className="p-3 text-right">{catProducts.length}</td><td className="p-3 text-right font-semibold">{stockByCategory[cat.id] || 0}</td><td className="p-3 text-right font-semibold">{catValue.toLocaleString()} RON</td></tr>); })}</tbody></table></div></CardContent></Card>
      </div>
    </MainLayout>
  );
}