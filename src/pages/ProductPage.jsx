// src/pages/ProductPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { supabase } from '../lib/supabaseClient.js';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FreeShippingMarquee from '../components/FreeShippingMarquee';
import { useCart } from '../store/useCart';
import Toast from '../components/Toast';
import useFlyToCart from '../components/FlyToCartAnimator';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const ProductPage = () => {
  const [producto, setProducto] = useState(null);
  const [variantes, setVariantes] = useState([]);
  const [imagenesPorColor, setImagenesPorColor] = useState([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedTalle, setSelectedTalle] = useState('');
  const [stockDisponible, setStockDisponible] = useState(null);
  const [showToast, setShowToast] = useState(false);

  const imgRef = useRef(null);
  const infoRef = useRef(null);
  const imageRefs = useRef([]);
  const carritoIconRef = useRef(null);

  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const modalRef = useRef(null);
  const tablaRef = useRef(null);

  const { addToCart } = useCart();
  const { animate } = useFlyToCart();

  const talles = { 36: '23.0', 37: '23.7', 38: '24.4', 39: '25.0', 40: '25.7' };

  const abrirTabla = () => {
    gsap.to(modalRef.current, { opacity: 1, duration: 0.4, pointerEvents: 'auto' });
    gsap.fromTo(tablaRef.current, { y: 80, scale: 0.9, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.6, ease: 'power3.out' });
  };

  const cerrarTabla = () => {
    gsap.to(modalRef.current, { opacity: 0, duration: 0.3, pointerEvents: 'none' });
  };

    useEffect(() => {
        const fetchData = async () => {
            const { data: prod } = await supabase.from('productos').select('*').eq('slug', 'pantufla-soft').single();
            if (!prod) return;
            const { data: vars } = await supabase.from('variantes').select('*').eq('producto_id', prod.id).gt('stock', 0);
            const { data: imgs } = await supabase.from('imagenes_producto').select('*').eq('producto_id', prod.id);
            setProducto(prod);
            setVariantes(vars);
            setImagenesPorColor(imgs);
        };
        fetchData();
    }, []);


  useEffect(() => {
    const colores = [...new Set(variantes.map(v => v.color))];
    if (colores.length > 0 && !selectedColor) setSelectedColor(colores[0]);
  }, [variantes]);

  useEffect(() => {
    if (imgRef.current && infoRef.current) {
      gsap.fromTo(imgRef.current, { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 1, ease: 'power2.out', scrollTrigger: { trigger: imgRef.current, start: 'top 80%' } });
      gsap.fromTo(infoRef.current, { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration: 1, ease: 'power2.out', scrollTrigger: { trigger: infoRef.current, start: 'top 80%' } });
    }
  }, []);

  const coloresDisponibles = [...new Set(variantes.map(v => v.color))];
  const tallesDisponibles = selectedColor ? [...new Set(variantes.filter(v => v.color === selectedColor).map(v => v.talle))] : [];
  const imagenesSeleccionadas = imagenesPorColor.filter(img => img.color === selectedColor);

  useEffect(() => {
    if (!imagenesSeleccionadas.length) return;
    imageRefs.current.forEach(el => gsap.set(el, { clearProps: 'all' }));
    gsap.to(imageRefs.current, {
      opacity: 0,
      duration: 0.2,
      onComplete: () => {
        imageRefs.current.forEach((el, i) => {
          if (el) {
            gsap.fromTo(el, { opacity: 0, x: 20, scale: 0.98 }, { opacity: 1, x: 0, scale: 1, duration: 0.6, ease: 'power2.out', stagger: 0.05, overwrite: 'auto' });
          }
        });
      }
    });
  }, [selectedColor]);

  useEffect(() => {
    if (selectedColor && selectedTalle) {
      const variante = variantes.find(v => v.color === selectedColor && v.talle === selectedTalle);
      gsap.to('.stock-info', {
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
          setStockDisponible(variante?.stock || 0);
          gsap.to('.stock-info', { opacity: 1, duration: 0.3 });
        }
      });
    } else {
      setStockDisponible(null);
    }
  }, [selectedColor, selectedTalle, variantes]);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.pageX - imgRef.current.offsetLeft;
    scrollLeft.current = imgRef.current.scrollLeft;
  };
  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - imgRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    imgRef.current.scrollLeft = scrollLeft.current - walk;
  };
  const handleMouseUp = () => isDragging.current = false;

  return (
    <div className="bg-[#D65FA5] text-white font-product min-h-screen">
      <Header ref={carritoIconRef} />
      <FreeShippingMarquee />
      <main className="max-w-[1440px] mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div
          ref={imgRef}
          className="flex overflow-x-auto snap-x gap-4 scroll-smooth no-scrollbar max-md:pb-4 max-md:mb-4 max-md:flex-nowrap cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {imagenesSeleccionadas.map((img, idx) => (
            <img
              key={idx}
              src={img.url}
              ref={el => imageRefs.current[idx] = el}
              alt={`Pantufla ${selectedColor} ${idx + 1}`}
              onClick={() => {
                const target = imageRefs.current[idx];
                if (!target) return;
                gsap.to(imgRef.current, { scrollTo: { x: target.offsetLeft }, duration: 0.8, ease: 'power2.out' });
                gsap.fromTo(target, { scale: 0.95, rotate: -1 }, { scale: 1, rotate: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
              }}
              className="rounded-xl w-full h-auto min-w-[85%] max-w-[85%] snap-center object-cover cursor-pointer"
            />
          ))}
        </div>

        <div className="flex flex-col justify-center gap-6" ref={infoRef}>
                  <h1 className="text-4xl font-bold">{producto?.nombre}</h1>
                  <p className="text-lg">{producto?.descripcion}</p>
                  <p className="text-xl font-semibold">${producto?.precio}</p>  {/* Mostrar el precio */}



          <div>
            <label className="block mb-2 font-semibold">Color</label>
            <div className="flex gap-2 flex-wrap">
              {coloresDisponibles.map(color => (
                <button
                  key={color}
                  onClick={() => { setSelectedColor(color); setSelectedTalle(''); }}
                  onMouseEnter={e => gsap.to(e.currentTarget, { scale: 1.1, duration: 0.2 })}
                  onMouseLeave={e => gsap.to(e.currentTarget, { scale: 1.0, duration: 0.2 })}
                  className={`px-4 py-2 rounded-full border transition-transform ${selectedColor === color ? 'bg-white text-black' : 'border-white'}`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {selectedColor && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="font-semibold">Talle</label>
                {stockDisponible !== null && (
                  <span className="text-sm text-white/70 stock-info">
                    (Stock: <strong>{stockDisponible}</strong>)
                  </span>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {tallesDisponibles.map(talle => (
                  <button
                    key={talle}
                    onClick={() => setSelectedTalle(talle)}
                    onMouseEnter={e => gsap.to(e.currentTarget, { scale: 1.1, duration: 0.2 })}
                    onMouseLeave={e => gsap.to(e.currentTarget, { scale: 1.0, duration: 0.2 })}
                    className={`px-4 py-2 rounded-full border transition-transform ${selectedTalle === talle ? 'bg-white text-black' : 'border-white'}`}
                  >
                    {talle}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            className="mt-4 bg-black text-white py-3 px-6 rounded-full text-lg hover:bg-gray-900 transition disabled:opacity-50"
            disabled={!selectedColor || !selectedTalle || stockDisponible === 0}
            onClick={() => {
              if (!producto) return;

              // Asegúrate de que el objeto producto contiene todos los campos necesarios
              addToCart({
                id: producto.id,
                nombre: producto.nombre,
                imagen: imagenesSeleccionadas?.[0]?.url ?? '',
                precio: producto.precio,  // Asegúrate de pasar el precio del producto
              }, selectedColor, selectedTalle, 1);  // Pasa el precio junto con el producto
              setShowToast(true);
              setTimeout(() => setShowToast(false), 3000);
              animate(imageRefs.current[0], carritoIconRef.current);
            }}
          >
            Agregar al carrito
          </button>

          <button
            onClick={abrirTabla}
            className="mt-2 underline text-sm hover:text-white/80 transition"
          >
            Ver tabla de talles
          </button>
        </div>

        <div ref={modalRef} className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none opacity-0 transition-all duration-300 bg-white/30 backdrop-blur-[3px]">
          <div ref={tablaRef} className="bg-white shadow-2xl rounded-2xl p-6 w-[90%] max-w-sm text-black scale-90 border border-white/20">
            <h2 className="text-xl font-bold mb-4 text-center">Tabla de talles</h2>
            <table className="w-full text-sm border border-gray-300 rounded-md overflow-hidden">
              <thead><tr className="bg-gray-200"><th className="border p-2">Talle</th><th className="border p-2">Largo (cm)</th></tr></thead>
              <tbody>
                {[36, 37, 38, 39, 40].map((t) => (
                  <tr key={t} className="odd:bg-white even:bg-gray-100">
                    <td className="border p-2 text-center">{t}</td>
                    <td className="border p-2 text-center">{talles[t]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={cerrarTabla} className="mt-4 mx-auto block text-sm text-primary hover:underline">Cerrar</button>
          </div>
        </div>
      </main>
      <Toast message="Producto agregado al carrito" visible={showToast} />
      <Footer />
    </div>
  );
};

export default ProductPage;