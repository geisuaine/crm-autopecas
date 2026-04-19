import { useState } from 'react'
import { Truck, MapPin, Calculator } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function FreightView() {
  const { freightTable } = useApp()
  const [selectedZone, setSelectedZone] = useState('')
  const [pieceValue, setPieceValue]     = useState('')
  const numericZones = freightTable.filter(r => r.value !== null)

  const freight    = selectedZone ? Number(selectedZone) : 0
  const total      = pieceValue && freight ? (Number(pieceValue) + freight).toFixed(2) : null

  return (
    <div className="p-5 max-w-2xl">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-white">Tabela de Frete</h2>
        <p className="text-xs text-gray-500 mt-0.5">Valores por região de entrega</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-5 py-3.5 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-gray-500" />
              <span className="text-sm font-bold text-gray-300">Região</span>
            </div>
            <span className="text-sm font-bold text-gray-300">Frete</span>
          </div>
          {freightTable.map((row, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2.5">
                <Truck size={13} className="text-blue-600 shrink-0" />
                <span className="text-sm text-gray-400">{row.zone}</span>
              </div>
              <span className={`text-sm font-bold ${row.value !== null ? 'text-blue-400' : 'text-gray-600'}`}>
                {row.value !== null ? `R$ ${row.value},00` : 'Consultar'}
              </span>
            </div>
          ))}
        </div>

        {/* Calculator */}
        <div>
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Calculator size={16} className="text-blue-400" />
              <p className="font-bold text-white">Calcular Total</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Valor da Peça</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">R$</span>
                  <input
                    type="number"
                    value={pieceValue}
                    onChange={e => setPieceValue(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none text-white placeholder:text-gray-600"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Região de Entrega</label>
                <select
                  value={selectedZone}
                  onChange={e => setSelectedZone(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl text-sm focus:outline-none text-gray-300"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <option value="" style={{ background: '#0d1f42' }}>Selecionar região...</option>
                  {numericZones.map((r, i) => (
                    <option key={i} value={r.value} style={{ background: '#0d1f42' }}>{r.zone} — R$ {r.value},00</option>
                  ))}
                </select>
              </div>
            </div>

            {total && (
              <div className="mt-4 rounded-2xl p-4" style={{ background: 'rgba(29,78,216,0.1)', border: '1px solid rgba(29,78,216,0.2)' }}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">Peça</span>
                  <span className="font-semibold text-gray-300">R$ {Number(pieceValue).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-gray-500">Frete</span>
                  <span className="font-semibold text-gray-300">R$ {freight},00</span>
                </div>
                <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(29,78,216,0.3)' }}>
                  <span className="font-bold text-blue-400">Total</span>
                  <span className="text-lg font-black text-blue-400">R$ {total}</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 rounded-2xl p-4" style={{ background: 'rgba(202,138,4,0.08)', border: '1px solid rgba(202,138,4,0.2)' }}>
            <p className="text-xs font-semibold text-yellow-500 mb-1">💡 Desconto dinheiro</p>
            <p className="text-xs text-yellow-700 leading-relaxed">
              O desconto é aplicado exclusivamente para pagamento em dinheiro. Pix e cartão seguem o valor integral.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
