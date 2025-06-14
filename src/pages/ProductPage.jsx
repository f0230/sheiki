// src/pages/ProductPage.jsx
import React, {
  useEffect,
  useRef,
  useState,
  Suspense,
  lazy,
  useCallback
} from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger, ScrollToPlugin } from 'gsap/all';
import { supabase } from '../lib/supabaseClient.js';
import { useCart } from '../store/useCart';
import { useAuth } from '../context/AuthContext'; // Import useAuth

// Component Imports
import Toast from '../components/Toast';
import useFlyToCart from '../components/FlyToCartAnimator';
import OptimizedImage from '../components/OptimizedImage'; // Assuming you want to use this
import LoadingFallback from '../components/ui/LoadingFallback';

// Lazy-loaded components
const Header = lazy(() => import('../components/Header'));
const Footer = lazy(() => import('../components/Footer'));
const FreeShippingMarquee = lazy(() => import('../components/FreeShippingMarquee'));

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const ProductPage = () => {
  // Product Data State
  const [producto, setProducto] = useState(null);
  const [variantes, setVariantes] = useState([]);
  const [imagenesPorColor, setImagenesPorColor] = useState([]);

  // User Selection State
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedTalle, setSelectedTalle] = useState('');
  const [stockDisponible, setStockDisponible] = useState(null);

  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // More specific error state
  const [showToast, setShowToast] = useState(false);

  // Refs for DOM elements and animations
  const imgGalleryRef = useRef(null); // Renamed for clarity
  const infoRef = useRef(null);
  const imageRefs = useRef([]); // For individual images in gallery
  const carritoIconRef = useRef(null); // Passed to Header
  const modalRef = useRef(null);
  const tablaRef = useRef(null);

  // Refs for gallery dragging
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const animationFrame = useRef(null);

  // Hooks
  const { addToCart } = useCart();
  const { animate: flyToCartAnimate } = useFlyToCart();
  const { user } = useAuth(); // Get user from AuthContext

  // Constants
  const TALLAS_MAP = { 36: '23.0', 37: '23.7', 38: '24.4', 39: '25.0', 40: '25.7' };
  const PRODUCT_SLUG = 'pantufla-soft'; // Define as constant for easier changes

  // Fetch product data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data: prodData, error: prodError } = await supabase
          .from('productos')
          .select('*')
          .eq('slug', PRODUCT_SLUG)
          .single();

        if (prodError) throw new Error(`Error al cargar producto: ${prodError.message}`);
        if (!prodData) throw new Error('Producto no encontrado.');

        const [variantesRes, imagenesRes] = await Promise.all([
          supabase.from('variantes').select('*').eq('producto_id', prodData.id).gt('stock', 0),
          supabase.from('imagenes_producto').select('*').eq('producto_id', prodData.id),
        ]);

        if (variantesRes.error) throw new Error(`Error al cargar variantes: ${variantesRes.error.message}`);
        if (imagenesRes.error) throw new Error(`Error al cargar imágenes: ${imagenesRes.error.message}`);

        setProducto(prodData);
        setVariantes(variantesRes.data || []);
        setImagenesPorColor(imagenesRes.data || []);

      } catch (err) {
        console.error('❌ Error en fetchData:', err);
        setError(err.message || 'Ocurrió un error al cargar los datos.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Set default selected color
  useEffect(() => {
    const coloresUnicos = [...new Set(variantes.map(v => v.color))];
    if (coloresUnicos.length > 0 && !selectedColor) {
      setSelectedColor(coloresUnicos[0]);
    }
  }, [variantes, selectedColor]);

  // GSAP Intro Animations
  useEffect(() => {
    if (isLoading || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (imgGalleryRef.current) {
      gsap.fromTo(
        imgGalleryRef.current,
        { opacity: 0, x: -40, scale: 0.98, filter: 'blur(6px)' },
        { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: imgGalleryRef.current, start: 'top 80%', toggleActions: 'play none none reverse' } }
      );
    }
    if (infoRef.current) {
      gsap.fromTo(
        infoRef.current,
        { opacity: 0, x: 40, filter: 'blur(6px)' },
        { opacity: 1, x: 0, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: infoRef.current, start: 'top 80%', toggleActions: 'play none none reverse' } }
      );
    }
  }, [isLoading]); // Re-run if isLoading changes (i.e., after data is loaded)

  // GSAP Image Gallery Animations (on color change)
  const imagenesSeleccionadas = imagenesPorColor.filter(img => img.color === selectedColor);
  useEffect(() => {
    if (isLoading || !imagenesSeleccionadas.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    imageRefs.current.forEach((el, i) => {
      if (el) {
        gsap.fromTo(
          el,
          { opacity: 0, scale: 0.95, y: 20, filter: 'blur(4px)' },
          { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power3.out', delay: i * 0.08 }
        );
      }
    });
    // Reset scroll to the beginning of the gallery when color changes
    if (imgGalleryRef.current) {
      imgGalleryRef.current.scrollLeft = 0;
    }
  }, [selectedColor, isLoading, imagenesSeleccionadas.length]); // Dependency on length to re-trigger if image count changes

  // Update stock based on selection
  useEffect(() => {
    if (selectedColor && selectedTalle) {
      const varianteEncontrada = variantes.find(v => v.color === selectedColor && v.talle === selectedTalle);
      const newStock = varianteEncontrada?.stock || 0;
      if (stockDisponible !== newStock) { // Only animate if stock actually changes
        gsap.to('.stock-info', { // Consider using a ref if this causes issues or for more complex scenarios
          opacity: 0,
          duration: 0.15,
          onComplete: () => {
            setStockDisponible(newStock);
            gsap.to('.stock-info', { opacity: 1, duration: 0.25 });
          }
        });
      } else {
        setStockDisponible(newStock); // Set directly if no animation needed
      }
    } else {
      setStockDisponible(null);
    }
  }, [selectedColor, selectedTalle, variantes, stockDisponible]);


  // Modal (Tabla de Talles) functions
  const abrirTabla = useCallback(() => {
    if (!modalRef.current || !tablaRef.current) return;
    gsap.to(modalRef.current, { opacity: 1, duration: 0.4, pointerEvents: 'auto', ease: 'power2.inOut' });
    gsap.fromTo(tablaRef.current,
      { y: 50, scale: 0.95, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out' }
    );
  }, []);

  const cerrarTabla = useCallback(() => {
    if (!modalRef.current || !tablaRef.current) return;
    gsap.to(tablaRef.current, { y: 50, scale: 0.95, opacity: 0, duration: 0.4, ease: 'power2.in' });
    gsap.to(modalRef.current, { opacity: 0, duration: 0.3, pointerEvents: 'none', delay: 0.1 });
  }, []);

  // Image Gallery Dragging handlers
  const handleMouseDown = useCallback((e) => {
    if (!imgGalleryRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - imgGalleryRef.current.offsetLeft;
    scrollLeft.current = imgGalleryRef.current.scrollLeft;
    document.body.classList.add('dragging');
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || !imgGalleryRef.current) return;
    e.preventDefault();
    const x = e.pageX - imgGalleryRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    imgGalleryRef.current.scrollLeft = scrollLeft.current - walk;
  }, []);

  const handleMouseUpOrLeave = useCallback(() => {
    if (!imgGalleryRef.current) return;
    isDragging.current = false;
    document.body.classList.remove('dragging');

    const scrollNow = imgGalleryRef.current.scrollLeft;
    const slideWidth = imgGalleryRef.current.offsetWidth;
    const totalSlides = imagenesSeleccionadas.length;

    const index = Math.round(scrollNow / slideWidth);
    const clampedIndex = Math.max(0, Math.min(totalSlides - 1, index));

    gsap.to(imgGalleryRef.current, {
      scrollTo: { x: clampedIndex * slideWidth },
      duration: 0.4,
      ease: 'power2.out'
    });
  }, [imagenesSeleccionadas.length]);
  
  // Add to cart handler
  const handleAddToCart = useCallback(() => {
    if (!producto || !selectedColor || !selectedTalle || stockDisponible === 0) return;

    const currentImageElement = imageRefs.current[0]; // Assuming the first image is the main one for animation
    const cartIconElement = carritoIconRef.current;

    addToCart(
      {
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
      },
      selectedColor,
      selectedTalle,
      1,
      imagenesSeleccionadas?.[0]?.url || '/assets/pantufla-default.webp' // asegúrate de tener una fallback
    );
    

    // Send event to Meta Pixel (non-blocking)
    fetch('/api/sendEventToMeta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: 'AddToCart',
        url: window.location.href,
        user_agent: navigator.userAgent,
        email: user?.email || null, // Get email from auth context
        custom_data: {
          currency: 'UYU', // Assuming UYU, adjust if needed
          value: producto.precio,
          content_ids: [producto.id],
          content_name: producto.nombre,
          content_category: producto.categoria || 'Pantuflas', // Add category if available
          content_type: 'product',
        },
      }),
    }).catch(err => console.error("Error al enviar evento AddToCart a Meta:", err));

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    if (currentImageElement && cartIconElement) {
      flyToCartAnimate(currentImageElement, cartIconElement);
    }
  }, [producto, selectedColor, selectedTalle, stockDisponible, addToCart, imagenesSeleccionadas, flyToCartAnimate, user]);


  // Derived data for rendering
  const coloresDisponibles = [...new Set(variantes.map(v => v.color))];
  const tallesDisponiblesPorColor = selectedColor
    ? [...new Set(variantes.filter(v => v.color === selectedColor).map(v => v.talle))].sort((a, b) => parseInt(a) - parseInt(b))
    : [];

  // Render Logic
  if (isLoading) {
    return <LoadingFallback />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <Header ref={carritoIconRef} />
        <p className="text-red-500 text-xl mt-20">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-700"
        >
          Intentar de nuevo
        </button>
        <Footer />
      </div>
    );
  }

  if (!producto) {
    // This case should ideally be covered by the error state if product not found
    return <LoadingFallback />;
  }


  

  return (
    <div className=" font-product min-h-screen flex flex-col">
      <Suspense fallback={<div className="h-[60px]" />}> {/* Placeholder for Header height */}
        <Header ref={carritoIconRef} />
      </Suspense>
      <Suspense fallback={<div className="h-[36px]" />}> {/* Placeholder for Marquee height */}
        <FreeShippingMarquee />
      </Suspense>

      <main className="max-w-[1440px] mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow w-full">
        {/* Image Gallery: Added ARIA roles for accessibility */}
        <div
          ref={imgGalleryRef}
          className="flex overflow-x-auto snap-x snap-mandatory gap-2 scroll-smooth no-scrollbar md:h-[calc(100vh-150px)] max-md:h-[400px] max-md:pb-2cursor-grab select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          role="region"
          aria-label={`Imágenes de ${producto.nombre}`}
          tabIndex={0}
        >
          {imagenesSeleccionadas.map((img, idx) => (
            <div
              key={img.id || idx}
              className="min-w-full snap-start flex-shrink-0 w-full h-full"
            >
              <OptimizedImage
                src={img.url}
                mobileSrc={img.mobile_url || img.url}
                alt={`${producto.nombre} - color ${selectedColor} - imagen ${idx + 1}`}
                className="w-full h-full object-cover"
                loading={idx === 0 ? 'eager' : 'lazy'}
                ref={el => imageRefs.current[idx] = el}
              />
            </div>
          ))}

          {imagenesSeleccionadas.length === 0 && (
            <div className="min-w-full snap-center flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <p className="text-gray-500">No hay imágenes para este color.</p>
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="flex flex-col items-start gap-2" ref={infoRef}>
          <h1 className="text-[30px] md:text-[45px] font-normal leading-tight dark:text-white">{producto.nombre}</h1>
          
          <p className="text-[16px] md:text-[20px] leading-none text-black dark:text-white">{producto.descripcion}</p>
          <p className="text-[30px] md:text-[45px] font-bold text-black dark:text-white">${producto.precio}</p>

          {/* Color Selection */}
          {/* Selector de color */}
          <div>
            <label
              htmlFor="color-select"
              className="block mb-2 font-bold text-black dark:text-white"
            >
              Color
            </label>
            <div
              id="color-select"
              role="radiogroup"
              aria-label="Seleccionar color"
              className="flex gap-2 flex-wrap"
            >
              {coloresDisponibles.map((color) => {
                const isSelected = selectedColor === color;

                // Mapa de clases de color según nombre
                const colorMap = {
                  amarillo: 'bg-yellow-400 text-black',
                  azul: 'bg-blue-500 text-white',
                  rosa: 'bg-pink-400 text-black',
                  negro: 'bg-black text-white',
                  blanco: 'bg-white text-black border-black ',
                  marrón: 'bg-[#8B4513] text-white', // Marrón cuero (custom hex)
                };
                

                const colorClass = colorMap[color.toLowerCase()] || 'bg-gray-200 text-black';

                return (
                  <button
                    key={color}
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setSelectedColor(color);
                      setSelectedTalle('');
                    }}
                    onMouseEnter={(e) =>
                      gsap.to(e.currentTarget, { scale: 1.05, duration: 0.2 })
                    }
                    onMouseLeave={(e) =>
                      gsap.to(e.currentTarget, { scale: 1.0, duration: 0.2 })
                    }
                    className={`px-4 py-2 rounded-full border transition-all duration-200 ease-in-out text-[12px] md:text-[14px] focus:outline-none focus:ring-2 focus:ring-offset-1  
            ${isSelected
                        ? `${colorClass} border-black dark:border-white shadow-md`
                        : `border-black dark:border-white hover:border-black dark:hover:border-white text-black dark:text-white bg-transparent`
                      }`}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>



          {/* Talle Selection */}
          {selectedColor && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label htmlFor="talle-select" className="font-bold text-black dark:text-white">Talle</label>
                {stockDisponible !== null && (
                  <span className="text-sm text-black dark:text-white stock-info transition-opacity duration-200">
                    (Stock: <strong>{stockDisponible}</strong>)
                  </span>
           
                )}
              </div>
              <div id="talle-select" role="radiogroup" aria-label="Seleccionar talle" className="flex gap-2 flex-wrap">
                {tallesDisponiblesPorColor.map(talle => (
                  <button
                    key={talle}
                    role="radio"
                    aria-checked={selectedTalle === talle}
                    onClick={() => setSelectedTalle(talle)}
                    onMouseEnter={e => gsap.to(e.currentTarget, { scale: 1.05, duration: 0.2 })}
                    onMouseLeave={e => gsap.to(e.currentTarget, { scale: 1.0, duration: 0.2 })}
                    className={`px-3 py-2 rounded-full border transition-all duration-200 ease-in-out text-[12px] md:text-[14px] min-w-[40px] text-center focus:outline-none focus:ring-2 focus:ring-offset-1
                                          ${selectedTalle === talle
                        ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-md'
                        : 'border-black dark:border-white hover:border-black dark:hover:border-white text-black dark:text-white'
                      }`}
                  >
                    {talle}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <button
            className="mt-6 bg-black dark:bg-white dark:text-black text-white w-full max-w-[335px] h-[45px] md:h-[53px] rounded-full text-lg font-bold
                                  
                                 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 "
            disabled={!selectedColor || !selectedTalle || stockDisponible === null || stockDisponible === 0}
            onClick={handleAddToCart}
            aria-label="Agregar producto al carrito"
          >
            {stockDisponible === 0 && selectedTalle ? "Sin stock" : "Agregar al carrito"}
          </button>

          <div className="mt-6 flex flex-row gap-3 w-full max-w-[335px]">
            {/* Botón WhatsApp */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Encontré estas pantuflas en Sheiki 😍\n${producto.nombre} - $${producto.precio}\n👇 Miralas acá:\n${window.location.href}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold dark:bg-black bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors duration-200 shadow-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                viewBox="0 0 32 32"
                fill="currentColor"
              >
                <path d="M16 .063C7.157.063.063 7.157.063 16c0 2.816.746 5.469 2.03 7.781L.25 31.438l7.782-1.875A15.842 15.842 0 0 0 16 31.938C24.844 31.938 31.938 24.844 31.938 16 31.938 7.157 24.844.063 16 .063zM16 29.25c-2.5 0-4.812-.688-6.875-1.875l-.5-.282-4.625 1.125 1.188-4.562-.313-.5A12.924 12.924 0 0 1 3.75 16c0-6.75 5.5-12.25 12.25-12.25 6.75 0 12.25 5.5 12.25 12.25 0 6.75-5.5 12.25-12.25 12.25zm6.438-8.938c-.375-.188-2.25-1.125-2.594-1.25-.344-.125-.594-.188-.844.188s-.969 1.25-1.188 1.5c-.219.25-.438.281-.813.094-.375-.188-1.594-.625-3.031-2a11.16 11.16 0 0 1-2.094-2.625c-.219-.375-.031-.594.156-.781.156-.156.375-.438.563-.656.188-.219.25-.375.375-.625.125-.25.062-.469 0-.656-.063-.188-.844-2.031-1.156-2.812-.312-.75-.625-.625-.844-.625h-.719c-.25 0-.656.094-1 .469s-1.312 1.281-1.312 3.125c0 1.844 1.344 3.625 1.531 3.875.188.25 2.656 4.062 6.437 5.687.875.375 1.563.594 2.094.75.875.281 1.688.25 2.312.156.719-.125 2.25-.906 2.563-1.781.312-.844.312-1.562.219-1.781-.094-.219-.344-.344-.719-.531z" />
              </svg>
              Compartir
            </a>

            {/* Botón Tabla de Talles */}
            <button
              onClick={abrirTabla}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white underline rounded-full transition-colors duration-200"
              aria-haspopup="dialog"
            >
              Ver tabla de talles
            </button>
          </div>


          
        </div>

        {/* Size Chart Modal: Added ARIA for dialog accessibility */}
        <div
          ref={modalRef}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none opacity-0 bg-black/40 dark:bg-white/20 backdrop-blur-md"
          role="dialog" // ARIA: Identifies this as a dialog
          aria-modal="true" // ARIA: Indicates it's a modal
          aria-labelledby="tabla-talles-titulo" // ARIA: Points to the title
          onClick={(e) => { if (e.target === modalRef.current) cerrarTabla(); }} // Close on overlay click
        >
          <div ref={tablaRef} className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-6 w-[90%] max-w-sm scale-90 opacity-0 border border-gray-200 dark:border-gray-700">
            <h2 id="tabla-talles-titulo" className="text-xl font-bold mb-4 text-center text-black dark:text-white">Tabla de talles</h2>
            <table className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="border border-gray-300 dark:border-gray-600 p-2 text-black dark:text-white">Talle</th>
                  <th className="border border-gray-300 dark:border-gray-600 p-2 text-black dark:text-white">Largo (cm)</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                {Object.entries(TALLAS_MAP).map(([talle, cm]) => (
                  <tr key={talle} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-700/50">
                    <td className="border border-gray-300 dark:border-gray-600 p-2 text-center">{talle}</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-2 text-center">{cm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={cerrarTabla} className="mt-6 mx-auto block text-sm text-pink-600 dark:text-pink-400 hover:underline focus:outline-none focus:ring-1 focus:ring-pink-500 rounded">Cerrar</button>
          </div>
        </div>
      </main>

      <Suspense fallback={<div />}>
        <Footer />
      </Suspense>
      <Toast message="Producto agregado al carrito" visible={showToast} />
    </div>
  );
};

export default ProductPage;