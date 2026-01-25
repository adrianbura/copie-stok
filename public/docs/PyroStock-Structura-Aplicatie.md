# PyroStock - Structura Aplicației

**Versiune:** 1.0  
**Data:** Ianuarie 2026  
**Descriere:** Sistem de gestiune a stocului pentru produse pirotehnice

---

## 1. Pagini Principale

| Rută | Fișier | Descriere |
|------|--------|-----------|
| `/` | `Dashboard.tsx` | Panou de control - statistici, alerte, acțiuni rapide |
| `/auth` | `Auth.tsx` | Autentificare (login/register) + selectare depozit |
| `/products` | `Products.tsx` | Vizualizare stoc produse (read-only) |
| `/entries` | `Entries.tsx` | Intrări stoc - adăugare produse, import din fișier |
| `/exits` | `Exits.tsx` | Ieșiri stoc - scădere cantități |
| `/reports` | `Reports.tsx` | Rapoarte: istoric documente, registru mișcări |
| `/alerts` | `Alerts.tsx` | Alerte stoc scăzut, expirări |
| `/admin/users` | `AdminUsers.tsx` | Administrare utilizatori (doar admin) |

---

## 2. Componente Principale

### 2.1 Layout
- **MainLayout.tsx** - Layout principal cu sidebar și indicator depozit
- **Sidebar.tsx** - Meniu navigare laterală

### 2.2 Dashboard
- **StockOverview.tsx** - Sumar stoc pe categorii
- **AlertsPanel.tsx** - Panou alerte recente
- **QuickActions.tsx** - Acțiuni rapide
- **RecentMovements.tsx** - Mișcări recente

### 2.3 Produse
- **ProductsTable.tsx** - Tabel produse cu sortare/paginare
- **ProductFilters.tsx** - Filtre căutare
- **ProductDialog.tsx** - Dialog editare produs

### 2.4 Stoc (Intrări/Ieșiri)
- **StockEntryForm.tsx** - Formular intrări multiple
- **StockExitForm.tsx** - Formular ieșiri
- **ProductSearchSelect.tsx** - Căutare produs cu autocomplete
- **MovementsHistory.tsx** - Istoric mișcări
- **ImportInvoiceDialog.tsx** - Import factură (AI parsing)
- **ImportMovementsDialog.tsx** - Import din Excel

### 2.5 Rapoarte
- **DocumentHistoryList.tsx** - Lista documente NIR/AV
- **DocumentViewDialog.tsx** - Vizualizare document
- **ProductMovementRegister.tsx** - Registru mișcări (printabil)
- **PyroOrderPrintTemplates.tsx** - Șabloane print

### 2.6 Setări
- **UserSettingsDialog.tsx** - Setări utilizator
- **ResetDataDialog.tsx** - Resetare date depozit

### 2.7 Depozit
- **WarehouseSelector.tsx** - Selector depozit la autentificare

---

## 3. Hooks Personalizate

| Hook | Scop |
|------|------|
| `useAuth.tsx` | Autentificare, sesiune, profil utilizator |
| `useWarehouse.tsx` | Context depozit selectat |
| `useProducts.tsx` | CRUD produse |
| `useStockMovements.tsx` | Mișcări stoc (intrări/ieșiri) |
| `useInventoryDocuments.tsx` | Documente NIR/AV, numerotare |
| `useAlerts.tsx` | Alerte stoc/expirare |
| `usePendingApprovals.tsx` | Aprobare utilizatori noi |

---

## 4. Structura Bazei de Date

### 4.1 Diagrama Relații

```
warehouses ──┬──► warehouse_stock ◄──┬── products
             │    (quantity/loc)      │   (catalog)
             │                        │
             └──► stock_movements ◄───┘
                  (intrări/ieșiri)

inventory_documents ── NIR/AV cu items JSON

alerts ── Alerte stoc/expirare

profiles ── Date utilizator
user_roles ── Rol (admin/operator/viewer)
pending_approvals ── Utilizatori în așteptare
```

### 4.2 Tabele Detaliate

#### warehouses (Depozite)
| Coloană | Tip | Descriere |
|---------|-----|-----------|
| id | UUID | Identificator unic |
| name | TEXT | Numele depozitului |
| code | TEXT | Cod scurt (DEP-01) |
| address | TEXT | Adresa fizică |
| is_active | BOOLEAN | Activ/Inactiv |

#### products (Catalog Produse)
| Coloană | Tip | Descriere |
|---------|-----|-----------|
| id | UUID | Identificator unic |
| code | TEXT | Cod produs |
| name | TEXT | Denumire |
| category | ENUM | F1, F2, F3, F4, T1, T2 |
| quantity | INTEGER | Cantitate totală |
| min_stock | INTEGER | Stoc minim alertă |
| unit_price | NUMERIC | Preț unitar |
| supplier | TEXT | Furnizor |
| batch_number | TEXT | Număr lot |
| expiry_date | DATE | Data expirare |
| net_weight | NUMERIC | Greutate netă |
| hazard_class | TEXT | Clasă pericol |
| certification | TEXT | Certificări |

#### warehouse_stock (Stoc per Depozit)
| Coloană | Tip | Descriere |
|---------|-----|-----------|
| id | UUID | Identificator unic |
| warehouse_id | UUID | Referință depozit |
| product_id | UUID | Referință produs |
| quantity | INTEGER | Cantitate în depozit |
| min_stock | INTEGER | Stoc minim |
| location | TEXT | Locație în depozit |

#### stock_movements (Mișcări Stoc)
| Coloană | Tip | Descriere |
|---------|-----|-----------|
| id | UUID | Identificator unic |
| product_id | UUID | Referință produs |
| warehouse_id | UUID | Referință depozit |
| type | ENUM | entry / exit |
| quantity | INTEGER | Cantitate |
| date | TIMESTAMP | Data mișcării |
| reference | TEXT | Referință document |
| notes | TEXT | Observații |
| created_by | UUID | Utilizator |

#### inventory_documents (Documente NIR/AV)
| Coloană | Tip | Descriere |
|---------|-----|-----------|
| id | UUID | Identificator unic |
| document_number | TEXT | NIR-2026-0001 / AV-2026-0001 |
| type | TEXT | entry / exit |
| warehouse | TEXT | Numele depozitului |
| date | TIMESTAMP | Data documentului |
| partner | TEXT | Furnizor/Client |
| items | JSONB | Lista produse |
| total_value | NUMERIC | Valoare totală |
| notes | TEXT | Observații |

#### alerts (Alerte)
| Coloană | Tip | Descriere |
|---------|-----|-----------|
| id | UUID | Identificator unic |
| type | ENUM | low_stock / expiry / compliance |
| product_id | UUID | Produs asociat |
| title | TEXT | Titlu alertă |
| message | TEXT | Mesaj detaliat |
| severity | TEXT | warning / error |
| acknowledged | BOOLEAN | Confirmată |

#### profiles (Profiluri Utilizatori)
| Coloană | Tip | Descriere |
|---------|-----|-----------|
| id | UUID | Identificator unic |
| user_id | UUID | Referință auth.users |
| full_name | TEXT | Nume complet |
| avatar_url | TEXT | URL avatar |
| is_approved | BOOLEAN | Cont aprobat |

#### user_roles (Roluri)
| Coloană | Tip | Descriere |
|---------|-----|-----------|
| id | UUID | Identificator unic |
| user_id | UUID | Referință utilizator |
| role | ENUM | admin / operator / viewer |

#### pending_approvals (Aprobare Conturi)
| Coloană | Tip | Descriere |
|---------|-----|-----------|
| id | UUID | Identificator unic |
| user_id | UUID | Utilizator nou |
| email | TEXT | Email |
| full_name | TEXT | Nume |
| status | TEXT | pending / approved / rejected |
| approval_token | UUID | Token aprobare |

---

## 5. Edge Functions (Backend)

| Funcție | Scop |
|---------|------|
| `approve-user` | Aprobă utilizator nou înregistrat |
| `delete-user` | Șterge utilizator din sistem (admin) |
| `parse-invoice` | Parsare factură PDF cu AI (Gemini) |
| `send-approval-notification` | Trimite email notificare |

---

## 6. Securitate & Permisiuni

### 6.1 Row Level Security (RLS)
Toate tabelele au RLS activat pentru protecția datelor.

### 6.2 Roluri și Permisiuni

| Rol | Permisiuni |
|-----|------------|
| **Admin** | Toate operațiunile, gestiune utilizatori, resetare date |
| **Operator** | Intrări, ieșiri, vizualizare rapoarte |
| **Viewer** | Doar vizualizare (read-only) |

---

## 7. Tehnologii Utilizate

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions)
- **AI:** Gemini via Lovable AI Gateway
- **Iconițe:** Lucide React

---

## 8. Caracteristici Cheie

1. **Multi-Warehouse** - Gestiune separată pe depozite
2. **Import AI** - Parsare automată facturi PDF
3. **Import Excel** - Import masiv din fișiere Excel
4. **Documente NIR/AV** - Generare automată cu numerotare
5. **Registru Mișcări** - Raport printabil cu istoric complet
6. **Alerte Automate** - Stoc scăzut, produse expirate
7. **Categorii Pirotehnice** - F1-F4, T1-T2 conform legislației
8. **Șabloane Print** - Comandă/Îndeplinire comandă

---

*Document generat automat din PyroStock*
