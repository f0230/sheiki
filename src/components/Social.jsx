// src/components/SocialStrip.jsx
import React from 'react';
import { FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import mplogo from '../assets/mpcolor.svg'; // Asegurate de tener este archivo en /src/assets

const SocialStrip = () => {
    return (
        <section className="text-white py-6 px-4 flex flex-col items-center gap-6">
            {/* Redes sociales */}
            <div className="flex flex-col items-center gap-4 md:flex-row md:justify-center md:gap-10">
              

                <div className="flex gap-6 text-black dark:text-white text-2xl">
                    <a
                        href="https://www.facebook.com/tu_pagina"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                    >
                        <FaFacebookF />
                    </a>

                    <a
                        href="https://www.instagram.com/tu_pagina"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                    >
                        <FaInstagram />
                    </a>

                    <a
                        href="https://wa.me/59812345678"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                    >
                        <FaWhatsapp />
                    </a>
                </div>
            </div>

            {/* Métodos de pago */}
            <div className="flex flex-wrap w-[320px] md:w-[1080px] justify-center items-center gap-2 pt-2">
                    
                    <img src={mplogo} alt="Mercado Pago" className="h-8 md:h-12 w-auto object-contain" />
                    <img src="https://http2.mlstatic.com/storage/logos-api-admin/d7e372a0-f39b-11eb-8e0d-6f4af49bf82e-m.svg" alt="Visa" className="h-8 md:h-12 object-contain" />
                    <img src="https://http2.mlstatic.com/storage/logos-api-admin/aa2b8f70-5c85-11ec-ae75-df2bef173be2-m.svg" alt="Mastercard" className="h-8 md:h-12 object-contain" />
                    <img src="https://http2.mlstatic.com/storage/logos-api-admin/b4785730-c13f-11ee-b4b3-bb9a23b70639-m.svg" alt="OCA" className="h-8 md:h-12 object-contain" />
                    <img src="https://http2.mlstatic.com/storage/logos-api-admin/a5f047d0-9be0-11ec-aad4-c3381f368aaf-m.svg" alt="Diners" className="h-8 md:h-12 object-contain" />
                    <img src="https://http2.mlstatic.com/storage/logos-api-admin/751ea930-571a-11e8-9a2d-4b2bd7b1bf77-m.svg" alt="RedPagos" className="h-8 md:h-12 object-contain" />
                    <img src="https://http2.mlstatic.com/storage/logos-api-admin/91bc0af0-5720-11e8-95d8-631c1a9a92a9-m.svg" alt="Abitab" className="h-8 md:h-12 object-contain" />
                    <img src="https://http2.mlstatic.com/storage/logos-api-admin/38fe3430-57b9-11e8-8359-5d73691de80c-m.svg" alt="Pago Fácil" className="h-8 md:h-12 object-contain" />
                    <img src="https://http2.mlstatic.com/storage/logos-api-admin/a8a621b0-5720-11e8-823a-758d95db88db-m.svg" alt="RapiPago" className="h-8 md:h-12 object-contain" />
                </div>

        </section>
    );
};

export default SocialStrip;
