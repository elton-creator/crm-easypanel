import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Upload, Key, Building2 } from 'lucide-react';

interface SystemConfig {
  crmName: string;
  logoUrl: string;
}

const STORAGE_KEY = 'crm_system_config';

export default function SystemSettings() {
  const { user } = useAuth();
  const [config, setConfig] = useState<SystemConfig>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { crmName: 'CRM System', logoUrl: '' };
      }
    }
    return { crmName: 'CRM System', logoUrl: '' };
  });

  const [crmName, setCrmName] = useState(config.crmName);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState(config.logoUrl);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newConfig: SystemConfig = {
      crmName,
      logoUrl: logoPreview
    };
    
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    alert('Configurações salvas com sucesso!');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage('❌ Preencha todos os campos');
      return;
    }

    if (currentPassword !== 'admin123') {
      setPasswordMessage('❌ Senha atual incorreta');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage('❌ A nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage('❌ As senhas não coincidem');
      return;
    }

    try {
      const storedUsers = localStorage.getItem('crm_mock_users');
      if (storedUsers) {
        const users = JSON.parse(storedUsers);
        const updatedUsers = users.map((u: { id: string; password: string }) => {
          if (u.id === '1') {
            return { ...u, password: newPassword };
          }
          return u;
        });
        localStorage.setItem('crm_mock_users', JSON.stringify(updatedUsers));
      }

      setPasswordMessage('✅ Senha alterada com sucesso! Use a nova senha no próximo login.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordMessage('❌ Erro ao alterar senha');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Configurações do Sistema</h2>
      </div>

      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Personalização do CRM</span>
          </CardTitle>
          <CardDescription>
            Personalize o nome e logotipo que aparecem na tela de login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="crmName">Nome do CRM</Label>
              <Input
                id="crmName"
                value={crmName}
                onChange={(e) => setCrmName(e.target.value)}
                placeholder="Ex: Minha Empresa CRM"
              />
              <p className="text-sm text-gray-500">
                Este nome aparecerá na tela de login
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logotipo</Label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Formatos aceitos: JPG, PNG, SVG (máx. 2MB)
                  </p>
                </div>
                {logoPreview && (
                  <div className="flex-shrink-0">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-16 w-16 object-contain border rounded"
                    />
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              Salvar Configurações
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Alterar Senha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>Alterar Senha do Administrador</span>
          </CardTitle>
          <CardDescription>
            Altere sua senha de acesso ao painel administrativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha (mín. 6 caracteres)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a nova senha novamente"
              />
            </div>

            {passwordMessage && (
              <div className={`p-3 rounded-md text-sm ${
                passwordMessage.includes('✅') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {passwordMessage}
              </div>
            )}

            <Button type="submit" className="w-full">
              <Key className="mr-2 h-4 w-4" />
              Alterar Senha
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Usuário:</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Perfil:</span>
            <span className="font-medium">Administrador</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Versão:</span>
            <span className="font-medium">1.0.0</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}