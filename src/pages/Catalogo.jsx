import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebaseConfig'
import { Search, ShoppingBag, X, Image as ImageIcon, ChevronLeft, ChevronRight, Maximize2, Info, Star, ShoppingCart, Plus, Minus, Trash2, LayoutGrid } from 'lucide-react'

export default function Catalogo() {
  const [produtos, setProdutos] = useState([])
  const [nomeLoja, setNomeLoja] = useState('Paulinha variedades')
  const [carregando, setCarregando] = useState(true)
  const [pesquisa, setPesquisa] = useState('')
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos')
  const [eventoAtivo, setEventoAtivo] = useState('')
  
  const [produtoSelecionado, setProdutoSelecionado] = useState(null)
  const [fotoExpandidaIndex, setFotoExpandidaIndex] = useState(null)
  const [modalInfoAberta, setModalInfoAberta] = useState(false)
  const [modalCategoriasAberta, setModalCategoriasAberta] = useState(false)

  const [carrinho, setCarrinho] = useState([])
  const [carrinhoAberto, setCarrinhoAberto] = useState(false)

  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

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
    fundoBase: '#f9fafb',
    fundoCard: '#ffffff',
    primaria: '#db2777',
    primariaHover: '#be185d',
    textoPrincipal: '#1f2937',
    textoSecundario: '#6b7280',
    borda: '#f3f4f6'
  }

  const categoriasUnicas = ['Todos', ...new Set(produtos.map(p => p.categoria || 'Sem Categoria'))]

  const produtosFiltrados = produtos.filter(p => {
    const nomeSeguro = p.nome || ''
    const categorySegura = p.categoria || 'Sem Categoria'
    const batePesquisa = nomeSeguro.toLowerCase().includes(pesquisa.toLowerCase())
    const bateCategoria = categoriaAtiva === 'Todos' || categorySegura === categoriaAtiva
    return batePesquisa && bateCategoria && p.visivelCatalogo !== false
  })

  const produtosDestaqueGeral = produtos.filter(p => p.destaque === true && p.visivelCatalogo !== false)
  const eventosUnicos = [...new Set(produtosDestaqueGeral.map(p => p.nomeDestaque || 'Destaques'))]
  const eventoAtual = eventosUnicos.includes(eventoAtivo) ? eventoAtivo : eventosUnicos[0]
  const produtosVitrine = produtosDestaqueGeral.filter(p => (p.nomeDestaque || 'Destaques') === eventoAtual)
  const mostrarVitrine = pesquisa === '' && categoriaAtiva === 'Todos' && produtosDestaqueGeral.length > 0

  const pegarPrimeiraFoto = (produto) => {
    if (!produto) return null
    if (Array.isArray(produto.fotos) && produto.fotos.length > 0) return produto.fotos[0]
    if (typeof produto.fotos === 'string' && produto.fotos.length > 0) return produto.fotos
    if (typeof produto.imagem === 'string' && produto.imagem.length > 0) return produto.imagem
    return null
  }

  const adicionarAoCarrinho = (produto) => {
    setCarrinho(prev => {
      const existe = prev.find(item => item.id === produto.id)
      const estoqueDisponivel = Number(produto.quantidade) || 0

      if (existe) {
        if (existe.qnt >= estoqueDisponivel) {
          alert(`Temos apenas ${estoqueDisponivel} unidades de ${produto.nome} em estoque.`)
          return prev
        }
        return prev.map(item => item.id === produto.id ? { ...item, qnt: item.qnt + 1 } : item)
      }
      
      if (estoqueDisponivel > 0) {
        return [...prev, { ...produto, qnt: 1 }]
      }
      return prev
    })
    setProdutoSelecionado(null)
  }

  const alterarQuantidade = (id, delta) => {
    setCarrinho(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const novaQnt = item.qnt + delta
          const estoqueDisponivel = Number(item.quantidade) || 0
          
          if (novaQnt > estoqueDisponivel) {
            alert(`Estoque máximo atingido: ${estoqueDisponivel} unidades disponíveis.`)
            return item
          }
          return novaQnt > 0 ? { ...item, qnt: novaQnt } : item
        }
        return item
      })
    })
  }

  const removerDoCarrinho = (id) => {
    setCarrinho(prev => prev.filter(item => item.id !== id))
  }

  const valorTotalCarrinho = carrinho.reduce((acc, item) => acc + (Number(item.preco) * item.qnt), 0)
  const quantidadeTotalCarrinho = carrinho.reduce((acc, item) => acc + item.qnt, 0)

  const finalizarPedidoWhatsApp = () => {
    if (carrinho.length === 0) return
    const numeroWhatsApp = "5584996346780" 
    
    let mensagem = `Olá! Gostaria de fazer o seguinte pedido na *${nomeLoja}*:\n\n`
    carrinho.forEach(item => {
      const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.preco))
      const infoCodigo = item.codigoBarras ? ` [Cód: ${item.codigoBarras}]` : ''
      mensagem += `* ${item.qnt}x ${item.nome}${infoCodigo} (${precoFormatado})\n`
    })
    
    const totalFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotalCarrinho)
    mensagem += `\n*Valor Total: ${totalFormatado}*`
    
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

  const proximaFoto = () => setFotoExpandidaIndex(prev => prev === fotosParaVisualizador.length - 1 ? 0 : prev + 1)
  const fotoAnterior = () => setFotoExpandidaIndex(prev => prev === 0 ? fotosParaVisualizador.length - 1 : prev - 1)

  const handleTouchStart = (e) => {
    if (e.targetTouches && e.targetTouches.length > 0) setTouchStart(e.targetTouches[0].clientX)
  }
  const handleTouchMove = (e) => {
    if (e.targetTouches && e.targetTouches.length > 0) setTouchEnd(e.targetTouches[0].clientX)
  }
  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return
    const distancia = touchStart - touchEnd
    if (distancia > 50) proximaFoto()
    if (distancia < -50) fotoAnterior()
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
    <div style={{ minHeight: '100vh', background: tema.fundoBase, color: tema.textoPrincipal, fontFamily: "'Inter', sans-serif", paddingBottom: '100px' }}>
      
      <div 
        onClick={() => setCarrinhoAberto(true)}
        style={{ position: 'fixed', bottom: '24px', right: '24px', background: tema.primaria, color: 'white', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 25px rgba(219, 39, 119, 0.4)', zIndex: 3000 }}
      >
        <ShoppingCart size={28} />
        {quantidadeTotalCarrinho > 0 && (
          <div style={{ position: 'absolute', top: '0', right: '0', background: '#1e1b4b', color: 'white', fontSize: '13px', fontWeight: 'bold', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
            {quantidadeTotalCarrinho}
          </div>
        )}
      </div>

      {modalCategoriasAberta && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 5000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setModalCategoriasAberta(false)}>
          <div style={{ background: 'white', width: '100%', maxWidth: '600px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', maxHeight: '70vh', boxShadow: '0 -10px 25px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: tema.textoPrincipal, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LayoutGrid size={24} color={tema.primaria} /> Todas as Categorias
              </h2>
              <button onClick={() => setModalCategoriasAberta(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
              {categoriasUnicas.map(cat => (
                <button
                  key={`modal-${cat}`}
                  onClick={() => {
                    setCategoriaAtiva(cat)
                    setModalCategoriasAberta(false)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textAlign: 'left',
                    background: categoriaAtiva === cat ? '#fce7f3' : '#f9fafb',
                    color: categoriaAtiva === cat ? tema.primaria : tema.textoPrincipal,
                    border: categoriaAtiva === cat ? `2px solid ${tema.primaria}` : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  {cat}
                  {categoriaAtiva === cat && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tema.primaria }}></div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {carrinhoAberto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 5000, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setCarrinhoAberto(false)}>
          <div style={{ background: 'white', width: '100%', maxWidth: '400px', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 25px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: tema.textoPrincipal, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={24} color={tema.primaria} /> Meu Pedido
              </h2>
              <button onClick={() => setCarrinhoAberto(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {carrinho.length === 0 ? (
                <div style={{ textAlign: 'center', color: tema.textoSecundario, marginTop: '40px' }}>
                  <ShoppingBag size={48} color="#e5e7eb" style={{ margin: '0 auto 16px auto' }} />
                  <p>Seu carrinho está vazio.</p>
                </div>
              ) : (
                carrinho.map(item => {
                  const foto = pegarPrimeiraFoto(item)
                  return (
                    <div key={item.id} style={{ display: 'flex', gap: '16px', background: '#f9fafb', padding: '12px', borderRadius: '16px', alignItems: 'center' }}>
                      <div style={{ width: '60px', height: '60px', background: 'white', borderRadius: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                        {foto ? <img src={foto} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" /> : <ImageIcon size={20} color="#d1d5db" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: tema.textoPrincipal, fontWeight: '700', lineHeight: '1.2' }}>{item.nome}</h4>
                        <span style={{ fontSize: '15px', fontWeight: '900', color: tema.primaria }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.preco))}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <button onClick={() => removerDoCarrinho(item.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}><Trash2 size={18} /></button>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                          <button onClick={() => alterarQuantidade(item.id, -1)} style={{ background: 'transparent', border: 'none', padding: '4px 8px', cursor: 'pointer' }}><Minus size={14} /></button>
                          <span style={{ fontSize: '14px', fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{item.qnt}</span>
                          <button onClick={() => alterarQuantidade(item.id, 1)} style={{ background: 'transparent', border: 'none', padding: '4px 8px', cursor: 'pointer' }}><Plus size={14} /></button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {carrinho.length > 0 && (
              <div style={{ padding: '24px', background: 'white', borderTop: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '16px', color: tema.textoSecundario, fontWeight: 'bold' }}>Total Estimado:</span>
                  <span style={{ fontSize: '24px', color: tema.textoPrincipal, fontWeight: '900' }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotalCarrinho)}
                  </span>
                </div>
                <button 
                  onClick={finalizarPedidoWhatsApp}
                  style={{ width: '100%', background: '#10b981', color: 'white', border: 'none', padding: '18px', borderRadius: '16px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <ShoppingCart size={22} /> Enviar Pedido
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {modalInfoAberta && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', zIndex: 5000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setModalInfoAberta(false)}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '32px 24px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setModalInfoAberta(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: tema.primaria }}><X size={20} /></button>
            <h2 style={{ margin: 0, color: tema.textoPrincipal, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}><Info size={24} color={tema.primaria} /> Informações</h2>
            <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '13px', color: tema.textoSecundario, margin: '0 0 8px 0', textTransform: 'uppercase', fontWeight: 'bold' }}>Endereço da Loja</h3>
              <p style={{ margin: 0, fontSize: '15px', color: tema.textoPrincipal, lineHeight: '1.5' }}>Rua Exemplo, 123, Bairro Centro<br/>Natal, RN</p>
            </div>
          </div>
        </div>
      )}

      {fotoExpandidaIndex !== null && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.95)', zIndex: 6000, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
          <button onClick={() => setFotoExpandidaIndex(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 6010 }}><X size={24} /></button>
          <img src={fotosParaVisualizador[fotoExpandidaIndex]} alt="Ampliada" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
          {fotosParaVisualizador.length > 1 && (
            <div style={{ position: 'absolute', width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 20px', boxSizing: 'border-box', pointerEvents: 'none' }}>
              <button onClick={(e) => { e.stopPropagation(); fotoAnterior(); }} style={{ background: 'rgba(255,255,255,0.8)', color: 'black', border: 'none', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', pointerEvents: 'auto' }}><ChevronLeft size={32} /></button>
              <button onClick={(e) => { e.stopPropagation(); proximaFoto(); }} style={{ background: 'rgba(255,255,255,0.8)', color: 'black', border: 'none', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', pointerEvents: 'auto' }}><ChevronRight size={32} /></button>
            </div>
          )}
          <div style={{ position: 'absolute', bottom: '40px', color: 'black', fontSize: '14px', fontWeight: 'bold', background: 'rgba(255,255,255,0.9)', padding: '8px 16px', borderRadius: '20px' }}>
            {fotoExpandidaIndex + 1} de {fotosParaVisualizador.length}
          </div>
        </div>
      )}

      {produtoSelecionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 4000, padding: '20px' }} onClick={() => setProdutoSelecionado(null)}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', position: 'relative', border: '1px solid #f3f4f6' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setProdutoSelecionado(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.9)', color: tema.textoPrincipal, border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}><X size={20} /></button>
            <div style={{ width: '100%', height: '360px', display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', background: '#f9fafb', scrollbarWidth: 'none', position: 'relative' }}>
              {Number(produtoSelecionado.precoAntigo) > Number(produtoSelecionado.preco) && (
                <div style={{ position: 'absolute', top: '16px', left: '16px', background: '#ef4444', color: 'white', fontSize: '13px', fontWeight: 'bold', padding: '6px 10px', borderRadius: '8px', zIndex: 5 }}>
                  {Math.round(((Number(produtoSelecionado.precoAntigo) - Number(produtoSelecionado.preco)) / Number(produtoSelecionado.precoAntigo)) * 100)}% OFF
                </div>
              )}
              {(() => {
                if (fotosParaVisualizador.length === 0) return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ImageIcon size={50} color="#d1d5db" /></div>
                return fotosParaVisualizador.map((foto, idx) => (
                  <div key={idx} style={{ width: '100%', height: '100%', flexShrink: 0, scrollSnapAlign: 'start', position: 'relative', cursor: 'zoom-in' }} onClick={() => setFotoExpandidaIndex(idx)}>
                    <img src={foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    <div style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'rgba(0,0,0,0.4)', color: 'white', borderRadius: '50%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}><Maximize2 size={18} /></div>
                  </div>
                ))
              })()}
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: tema.primaria, textTransform: 'uppercase', letterSpacing: '1px', background: '#fce7f3', padding: '4px 10px', borderRadius: '12px' }}>{produtoSelecionado.categoria || 'Sem Categoria'}</span>
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
                {Number(produtoSelecionado.quantidade) <= 0 && <span style={{ background: '#fee2e2', color: '#dc2626', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>Esgotado</span>}
              </div>
              <div>
                <h4 style={{ fontSize: '15px', color: tema.textoPrincipal, fontWeight: 'bold', margin: '0 0 8px 0' }}>Detalhes do Produto</h4>
                <p style={{ fontSize: '15px', color: tema.textoSecundario, margin: 0, lineHeight: '1.6' }}>{produtoSelecionado.descricao || 'Nenhuma descrição detalhada disponível para este produto.'}</p>
              </div>
              <div style={{ paddingTop: '8px' }}>
                {Number(produtoSelecionado.quantidade) > 0 ? (
                  <button onClick={() => adicionarAoCarrinho(produtoSelecionado)} style={{ width: '100%', background: tema.primaria, color: 'white', border: 'none', padding: '18px', borderRadius: '16px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><ShoppingCart size={22} /> Adicionar ao Carrinho</button>
                ) : (
                  <button disabled style={{ width: '100%', background: '#f3f4f6', color: '#9ca3af', border: 'none', padding: '18px', borderRadius: '16px', fontSize: '16px', fontWeight: 'bold', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>Produto Indisponível</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <header style={{ background: '#ffffff', padding: isMobile ? '20px 16px' : '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', maxWidth: '700px', marginBottom: '24px', position: 'relative' }}>
          <button onClick={() => setModalInfoAberta(true)} style={{ position: 'absolute', left: 0, background: '#f9fafb', border: 'none', borderRadius: '14px', width: isMobile ? '40px' : '44px', height: isMobile ? '40px' : '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: tema.textoPrincipal }}><Info size={isMobile ? 20 : 22} /></button>
          <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '900', margin: 0, color: tema.textoPrincipal, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textAlign: 'center', lineHeight: '1.2' }}><ShoppingBag color={tema.primaria} size={isMobile ? 26 : 32} /> {nomeLoja}</h1>
        </div>
        <div style={{ position: 'relative', width: '100%', maxWidth: '700px' }}>
          <input type="text" placeholder="Encontre o que você procura..." value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} style={{ width: '100%', padding: '16px 16px 16px 50px', borderRadius: '16px', border: '1px solid #f3f4f6', outline: 'none', fontSize: '15px', background: '#fff', color: tema.textoPrincipal, boxSizing: 'border-box' }} />
          <Search size={20} color={tema.primaria} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </header>

      <main style={{ padding: isMobile ? '24px 0' : '30px 20px', maxWidth: '1200px', margin: '0 auto', overflow: 'hidden' }}>
        
        {mostrarVitrine && (
          <div style={{ marginBottom: '40px' }}>
            {eventosUnicos.length > 1 && (
              <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', paddingBottom: '16px', marginBottom: '8px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingLeft: isMobile ? '16px' : '0', paddingRight: isMobile ? '16px' : '0' }}>
                {eventosUnicos.map(ev => (
                  <button
                    key={ev}
                    onClick={() => setEventoAtivo(ev)}
                    style={{ padding: '8px 20px', borderRadius: '20px', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', border: eventoAtual === ev ? 'none' : `1px solid ${tema.primaria}`, background: eventoAtual === ev ? tema.primaria : '#ffffff', color: eventoAtual === ev ? '#ffffff' : tema.primaria, transition: 'all 0.2s ease', flexShrink: 0 }}
                  >
                    {ev}
                  </button>
                ))}
              </div>
            )}

            <h2 style={{ fontSize: '20px', fontWeight: '900', color: tema.textoPrincipal, margin: isMobile ? '0 0 16px 16px' : '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star size={24} color={tema.primaria} fill={tema.primaria} /> {eventoAtual}
            </h2>
            
            <div style={{ display: 'flex', overflowX: 'auto', gap: '16px', paddingBottom: '24px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingLeft: isMobile ? '16px' : '0', paddingRight: isMobile ? '16px' : '0' }}>
              {produtosVitrine.map(p => {
                const fotoPrincipal = pegarPrimeiraFoto(p);
                const esgotado = Number(p.quantidade) <= 0;
                const temDesconto = Number(p.precoAntigo) > Number(p.preco);

                return (
                  <div key={`destaque-${p.id}`} style={{ minWidth: '160px', maxWidth: '160px', background: tema.fundoCard, borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '2px solid #fce7f3', boxShadow: '0 8px 16px rgba(219, 39, 119, 0.08)', cursor: 'pointer', flexShrink: 0 }} onClick={() => setProdutoSelecionado(p)}>
                    
                    <div style={{ height: '150px', width: '100%', background: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', padding: '0', boxSizing: 'border-box', overflow: 'hidden' }}>
                      {temDesconto && <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '4px 6px', borderRadius: '6px', zIndex: 5 }}>{Math.round(((Number(p.precoAntigo) - Number(p.preco)) / Number(p.precoAntigo)) * 100)}%</div>}
                      {fotoPrincipal ? <img src={fotoPrincipal} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={30} color="#e5e7eb" />}
                      {esgotado && <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(220, 38, 38, 0.9)', color: 'white', fontSize: '9px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase', backdropFilter: 'blur(4px)' }}>Esgotado</div>}
                    </div>

                    <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', textAlign: 'center', background: '#f9fafb' }}>
                      <h4 style={{ fontSize: '13px', color: tema.textoPrincipal, fontWeight: '700', margin: '0 0 8px 0', lineHeight: '1.3', flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.nome}</h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '8px' }}>
                        {temDesconto && <span style={{ fontSize: '11px', color: '#9ca3af', textDecoration: 'line-through', fontWeight: '600' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p.precoAntigo))}</span>}
                        <span style={{ fontSize: '16px', fontWeight: '900', color: tema.primaria }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p.preco) || 0)}</span>
                      </div>

                      <span style={{ fontSize: '11px', color: esgotado ? '#dc2626' : '#6b7280', fontWeight: '600', marginBottom: '12px' }}>
                        {esgotado ? 'Item Esgotado' : `Estoque: ${p.quantidade} un`}
                      </span>

                      {esgotado ? (
                        <button disabled style={{ width: '100%', background: '#f3f4f6', color: '#9ca3af', border: 'none', padding: '10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', cursor: 'not-allowed', textTransform: 'uppercase' }} onClick={(e) => e.stopPropagation()}>Esgotado</button>
                      ) : (
                        <button style={{ width: '100%', background: tema.primaria, color: 'white', border: 'none', padding: '10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', boxShadow: '0 4px 10px rgba(219, 39, 119, 0.2)' }} onClick={(e) => { e.stopPropagation(); setProdutoSelecionado(p); }}>Ver Detalhes</button>
                      )}

                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: isMobile ? '0 16px' : '0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '900', color: tema.textoPrincipal, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LayoutGrid size={20} color={tema.primaria} /> Categorias
          </h2>
          {categoriasUnicas.length > 3 && (
            <button 
              onClick={() => setModalCategoriasAberta(true)} 
              style={{ background: 'transparent', border: 'none', color: tema.primaria, fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', padding: 0 }}
            >
              Ver todas
            </button>
          )}
        </div>

        <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', paddingBottom: '16px', marginBottom: '24px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingLeft: isMobile ? '16px' : '0', paddingRight: isMobile ? '16px' : '0' }}>
          {categoriasUnicas.map(cat => (
            <button key={cat} onClick={() => setCategoriaAtiva(cat)} style={{ padding: '10px 24px', borderRadius: '16px', whiteSpace: 'nowrap', fontSize: '14px', fontWeight: '700', cursor: 'pointer', border: categoriaAtiva === cat ? 'none' : '1px solid #f3f4f6', background: categoriaAtiva === cat ? tema.primaria : '#ffffff', color: categoriaAtiva === cat ? '#ffffff' : tema.textoPrincipal, boxShadow: categoriaAtiva === cat ? '0 4px 10px rgba(219, 39, 119, 0.2)' : '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s ease', flexShrink: 0 }}>
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: isMobile ? '16px' : '24px', padding: isMobile ? '0 16px' : '0' }}>
          {produtosFiltrados.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: tema.textoSecundario, background: 'white', borderRadius: '24px', border: '1px dashed #e5e7eb' }}>Nenhum produto encontrado.</div>
          ) : (
            produtosFiltrados.map(p => {
              const fotoPrincipal = pegarPrimeiraFoto(p);
              const esgotado = Number(p.quantidade) <= 0;
              const temDesconto = Number(p.precoAntigo) > Number(p.preco);

              return (
                <div key={p.id} style={{ background: tema.fundoCard, borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid #f3f4f6', boxShadow: '0 8px 16px rgba(0,0,0,0.03)', cursor: 'pointer' }} onClick={() => setProdutoSelecionado(p)}>
                  
                  <div style={{ height: '150px', width: '100%', background: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', padding: '0', boxSizing: 'border-box', overflow: 'hidden' }}>
                    {temDesconto && <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '4px 6px', borderRadius: '6px', zIndex: 5 }}>{Math.round(((Number(p.precoAntigo) - Number(p.preco)) / Number(p.precoAntigo)) * 100)}%</div>}
                    {fotoPrincipal ? <img src={fotoPrincipal} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={30} color="#e5e7eb" />}
                    {esgotado && <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(220, 38, 38, 0.9)', color: 'white', fontSize: '9px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase', backdropFilter: 'blur(4px)' }}>Esgotado</div>}
                  </div>

                  <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', textAlign: 'center', background: '#f9fafb' }}>
                    <h4 style={{ fontSize: '13px', color: tema.textoPrincipal, fontWeight: '700', margin: '0 0 8px 0', lineHeight: '1.3', flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.nome}</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '8px' }}>
                      {temDesconto && <span style={{ fontSize: '11px', color: '#9ca3af', textDecoration: 'line-through', fontWeight: '600' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p.precoAntigo))}</span>}
                      <span style={{ fontSize: '16px', fontWeight: '900', color: tema.primaria }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p.preco) || 0)}</span>
                    </div>

                    <span style={{ fontSize: '11px', color: esgotado ? '#dc2626' : '#6b7280', fontWeight: '600', marginBottom: '12px' }}>
                      {esgotado ? 'Item Esgotado' : `Estoque: ${p.quantidade} un`}
                    </span>

                    {esgotado ? (
                      <button disabled style={{ width: '100%', background: '#f3f4f6', color: '#9ca3af', border: 'none', padding: '10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', cursor: 'not-allowed', textTransform: 'uppercase' }} onClick={(e) => e.stopPropagation()}>Esgotado</button>
                    ) : (
                      <button style={{ width: '100%', background: tema.primaria, color: 'white', border: 'none', padding: '10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', boxShadow: '0 4px 10px rgba(219, 39, 119, 0.2)' }} onClick={(e) => { e.stopPropagation(); setProdutoSelecionado(p); }}>Ver Detalhes</button>
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