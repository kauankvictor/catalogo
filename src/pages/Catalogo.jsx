import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { Search, ShoppingBag, X, MessageCircle, Image as ImageIcon, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'

export default function Catalogo() {
  const [produtos, setProdutos] = useState([])
  const [nomeLoja, setNomeLoja] = useState('Storefy')
  const [carregando, setCarregando] = useState(true)
  const [pesquisa, setPesquisa] = useState('')
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos')
  
  const [produtoSelecionado, setProdutoSelecionado] = useState(null)
  const [fotoExpandidaIndex, setFotoExpandidaIndex] = useState(null) // Controle da foto em tela cheia

  useEffect(() => {
    const carregarInformacoes = async () => {
      try {
        const queryProdutos = await getDocs(collection(db, "produtos"))
        const produtosDoBanco = queryProdutos.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setProdutos(produtosDoBanco)

        const dadosLojaSalvos = JSON.parse(localStorage.getItem('storefy_dados_loja')) || {}
        if (dadosLojaSalvos.nomeLoja) setNomeLoja(dadosLojaSalvos.nomeLoja)

      } catch (error) {
        console.error("Erro ao carregar o catálogo de produtos:", error)
      } finally {
        setCarregando(false)
      }
    }

    carregarInformacoes()
  }, [])

  const tema = {
    fundoBase: '#f9fafb',
    fundoCard: '#ffffff',
    primaria: '#db2777',
    primariaHover: '#be185d',
    textoPrincipal: '#111827',
    textoSecundario: '#6b7280'
  }

  const categoriasUnicas = ['Todos', ...new Set(produtos.map(p => p.categoria).filter(Boolean))]

  const produtosFiltrados = produtos.filter(p => {
    const batePesquisa = p.nome.toLowerCase().includes(pesquisa.toLowerCase())
    const bateCategoria = categoriaAtiva === 'Todos' || p.categoria === categoriaAtiva
    return batePesquisa && bateCategoria
  })

  const pegarPrimeiraFoto = (produto) => {
    if (produto.fotos && produto.fotos.length > 0) return produto.fotos[0]
    if (produto.imagem) return produto.imagem
    return null
  }

  const handleComprarWhatsApp = (produto) => {
    if (Number(produto.quantidade) <= 0) return;

    const numeroWhatsApp = "5584996346780" 
    const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco || 0)
    const mensagem = `Olá! Tenho interesse no produto: *${produto.nome}* (${precoFormatado}). Gostaria de saber mais informações para realizar a compra.`
    
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`
    window.open(url, '_blank')
  }

  // Define qual lista de fotos o visualizador em tela cheia vai usar
  const fotosParaVisualizador = produtoSelecionado 
    ? (produtoSelecionado.fotos && produtoSelecionado.fotos.length > 0 ? produtoSelecionado.fotos : (produtoSelecionado.imagem ? [produtoSelecionado.imagem] : []))
    : []

  if (carregando) {
    return (
      <div style={{ minHeight: '100vh', background: tema.fundoBase, display: 'flex', justifyContent: 'center', alignItems: 'center', color: tema.primaria, fontWeight: 'bold', fontFamily: "'Inter', sans-serif" }}>
        Carregando a vitrine...
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: tema.fundoBase, color: tema.textoPrincipal, fontFamily: "'Inter', sans-serif", paddingBottom: '40px' }}>
      
      {/* VISUALIZADOR DE FOTOS EM TELA CHEIA */}
      {fotoExpandidaIndex !== null && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.95)', zIndex: 6000, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
          
          <button onClick={() => setFotoExpandidaIndex(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 6010 }}>
            <X size={24} />
          </button>

          <img 
            src={fotosParaVisualizador[fotoExpandidaIndex]} 
            alt="Ampliada" 
            style={{ maxWidth: '95%', maxHeight: '85vh', objectFit: 'contain' }} 
          />

          {fotosParaVisualizador.length > 1 && (
            <div style={{ position: 'absolute', width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 20px', boxSizing: 'border-box' }}>
              <button 
                onClick={() => setFotoExpandidaIndex(prev => prev === 0 ? fotosParaVisualizador.length - 1 : prev - 1)}
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <ChevronLeft size={32} />
              </button>
              <button 
                onClick={() => setFotoExpandidaIndex(prev => prev === fotosParaVisualizador.length - 1 ? 0 : prev + 1)}
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <ChevronRight size={32} />
              </button>
            </div>
          )}

          <div style={{ position: 'absolute', bottom: '30px', color: 'white', fontSize: '14px', background: 'rgba(0,0,0,0.5)', padding: '6px 12px', borderRadius: '16px' }}>
            {fotoExpandidaIndex + 1} de {fotosParaVisualizador.length}
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES DO PRODUTO */}
      {produtoSelecionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 4000, padding: window.innerWidth > 768 ? '20px' : '0' }} onClick={() => setProdutoSelecionado(null)}>
          <div style={{ background: 'white', borderRadius: window.innerWidth > 768 ? '20px' : '20px 20px 0 0', width: '100%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 -10px 25px rgba(0,0,0,0.1)' }} onClick={(e) => e.stopPropagation()}>
            
            <button onClick={() => setProdutoSelecionado(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.9)', color: '#111827', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <X size={20} />
            </button>
            
            <div style={{ width: '100%', height: '380px', display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', background: '#f9fafb', scrollbarWidth: 'none', position: 'relative' }}>
              {(() => {
                if (fotosParaVisualizador.length === 0) {
                  return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ImageIcon size={48} color="#d1d5db" /></div>
                }
                return fotosParaVisualizador.map((foto, idx) => (
                  <div key={idx} style={{ width: '100%', height: '100%', flexShrink: 0, scrollSnapAlign: 'start', position: 'relative', cursor: 'pointer' }} onClick={() => setFotoExpandidaIndex(idx)}>
                    <img src={foto} alt={`Foto ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Maximize2 size={16} />
                    </div>
                  </div>
                ))
              })()}
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: tema.primaria, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{produtoSelecionado.categoria}</span>
                <h2 style={{ fontSize: '22px', color: tema.textoPrincipal, margin: '4px 0 0 0', fontWeight: '800', lineHeight: '1.2' }}>{produtoSelecionado.nome}</h2>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '28px', color: tema.textoPrincipal, fontWeight: '900' }}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produtoSelecionado.preco || 0)}
                </span>
                {Number(produtoSelecionado.quantidade) <= 0 && (
                  <span style={{ background: '#fee2e2', color: '#dc2626', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>Esgotado</span>
                )}
              </div>

              <div>
                <h4 style={{ fontSize: '14px', color: tema.textoPrincipal, fontWeight: 'bold', margin: '16px 0 8px 0' }}>Descrição do Produto</h4>
                <p style={{ fontSize: '15px', color: tema.textoSecundario, margin: 0, lineHeight: '1.6' }}>
                  {produtoSelecionado.descricao || 'Nenhuma descrição detalhada disponível para este produto.'}
                </p>
              </div>

              <div style={{ paddingTop: '16px' }}>
                {Number(produtoSelecionado.quantidade) > 0 ? (
                  <button 
                    onClick={() => handleComprarWhatsApp(produtoSelecionado)}
                    style={{ width: '100%', background: tema.primaria, color: 'white', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(219, 39, 119, 0.2)' }}
                  >
                    <MessageCircle size={20} /> Comprar no WhatsApp
                  </button>
                ) : (
                  <button 
                    disabled
                    style={{ width: '100%', background: '#f3f4f6', color: '#9ca3af', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    Produto Indisponível
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <header style={{ background: '#ffffff', padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '900', margin: '0 0 20px 0', color: tema.textoPrincipal, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShoppingBag color={tema.primaria} size={30} /> {nomeLoja}
        </h1>
        
        <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
          <input 
            type="text" 
            placeholder="O que você está procurando?" 
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            style={{ width: '100%', padding: '14px 16px 14px 46px', borderRadius: '30px', border: 'none', outline: 'none', fontSize: '15px', background: '#f3f4f6', color: tema.textoPrincipal, boxSizing: 'border-box' }}
          />
          <Search size={20} color={tema.textoSecundario} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </header>

      <main style={{ padding: '24px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', overflowX: 'auto', gap: '12px', paddingBottom: '16px', marginBottom: '24px', scrollbarWidth: 'none' }}>
          {categoriasUnicas.map(cat => (
            <button 
              key={cat}
              onClick={() => setCategoriaAtiva(cat)}
              style={{ 
                padding: '10px 20px', 
                borderRadius: '30px', 
                whiteSpace: 'nowrap',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                border: 'none',
                background: categoriaAtiva === cat ? tema.primaria : '#ffffff',
                color: categoriaAtiva === cat ? '#ffffff' : tema.textoPrincipal,
                boxShadow: categoriaAtiva === cat ? '0 4px 6px rgba(219, 39, 119, 0.2)' : '0 2px 4px rgba(0,0,0,0.03)',
                transition: 'all 0.2s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' }}>
          {produtosFiltrados.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: tema.textoSecundario }}>Nenhum produto encontrado.</div>
          ) : (
            produtosFiltrados.map(p => {
              const fotoPrincipal = pegarPrimeiraFoto(p);
              const esgotado = Number(p.quantidade) <= 0;

              return (
                <div 
                  key={p.id} 
                  style={{ background: tema.fundoCard, borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', transition: 'transform 0.2s', cursor: 'pointer' }}
                  onClick={() => setProdutoSelecionado(p)}
                >
                  <div style={{ height: '200px', width: '100%', background: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                    {fotoPrincipal ? (
                      <img src={fotoPrincipal} alt={p.nome} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <ImageIcon size={32} color="#d1d5db" />
                    )}
                    {esgotado && (
                      <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(220, 38, 38, 0.9)', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>Esgotado</div>
                    )}
                  </div>

                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', textAlign: 'center', background: '#fafafa' }}>
                    <h4 style={{ fontSize: '14px', color: tema.textoPrincipal, fontWeight: '700', margin: '0 0 8px 0', lineHeight: '1.3', flexGrow: 1 }}>{p.nome}</h4>
                    <span style={{ fontSize: '18px', fontWeight: '900', color: tema.textoPrincipal, marginBottom: '16px' }}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.preco || 0)}
                    </span>
                    
                    {esgotado ? (
                      <button 
                        disabled
                        style={{ width: '100%', background: '#e5e7eb', color: '#9ca3af', border: 'none', padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', cursor: 'not-allowed', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Esgotado
                      </button>
                    ) : (
                      <button 
                        style={{ width: '100%', background: '#111827', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setProdutoSelecionado(p);
                        }}
                      >
                        Comprar
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