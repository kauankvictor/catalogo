import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { Search, ShoppingBag, X, MessageCircle, Image as ImageIcon, ChevronLeft, ChevronRight, Maximize2, Info, MapPin } from 'lucide-react'

export default function Catalogo() {
  const [produtos, setProdutos] = useState([])
  const [nomeLoja, setNomeLoja] = useState('Paulinha variedades')
  const [carregando, setCarregando] = useState(true)
  const [pesquisa, setPesquisa] = useState('')
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos')
  
  const [produtoSelecionado, setProdutoSelecionado] = useState(null)
  const [fotoExpandidaIndex, setFotoExpandidaIndex] = useState(null)
  const [modalInfoAberta, setModalInfoAberta] = useState(false)

  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  useEffect(() => {
    const carregarInformacoes = async () => {
      try {
        const queryProdutos = await getDocs(collection(db, "produtos"))
        const produtosDoBanco = queryProdutos.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setProdutos(produtosDoBanco)

        try {
          const dadosLojaSalvos = JSON.parse(localStorage.getItem('storefy_dados_loja') || '{}')
          if (dadosLojaSalvos && dadosLojaSalvos.nomeLoja) {
            setNomeLoja(dadosLojaSalvos.nomeLoja)
          }
        } catch (e) {
          console.error("Erro ao ler configurações locais.")
        }

      } catch (error) {
        console.error("Erro ao carregar o catálogo de produtos:", error)
      } finally {
        setCarregando(false)
      }
    }

    carregarInformacoes()
  }, [])

  const tema = {
    fundoBase: '#f9fafb', // Fundo alterado para neutro
    fundoCard: '#ffffff',
    primaria: '#db2777',
    primariaHover: '#be185d',
    textoPrincipal: '#1f2937',
    textoSecundario: '#6b7280',
    borda: '#f3f4f6' // Borda alterada para neutro
  }

  const categoriasUnicas = ['Todos', ...new Set(produtos.map(p => p.categoria || 'Sem Categoria'))]

  const produtosFiltrados = produtos.filter(p => {
    const nomeSeguro = p.nome || ''
    const categoriaSegura = p.categoria || 'Sem Categoria'
    
    const batePesquisa = nomeSeguro.toLowerCase().includes(pesquisa.toLowerCase())
    const bateCategoria = categoriaAtiva === 'Todos' || categoriaSegura === categoriaAtiva
    
    return batePesquisa && bateCategoria
  })

  const pegarPrimeiraFoto = (produto) => {
    if (!produto) return null
    if (Array.isArray(produto.fotos) && produto.fotos.length > 0) return produto.fotos[0]
    if (typeof produto.fotos === 'string' && produto.fotos.length > 0) return produto.fotos
    if (typeof produto.imagem === 'string' && produto.imagem.length > 0) return produto.imagem
    return null
  }

  const handleComprarWhatsApp = (produto) => {
    if (!produto || Number(produto.quantidade) <= 0) return;

    const numeroWhatsApp = "5584996346780" 
    const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(produto.preco) || 0)
    const mensagem = `Olá! Tenho interesse no produto: *${produto.nome}* (${precoFormatado}). Gostaria de saber mais informações para realizar a compra.`
    
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`
    window.open(url, '_blank')
  }

  const extrairFotosSeguras = (produto) => {
    if (!produto) return []
    if (Array.isArray(produto.fotos) && produto.fotos.length > 0) return produto.fotos
    if (typeof produto.fotos === 'string' && produto.fotos.length > 0) return [produto.fotos]
    if (typeof produto.imagem === 'string' && produto.imagem.length > 0) return [produto.imagem]
    return []
  }

  const fotosParaVisualizador = extrairFotosSeguras(produtoSelecionado)

  const proximaFoto = () => {
    setFotoExpandidaIndex(prev => prev === fotosParaVisualizador.length - 1 ? 0 : prev + 1)
  }

  const fotoAnterior = () => {
    setFotoExpandidaIndex(prev => prev === 0 ? fotosParaVisualizador.length - 1 : prev - 1)
  }

  const handleTouchStart = (e) => {
    if (e.targetTouches && e.targetTouches.length > 0) {
      setTouchStart(e.targetTouches[0].clientX)
    }
  }

  const handleTouchMove = (e) => {
    if (e.targetTouches && e.targetTouches.length > 0) {
      setTouchEnd(e.targetTouches[0].clientX)
    }
  }

  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return
    const distancia = touchStart - touchEnd
    const limiteDeslize = 50

    if (distancia > limiteDeslize) proximaFoto()
    if (distancia < -limiteDeslize) fotoAnterior()
    
    setTouchStart(null)
    setTouchEnd(null)
  }

  if (carregando) {
    return (
      <div style={{ minHeight: '100vh', background: tema.fundoBase, display: 'flex', justifyContent: 'center', alignItems: 'center', color: tema.primaria, fontWeight: 'bold', fontFamily: "'Inter', sans-serif" }}>
        Preparando a vitrine...
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: tema.fundoBase, color: tema.textoPrincipal, fontFamily: "'Inter', sans-serif", paddingBottom: '60px' }}>
      
      {modalInfoAberta && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', zIndex: 5000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setModalInfoAberta(false)}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '32px 24px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setModalInfoAberta(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: tema.primaria }}>
              <X size={20} />
            </button>
            
            <h2 style={{ margin: 0, color: tema.textoPrincipal, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
              <Info size={24} color={tema.primaria} /> Informações
            </h2>
            
            <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '13px', color: tema.textoSecundario, margin: '0 0 8px 0', textTransform: 'uppercase', fontWeight: 'bold' }}>Endereço da Loja</h3>
              <p style={{ margin: 0, fontSize: '15px', color: tema.textoPrincipal, lineHeight: '1.5' }}>
                Rua Exemplo, 123, Bairro Centro<br/>Natal, RN
              </p>
            </div>
          </div>
        </div>
      )}

      {fotoExpandidaIndex !== null && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.95)', zIndex: 6000, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <button onClick={() => setFotoExpandidaIndex(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 6010 }}>
            <X size={24} />
          </button>

          <img 
            src={fotosParaVisualizador[fotoExpandidaIndex]} 
            alt="Ampliada" 
            style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} 
          />

          {fotosParaVisualizador.length > 1 && (
            <div style={{ position: 'absolute', width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 20px', boxSizing: 'border-box', pointerEvents: 'none' }}>
              <button 
                onClick={(e) => { e.stopPropagation(); fotoAnterior(); }}
                style={{ background: 'rgba(255,255,255,0.8)', color: 'black', border: 'none', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', pointerEvents: 'auto', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
              >
                <ChevronLeft size={32} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); proximaFoto(); }}
                style={{ background: 'rgba(255,255,255,0.8)', color: 'black', border: 'none', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', pointerEvents: 'auto', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
              >
                <ChevronRight size={32} />
              </button>
            </div>
          )}

          <div style={{ position: 'absolute', bottom: '40px', color: 'black', fontSize: '14px', fontWeight: 'bold', background: 'rgba(255,255,255,0.9)', padding: '8px 16px', borderRadius: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
            {fotoExpandidaIndex + 1} de {fotosParaVisualizador.length}
          </div>
        </div>
      )}

      {produtoSelecionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 4000, padding: '20px' }} onClick={() => setProdutoSelecionado(null)}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #f3f4f6' }} onClick={(e) => e.stopPropagation()}>
            
            <button onClick={() => setProdutoSelecionado(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.9)', color: tema.textoPrincipal, border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <X size={20} />
            </button>
            
            <div style={{ width: '100%', height: '360px', display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', background: '#f9fafb', scrollbarWidth: 'none', position: 'relative' }}>
              {(() => {
                if (fotosParaVisualizador.length === 0) {
                  return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ImageIcon size={50} color="#d1d5db" /></div>
                }
                return fotosParaVisualizador.map((foto, idx) => (
                  <div key={idx} style={{ width: '100%', height: '100%', flexShrink: 0, scrollSnapAlign: 'start', position: 'relative', cursor: 'zoom-in' }} onClick={() => setFotoExpandidaIndex(idx)}>
                    <img src={foto} alt={`Foto ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    <div style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'rgba(0,0,0,0.4)', color: 'white', borderRadius: '50%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                      <Maximize2 size={18} />
                    </div>
                  </div>
                ))
              })()}
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: tema.primaria, textTransform: 'uppercase', letterSpacing: '1px', background: '#fce7f3', padding: '4px 10px', borderRadius: '12px' }}>
                  {produtoSelecionado.categoria || 'Sem Categoria'}
                </span>
                <h2 style={{ fontSize: '24px', color: tema.textoPrincipal, margin: '12px 0 0 0', fontWeight: '900', lineHeight: '1.2' }}>{produtoSelecionado.nome}</h2>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', padding: '16px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {Number(produtoSelecionado.precoAntigo) > Number(produtoSelecionado.preco) && (
                    <span style={{ fontSize: '15px', color: '#9ca3af', textDecoration: 'line-through', fontWeight: '600', marginBottom: '2px' }}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(produtoSelecionado.precoAntigo))}
                    </span>
                  )}
                  <span style={{ fontSize: '28px', color: tema.primaria, fontWeight: '900' }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(produtoSelecionado.preco) || 0)}
                  </span>
                </div>
                {Number(produtoSelecionado.quantidade) <= 0 && (
                  <span style={{ background: '#fee2e2', color: '#dc2626', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>Esgotado</span>
                )}
              </div>

              <div>
                <h4 style={{ fontSize: '15px', color: tema.textoPrincipal, fontWeight: 'bold', margin: '0 0 8px 0' }}>Detalhes do Produto</h4>
                <p style={{ fontSize: '15px', color: tema.textoSecundario, margin: 0, lineHeight: '1.6' }}>
                  {produtoSelecionado.descricao || 'Nenhuma descrição detalhada disponível.'}
                </p>
              </div>

              <div style={{ paddingTop: '8px' }}>
                {Number(produtoSelecionado.quantidade) > 0 ? (
                  <button 
                    onClick={() => handleComprarWhatsApp(produtoSelecionado)}
                    style={{ width: '100%', background: tema.primaria, color: 'white', border: 'none', padding: '18px', borderRadius: '16px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 15px rgba(219, 39, 119, 0.25)', transition: 'transform 0.1s' }}
                  >
                    <MessageCircle size={22} /> Quero Comprar
                  </button>
                ) : (
                  <button 
                    disabled
                    style={{ width: '100%', background: '#f3f4f6', color: '#9ca3af', border: 'none', padding: '18px', borderRadius: '16px', fontSize: '16px', fontWeight: 'bold', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    Produto Indisponível
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <header style={{ background: '#ffffff', padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '700px', marginBottom: '24px' }}>
          <button onClick={() => setModalInfoAberta(true)} style={{ background: '#f9fafb', border: 'none', borderRadius: '14px', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: tema.textoPrincipal }}>
            <Info size={22} />
          </button>

          <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0, color: tema.textoPrincipal, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag color={tema.primaria} size={32} /> {nomeLoja}
          </h1>

          <div style={{ width: '44px', height: '44px' }}></div>
        </div>
        
        <div style={{ position: 'relative', width: '100%', maxWidth: '700px' }}>
          <input 
            type="text" 
            placeholder="Encontre o que você procura..." 
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            style={{ width: '100%', padding: '16px 16px 16px 50px', borderRadius: '16px', border: '1px solid #f3f4f6', outline: 'none', fontSize: '15px', background: '#fff', color: tema.textoPrincipal, boxSizing: 'border-box', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}
          />
          <Search size={20} color={tema.primaria} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </header>

      <main style={{ padding: '30px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', paddingBottom: '16px', marginBottom: '24px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingLeft: '4px', paddingRight: '20px' }}>
          {categoriasUnicas.map(cat => (
            <button 
              key={cat}
              onClick={() => setCategoriaAtiva(cat)}
              style={{ 
                padding: '10px 24px', 
                borderRadius: '16px', 
                whiteSpace: 'nowrap',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                border: categoriaAtiva === cat ? 'none' : '1px solid #f3f4f6',
                background: categoriaAtiva === cat ? tema.primaria : '#ffffff',
                color: categoriaAtiva === cat ? '#ffffff' : tema.textoPrincipal,
                boxShadow: categoriaAtiva === cat ? '0 4px 10px rgba(219, 39, 119, 0.2)' : '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '24px' }}>
          {produtosFiltrados.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: tema.textoSecundario, background: 'white', borderRadius: '24px', border: '1px dashed #e5e7eb' }}>Nenhum produto encontrado.</div>
          ) : (
            produtosFiltrados.map(p => {
              const fotoPrincipal = pegarPrimeiraFoto(p);
              const esgotado = Number(p.quantidade) <= 0;

              return (
                <div 
                  key={p.id} 
                  style={{ background: tema.fundoCard, borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid #f3f4f6', boxShadow: '0 10px 20px rgba(0,0,0,0.03)', transition: 'transform 0.2s ease', cursor: 'pointer' }}
                  onClick={() => setProdutoSelecionado(p)}
                >
                  <div style={{ height: '180px', width: '100%', background: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', padding: '10px', boxSizing: 'border-box' }}>
                    {fotoPrincipal ? (
                      <img src={fotoPrincipal} alt={p.nome} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <ImageIcon size={40} color="#e5e7eb" />
                    )}
                    {esgotado && (
                      <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(220, 38, 38, 0.9)', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '6px 10px', borderRadius: '8px', textTransform: 'uppercase', backdropFilter: 'blur(4px)' }}>Esgotado</div>
                    )}
                  </div>

                  <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', textAlign: 'center', background: '#f9fafb' }}>
                    <h4 style={{ fontSize: '14px', color: tema.textoPrincipal, fontWeight: '700', margin: '0 0 10px 0', lineHeight: '1.4', flexGrow: 1 }}>{p.nome}</h4>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                      {Number(p.precoAntigo) > Number(p.preco) && (
                        <span style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'line-through', fontWeight: '600' }}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p.precoAntigo))}
                        </span>
                      )}
                      <span style={{ fontSize: '18px', fontWeight: '900', color: tema.primaria }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p.preco) || 0)}
                      </span>
                    </div>
                    
                    {esgotado ? (
                      <button 
                        disabled
                        style={{ width: '100%', background: '#f3f4f6', color: '#9ca3af', border: 'none', padding: '12px', borderRadius: '14px', fontSize: '13px', fontWeight: 'bold', cursor: 'not-allowed', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Esgotado
                      </button>
                    ) : (
                      <button 
                        style={{ width: '100%', background: tema.primaria, color: 'white', border: 'none', padding: '12px', borderRadius: '14px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 4px 10px rgba(219, 39, 119, 0.2)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setProdutoSelecionado(p);
                        }}
                      >
                        Ver Detalhes
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

      </main>
    </div>
  )
}