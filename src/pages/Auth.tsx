import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Flame, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  const { user, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-fire mb-4">
            <Flame className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gradient-fire">PyroStock</h1>
          <p className="text-muted-foreground mt-2">
            Sistem de management pentru depozite pirotehnice
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Autentificare</TabsTrigger>
            <TabsTrigger value="signup">Înregistrare</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <LoginForm isSubmitting={isSubmitting} setIsSubmitting={setIsSubmitting} />
          </TabsContent>

          <TabsContent value="signup">
            <SignUpForm isSubmitting={isSubmitting} setIsSubmitting={setIsSubmitting} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function LoginForm({ 
  isSubmitting, 
  setIsSubmitting 
}: { 
  isSubmitting: boolean; 
  setIsSubmitting: (v: boolean) => void;
}) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error('Eroare la autentificare: ' + error.message);
    } else {
      toast.success('Autentificare reușită!');
    }

    setIsSubmitting(false);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Bine ai revenit!</CardTitle>
          <CardDescription>
            Introdu datele tale pentru a te autentifica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="email@exemplu.ro"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Parolă</Label>
            <Input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full gradient-fire text-white border-0"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Se autentifică...
              </>
            ) : (
              'Autentificare'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function SignUpForm({ 
  isSubmitting, 
  setIsSubmitting 
}: { 
  isSubmitting: boolean; 
  setIsSubmitting: (v: boolean) => void;
}) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Parolele nu coincid!');
      return;
    }

    if (password.length < 6) {
      toast.error('Parola trebuie să aibă cel puțin 6 caractere!');
      return;
    }

    setIsSubmitting(true);

    const { error, data } = await signUp(email, password, fullName);

    if (error) {
      toast.error('Eroare la înregistrare: ' + error.message);
      setIsSubmitting(false);
      return;
    }

    // Registration successful - no email needed, admin will approve from app
    setRegistrationComplete(true);
    setIsSubmitting(false);
  };

  if (registrationComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <Clock className="h-5 w-5" />
            Înregistrare în Așteptare
          </CardTitle>
          <CardDescription>
            Contul tău a fost creat și așteaptă aprobare
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Cererea ta de înregistrare a fost trimisă cu succes. 
              Un administrator va verifica și aproba contul tău în cel mai scurt timp.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Vei putea accesa aplicația după ce administratorul aprobă contul tău.
            </p>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            <p>Email înregistrat: <strong>{email}</strong></p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Creează un cont</CardTitle>
          <CardDescription>
            Completează formularul pentru a te înregistra
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-name">Nume complet</Label>
            <Input
              id="signup-name"
              type="text"
              placeholder="Ion Popescu"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="email@exemplu.ro"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Parolă</Label>
            <Input
              id="signup-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-confirm">Confirmă parola</Label>
            <Input
              id="signup-confirm"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full gradient-fire text-white border-0"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Se înregistrează...
              </>
            ) : (
              'Înregistrare'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}