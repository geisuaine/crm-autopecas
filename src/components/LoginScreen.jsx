import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail, Loader2, Wrench } from 'lucide-react'
import { fazerLogin } from '../lib/supabase'

const MOTIVO_MSG = {
  'Invalid login credentials': 'Email ou senha incorretos.',
  'Email not confirmed':        'Confirme seu email antes de entrar.',
  'usuario_inativo':            'Usuário inativo. Fale com o administrador.',
  'usuario_bloqueado':          'Usuário bloqueado. Fale com o administrador.',
}

export default function LoginScreen({ onLogin }) {
  const [email,    setEmail]    = useState('')
  const [senha,    setSenha]    = useState('')
  const [mostrar,  setMostrar]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [erro,     setErro]     = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !senha.trim()) {
      setErro('Preencha email e senha.')
      return
    }
    setErro('')
    setLoading(true)
    const res = await fazerLogin(email.trim(), senha)
    setLoading(false)
    if (res.sucesso) {
      onLogin(res.usuario, res.session)
    } else {
      setErro(MOTIVO_MSG[res.motivo] || 'Erro ao entrar. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)' }}>

      {/* Glow de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: '0 0 40px rgba(37,99,235,0.4)' }}>
            <Wrench size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">AutoPeças CRM</h1>
          <p className="text-sm text-gray-500 mt-1">Faça login para continuar</p>
        </div>

        {/* Card do formulário */}
        <form onSubmit={handleSubmit}
          className="rounded-2xl p-6 space-y-4"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Senha</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type={mostrar ? 'text' : 'password'}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <button type="button" onClick={() => setMostrar(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                {mostrar ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Erro */}
          {erro && (
            <div className="px-3 py-2 rounded-xl text-xs text-red-400 font-medium"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {erro}
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: loading ? 'rgba(37,99,235,0.5)' : '#2563eb', boxShadow: loading ? 'none' : '0 4px 20px rgba(37,99,235,0.35)' }}>
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Entrando...</>
              : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-6">
          Problemas para acessar? Fale com o administrador.
        </p>
      </div>
    </div>
  )
}
