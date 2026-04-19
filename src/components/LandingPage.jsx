import { useState } from 'react'
import { CheckCircle, MessageCircle, BarChart3, Users, Truck, Zap, Target, Send, ArrowRight, Menu, X, Star, Shield, Clock, TrendingUp } from 'lucide-react'

const WA_LINK = 'https://wa.me/5521964449123?text=Olá%20Geisa!%20Quero%20saber%20mais%20sobre%20o%20CRM%20AutoPeças'

function Logo({ size = 'md' }) {
  const sizes = {
    sm: { icon: 18, text: 'text-base', sub: 'text-[10px]' },
    md: { icon: 26, text: 'text-xl',   sub: 'text-xs' },
    lg: { icon: 38, text: 'text-3xl',  sub: 'text-sm' },
  }
  const s = sizes[size]
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative">
        <div className="rounded-xl flex items-center justify-center"
          style={{
            width: s.icon * 1.6, height: s.icon * 1.6,
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%)',
            boxShadow: '0 4px 14px rgba(37,99,235,0.5)',
          }}>
          <svg width={s.icon} height={s.icon} viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(255,255,255,0.15)" />
            <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-white flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
        </div>
      </div>
      <div>
        <p className={`${s.text} font-black leading-none`} style={{ color: '#1e293b' }}>
          CRM<span style={{ color: '#2563eb' }}>Auto</span>Peças
        </p>
        <p className={`${s.sub} font-semibold`} style={{ color: '#64748b' }}>by Geisa Catonho</p>
      </div>
    </div>
  )
}

const FEATURES = [
  {
    icon: MessageCircle,
    color: '#2563eb',
    bg: '#eff6ff',
    title: 'Kanban de Atendimentos',
    desc: 'Todos os pedidos do WhatsApp organizados em colunas. Nunca perca um cliente na correria.',
  },
  {
    icon: Target,
    color: '#16a34a',
    bg: '#f0fdf4',
    title: 'Prospecção Inteligente',
    desc: 'Encontre oficinas, funilarias e mecânicas na sua região e prospecte com um clique.',
  },
  {
    icon: Send,
    color: '#7c3aed',
    bg: '#faf5ff',
    title: 'Disparos WhatsApp',
    desc: 'Envie mensagens em massa com delay aleatório e IA variando o texto. Sem risco de ban.',
  },
  {
    icon: BarChart3,
    color: '#ea580c',
    bg: '#fff7ed',
    title: 'Relatórios e Vendas',
    desc: 'Acompanhe faturamento, peças mais vendidas e desempenho da equipe em tempo real.',
  },
  {
    icon: Users,
    color: '#0891b2',
    bg: '#ecfeff',
    title: 'Controle de Equipe',
    desc: 'Cada funcionário com suas próprias permissões. Você define quem vê o quê.',
  },
  {
    icon: Truck,
    color: '#b45309',
    bg: '#fffbeb',
    title: 'Tabela de Frete',
    desc: 'Consulta rápida de frete por região durante o atendimento. Sem abrir outra aba.',
  },
]

const PROBLEMS = [
  'Pedidos perdidos no meio de centenas de mensagens',
  'Não sabe quantas vendas fez no mês',
  'Funcionário vê informação que não deveria',
  'Difícil encontrar novos clientes (oficinas, funilarias)',
  'Repasse para colaboradores feito na mão, sem controle',
  'Disparo manual no WhatsApp, lento e arriscado',
]

const STATS = [
  { value: '3x', label: 'mais rápido no atendimento' },
  { value: '0', label: 'pedidos perdidos' },
  { value: '100%', label: 'controle da equipe' },
  { value: '20/dia', label: 'disparos automáticos' },
]

export default function LandingPage({ onEntrar }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc', color: '#1e293b' }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b" style={{ background: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Logo size="sm" />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {[['#funcionalidades','Funcionalidades'],['#problemas','Problemas que resolve'],['#contato','Contato']].map(([href, label]) => (
              <a key={href} href={href} className="text-sm font-semibold transition-colors" style={{ color: '#64748b' }}
                onMouseEnter={e => e.target.style.color='#2563eb'} onMouseLeave={e => e.target.style.color='#64748b'}>
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <a href={WA_LINK} target="_blank" rel="noreferrer"
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{ background: '#dcfce7', color: '#16a34a' }}>
              <MessageCircle size={15} /> WhatsApp
            </a>
            <button onClick={onEntrar}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 2px 8px rgba(37,99,235,0.35)' }}>
              Acessar Sistema <ArrowRight size={14} />
            </button>
            <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden px-5 pb-4 space-y-2 border-t" style={{ borderColor: '#e2e8f0' }}>
            {[['#funcionalidades','Funcionalidades'],['#problemas','Problemas que resolve'],['#contato','Contato']].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm font-semibold" style={{ color: '#475569' }}>{label}</a>
            ))}
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-6"
          style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
          <Zap size={12} /> Sistema profissional para autopeças
        </div>

        <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6" style={{ color: '#0f172a' }}>
          Gerencie seus atendimentos<br />
          <span style={{ color: '#2563eb' }}>do WhatsApp</span> em um só lugar
        </h1>

        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10" style={{ color: '#64748b' }}>
          CRM criado exclusivamente para autopeças. Kanban de pedidos, disparo inteligente, prospecção de oficinas e controle total da sua equipe.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button onClick={onEntrar}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-black text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 8px 24px rgba(37,99,235,0.4)' }}>
            Ver demonstração <ArrowRight size={18} />
          </button>
          <a href={WA_LINK} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold transition-all hover:scale-105"
            style={{ background: '#f0fdf4', color: '#16a34a', border: '2px solid #bbf7d0' }}>
            <MessageCircle size={18} /> Falar com Geisa
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {STATS.map(({ value, label }) => (
            <div key={label} className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
              <p className="text-3xl font-black" style={{ color: '#2563eb' }}>{value}</p>
              <p className="text-xs font-semibold mt-1" style={{ color: '#64748b' }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Problemas */}
      <section id="problemas" className="py-20" style={{ background: '#0f172a' }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#ef4444' }}>Você se identifica?</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">Esses problemas te custam dinheiro todo dia</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-3 max-w-3xl mx-auto">
            {PROBLEMS.map((p, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-4 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <X size={10} className="text-red-400" />
                </div>
                <p className="text-sm text-gray-300 font-medium">{p}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <p className="text-xl font-black text-white">O CRM AutoPeças resolve <span style={{ color: '#22c55e' }}>todos esses pontos.</span></p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="py-20" style={{ background: '#f8fafc' }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#2563eb' }}>Funcionalidades</p>
            <h2 className="text-3xl md:text-4xl font-black" style={{ color: '#0f172a' }}>Tudo que sua autopeças precisa</h2>
            <p className="mt-3 text-lg" style={{ color: '#64748b' }}>Em uma plataforma simples, rápida e que não cai.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="rounded-2xl p-6 transition-all hover:-translate-y-1"
                style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: bg }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <h3 className="font-black text-base mb-2" style={{ color: '#0f172a' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Por que confiar */}
      <section className="py-20" style={{ background: 'white' }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black" style={{ color: '#0f172a' }}>Por que confiar no sistema?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Shield, color: '#2563eb', bg: '#eff6ff', title: 'Dados seguros', desc: 'Hospedado na Vercel, a mesma infraestrutura usada por grandes empresas globais. 99.99% de uptime.' },
              { icon: Clock, color: '#16a34a', bg: '#f0fdf4', title: 'Sempre no ar', desc: 'CDN global com servidores em todo o mundo. Sua loja nunca perde um atendimento por queda do sistema.' },
              { icon: TrendingUp, color: '#ea580c', bg: '#fff7ed', title: 'Feito para crescer', desc: 'Sistema desenvolvido para autopeças reais. Cada funcionalidade resolve um problema do dia a dia.' },
            ].map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="text-center px-6 py-8 rounded-2xl"
                style={{ background: bg, border: `1px solid ${bg}` }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <Icon size={26} style={{ color }} />
                </div>
                <h3 className="font-black text-lg mb-2" style={{ color: '#0f172a' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section id="contato" className="py-24" style={{ background: 'linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 50%,#2563eb 100%)' }}>
        <div className="max-w-3xl mx-auto px-5 text-center">
          <div className="flex justify-center mb-6">
            <div className="flex -space-x-2">
              {['G','C','A','P'].map((l, i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-sm font-black"
                  style={{ background: ['#2563eb','#16a34a','#ea580c','#7c3aed'][i], color: 'white' }}>{l}</div>
              ))}
            </div>
          </div>
          <div className="flex justify-center gap-1 mb-4">
            {[1,2,3,4,5].map(i => <Star key={i} size={20} className="text-yellow-400 fill-yellow-400" />)}
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Pronto para organizar sua autopeças?
          </h2>
          <p className="text-lg text-blue-200 mb-10">
            Fale com Geisa Catonho e veja o sistema funcionando ao vivo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href={WA_LINK} target="_blank" rel="noreferrer"
              className="flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-black transition-all hover:scale-105"
              style={{ background: '#22c55e', color: 'white', boxShadow: '0 8px 24px rgba(34,197,94,0.4)' }}>
              <MessageCircle size={22} /> Falar no WhatsApp agora
            </a>
            <button onClick={onEntrar}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '2px solid rgba(255,255,255,0.3)' }}>
              Ver demonstração <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t" style={{ background: '#0f172a', borderColor: '#1e293b' }}>
        <div className="max-w-6xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-xs" style={{ color: '#475569' }}>
            © 2025 CRM AutoPeças · Desenvolvido por Geisa Catonho
          </p>
          <a href={WA_LINK} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 text-xs font-semibold" style={{ color: '#22c55e' }}>
            <MessageCircle size={14} /> (21) 96444-9123
          </a>
        </div>
      </footer>
    </div>
  )
}
