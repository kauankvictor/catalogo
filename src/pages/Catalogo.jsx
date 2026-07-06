import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { Search, ShoppingBag, X, MessageCircle, Image as ImageIcon, ChevronLeft, ChevronRight, Maximize2, Info, MapPin, Menu } from 'lucide-react'

export default function Catalogo() {
  const [produtos, setProdutos] = useState([])
  const [nomeLoja, setNomeLoja] = useState('Paulinha Variedades')
  const [carregando, setCarregando] = useState(true)
  const [pesquisa, setPesquisa] = useState('')
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas as Categorias')
  
  const [produtoSelecionado, setProdutoSelecionado] = useState(null)
  const [fotoExpandidaIndex, setFotoExpandidaIndex] = useState(null)
  const [modalInfoAberta, setModalInfoAberta] = useState(false)
  const [menuLateralAberto, setMenuLateralAberto] = useState(false)

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)

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
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const tema = {
    fundoBase: '#ffffff',
    fundoCard: '#ffffff',
    primaria: '#f472b6', 
    primariaHover: '#ec4899',
    textoPrincipal: '#1f2937',
    textoSecundario: '#6b7280',
    borda: '#e5e7eb'
  }

  const categoriasUnicas = ['Todas as Categorias', ...new Set(produtos.map(p => p.categoria || 'Sem Categoria'))]

  const produtosFiltrados = produtos.filter(p => {
    const nomeSeguro = p.nome || ''
    const categoriaSegura = p.categoria || 'Sem Categoria'
    
    const batePesquisa = nomeSeguro.toLowerCase().includes(pesquisa.toLowerCase())
    const bateCategoria = categoriaAtiva === 'Todas as Categorias' || categoriaSegura === categoriaAtiva
    
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
    
    const textoCodigo = produto.codigoBarras ? ` (Cód: ${produto.codigoBarras})` : ''
    const mensagem = `Olá! Tenho interesse no produto: *${produto.nome}*${textoCodigo} por ${precoFormatado}. Gostaria de saber mais informações para realizar a compra.`
    
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
        Carregando a vitrine...
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: tema.fundoBase, color: tema.textoPrincipal, fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column' }}>
      
      {modalInfoAberta && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 5000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setModalInfoAberta(false)}>
          <div style={{ background: 'white', padding: '32px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', borderRadius: '0' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setModalInfoAberta(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: tema.textoPrincipal }}>
              <X size={24} />
            </button>
            
            <h2 style={{ margin: 0, color: tema.textoPrincipal, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Informações
            </h2>
            
            <div style={{ border: `1px solid ${tema.borda}`, padding: '16px' }}>
              <h3 style={{ fontSize: '13px', color: tema.primaria, margin: '0 0 8px 0', textTransform: 'uppercase', fontWeight: 'bold' }}>Endereço da Loja</h3>
              <p style={{ margin: 0, fontSize: '15px', color: tema.textoPrincipal, lineHeight: '1.5' }}>
                Rua Exemplo, 123, Bairro Centro<br/>Natal, RN
              </p>
            </div>
            
            <div style={{ width: '100%', height: '160px', background: '#f9fafb', display: 'flex', justifyContent: 'center', alignItems: 'center', color: tema.textoSecundario, border: `1px dashed ${tema.borda}`, textAlign: 'center', padding: '16px', boxSizing: 'border-box' }}>
              Espaço reservado para o<br/>mapa da loja
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
          <button onClick={() => setFotoExpandidaIndex(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', color: 'white', border: '1px solid white', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 6010 }}>
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
                style={{ background: 'white', color: 'black', border: 'none', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', pointerEvents: 'auto' }}
              >
                <ChevronLeft size={32} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); proximaFoto(); }}
                style={{ background: 'white', color: 'black', border: 'none', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', pointerEvents: 'auto' }}
              >
                <ChevronRight size={32} />
              </button>
            </div>
          )}

          <div style={{ position: 'absolute', bottom: '40px', color: 'black', fontSize: '14px', fontWeight: 'bold', background: 'white', padding: '8px 16px' }}>
            {fotoExpandidaIndex + 1} / {fotosParaVisualizador.length}
          </div>
        </div>
      )}

      {produtoSelecionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 4000, padding: isMobile ? '10px' : '20px' }} onClick={() => setProdutoSelecionado(null)}>
          <div style={{ background: 'white', width: '100%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', position: 'relative', borderRadius: '0' }} onClick={(e) => e.stopPropagation()}>
            
            <button onClick={() => setProdutoSelecionado(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'white', color: tema.textoPrincipal, border: `1px solid ${tema.borda}`, width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
              <X size={20} />
            </button>
            
            <div style={{ width: '100%', height: '360px', display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', background: '#f9fafb', scrollbarWidth: 'none', position: 'relative', borderBottom: `1px solid ${tema.borda}` }}>
              {(() => {
                if (fotosParaVisualizador.length === 0) {
                  return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ImageIcon size={50} color="#d1d5db" /></div>
                }
                return fotosParaVisualizador.map((foto, idx) => (
                  <div key={idx} style={{ width: '100%', height: '100%', flexShrink: 0, scrollSnapAlign: 'start', position: 'relative', cursor: 'zoom-in' }} onClick={() => setFotoExpandidaIndex(idx)}>
                    <img src={foto} alt={`Foto ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    <div style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'white', color: 'black', border: `1px solid ${tema.borda}`, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Maximize2 size={16} />
                    </div>
                  </div>
                ))
              })()}
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: tema.textoSecundario, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {produtoSelecionado.categoria || 'Sem Categoria'}
                </span>
                <h2 style={{ fontSize: '24px', color: tema.textoPrincipal, margin: '8px 0 0 0', fontWeight: 'bold', lineHeight: '1.2' }}>{produtoSelecionado.nome}</h2>
                {produtoSelecionado.codigoBarras && (
                  <span style={{ fontSize: '12px', color: tema.textoSecundario, marginTop: '4px', display: 'block' }}>Cód: {produtoSelecionado.codigoBarras}</span>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${tema.borda}`, borderBottom: `1px solid ${tema.borda}`, padding: '16px 0' }}>
                <span style={{ fontSize: '26px', color: tema.primaria, fontWeight: 'bold' }}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(produtoSelecionado.preco) || 0)}
                </span>
                {Number(produtoSelecionado.quantidade) <= 0 && (
                  <span style={{ border: '1px solid #dc2626', color: '#dc2626', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Esgotado</span>
                )}
              </div>

              <div>
                <h4 style={{ fontSize: '13px', color: tema.textoPrincipal, fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase' }}>Detalhes do Produto</h4>
                <p style={{ fontSize: '14px', color: tema.textoSecundario, margin: 0, lineHeight: '1.6' }}>
                  {produtoSelecionado.descricao || 'Nenhuma descrição detalhada disponível.'}
                </p>
              </div>

              <div style={{ paddingTop: '8px' }}>
                {Number(produtoSelecionado.quantidade) > 0 ? (
                  <button 
                    onClick={() => handleComprarWhatsApp(produtoSelecionado)}
                    style={{ width: '100%', background: tema.primaria, color: 'white', border: 'none', padding: '16px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textTransform: 'uppercase' }}
                  >
                    <MessageCircle size={20} /> Comprar no WhatsApp
                  </button>
                ) : (
                  <button 
                    disabled
                    style={{ width: '100%', background: '#f3f4f6', color: '#9ca3af', border: 'none', padding: '16px', fontSize: '14px', fontWeight: 'bold', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textTransform: 'uppercase' }}
                  >
                    Produto Indisponível
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <header style={{ background: tema.primaria, padding: isMobile ? '16px' : '20px 40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {isMobile && (
              <button onClick={() => setMenuLateralAberto(true)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}>
                <Menu size={28} />
              </button>
            )}
            <h1 style={{ fontSize: isMobile ? '20px' : '26px', fontWeight: 'bold', margin: 0, color: 'white', letterSpacing: '1px' }}>
              {nomeLoja}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button onClick={() => setModalInfoAberta(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'white', display: 'flex' }}>
              <Info size={24} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', color: 'white', gap: '8px', fontWeight: 'bold' }}>
              <ShoppingBag size={24} />
              {!isMobile && <span>Carrinho</span>}
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
          <input 
            type="text" 
            placeholder="O que você procura?" 
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            style={{ width: '100%', padding: '14px 16px 14px 46px', border: 'none', borderRadius: '0', outline: 'none', fontSize: '15px', background: 'white', color: tema.textoPrincipal, boxSizing: 'border-box' }}
          />
          <Search size={20} color={tema.textoSecundario} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, position: 'relative', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        
        {isMobile && menuLateralAberto && (
          <div onClick={() => setMenuLateralAberto(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000 }}></div>
        )}

        <aside style={{ 
          position: isMobile ? 'fixed' : 'static', 
          top: 0, left: 0, bottom: 0, 
          width: '260px', 
          background: 'white', 
          zIndex: 3010, 
          transform: isMobile && !menuLateralAberto ? 'translateX(-100%)' : 'translateX(0)', 
          transition: 'transform 0.3s ease', 
          borderRight: `1px solid ${tema.borda}`, 
          padding: '24px', 
          boxSizing: 'border-box', 
          overflowY: 'auto' 
        }}>
          {isMobile && (
            <button onClick={() => setMenuLateralAberto(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: tema.textoPrincipal }}>
              <X size={24} />
            </button>
          )}

          <h3 style={{ fontSize: '16px', color: tema.primaria, marginBottom: '24px', fontWeight: 'bold' }}>
            Todas as Categorias
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categoriasUnicas.map(cat => (
              <button 
                key={cat}
                onClick={() => {
                  setCategoriaAtiva(cat)
                  if (isMobile) setMenuLateralAberto(false)
                }}
                style={{ 
                  textAlign: 'left',
                  padding: '8px 0',
                  fontSize: '14px',
                  background: 'transparent',
                  border: 'none',
                  borderLeft: categoriaAtiva === cat ? `3px solid ${tema.primaria}` : '3px solid transparent',
                  paddingLeft: '12px',
                  color: categoriaAtiva === cat ? tema.textoPrincipal : tema.textoSecundario,
                  fontWeight: categoriaAtiva === cat ? 'bold' : 'normal',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </aside>

        <main style={{ flex: 1, padding: isMobile ? '20px' : '32px', width: '100%', boxSizing: 'border-box' }}>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
             <span style={{ fontSize: '14px', color: tema.textoSecundario }}>Exibindo {produtosFiltrados.length} produtos</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
            {produtosFiltrados.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: tema.textoSecundario, border: `1px solid ${tema.borda}` }}>Nenhum produto encontrado.</div>
            ) : (
              produtosFiltrados.map(p => {
                const fotoPrincipal = pegarPrimeiraFoto(p);
                const esgotado = Number(p.quantidade) <= 0;

                return (
                  <div 
                    key={p.id} 
                    style={{ background: tema.fundoCard, display: 'flex', flexDirection: 'column', border: `1px solid ${tema.borda}`, cursor: 'pointer', borderRadius: '0' }}
                    onClick={() => setProdutoSelecionado(p)}
                  >
                    <div style={{ height: '240px', width: '100%', background: '#f9fafb', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${tema.borda}` }}>
                      {fotoPrincipal ? (
                        <img src={fotoPrincipal} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <ImageIcon size={40} color="#d1d5db" />
                      )}
                      {esgotado && (
                        <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#dc2626', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '4px 8px', textTransform: 'uppercase' }}>Esgotado</div>
                      )}
                    </div>

                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h4 style={{ fontSize: '14px', color: tema.textoPrincipal, fontWeight: 'normal', margin: '0 0 8px 0', lineHeight: '1.4', flexGrow: 1 }}>{p.nome}</h4>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: tema.primaria, marginBottom: '16px' }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p.preco) || 0)}
                      </span>
                      
                      {esgotado ? (
                        <button 
                          disabled
                          style={{ width: '100%', background: '#f3f4f6', color: '#9ca3af', border: `1px solid ${tema.borda}`, padding: '10px', fontSize: '13px', fontWeight: 'bold', cursor: 'not-allowed', textTransform: 'uppercase' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Esgotado
                        </button>
                      ) : (
                        <button 
                          style={{ width: '100%', background: 'white', color: tema.textoPrincipal, border: `1px solid ${tema.textoPrincipal}`, padding: '10px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', transition: 'background 0.2s' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setProdutoSelecionado(p);
                          }}
                          onMouseEnter={(e) => { e.target.style.background = tema.textoPrincipal; e.target.style.color = 'white'; }}
                          onMouseLeave={(e) => { e.target.style.background = 'white'; e.target.style.color = tema.textoPrincipal; }}
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
    </div>
  )
}