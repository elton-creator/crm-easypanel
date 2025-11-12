import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, LogIn, Trash2, Bug } from 'lucide-react';

interface SystemConfig {
  crmName: string;
  logoUrl: string;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [config, setConfig] = useState<SystemConfig>({ crmName: 'CRM System', logoUrl: '' });

  useEffect(() => {
    const stored = localStorage.getItem('crm_system_config');
    if (stored) {
      try {
        setConfig(JSON.parse(stored));
      } catch {
        setConfig({ crmName: 'CRM System', logoUrl: '' });
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Erro ao fazer login');
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = () => {
    if (confirm('Tem certeza que deseja limpar todos os dados do navegador? Esta ação não pode ser desfeita.')) {
      localStorage.clear();
      sessionStorage.clear();
      alert('Dados limpos! A página será recarregada.');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex flex-col items-center space-y-4">
            {config.logoUrl && (
              <img 
                src={config.logoUrl} 
                alt="Logo" 
                className="h-20 w-auto object-contain"
              />
            )}
            <div className="text-center">
              <CardTitle className="text-2xl font-bold">{config.crmName}</CardTitle>
              <CardDescription>Faça login para acessar o sistema</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              <LogIn className="mr-2 h-4 w-4" />
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t space-y-2">
            <p className="text-xs text-gray-500 text-center mb-2">
              Credenciais de teste
            </p>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Admin:</strong> admin@crm.com / admin123</p>
              <p><strong>Cliente:</strong> joao@empresa.com / client123</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleClearData}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar Dados do Navegador
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => navigate('/debug')}
            >
              <Bug className="mr-2 h-4 w-4" />
              Ferramenta de Diagnóstico
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}