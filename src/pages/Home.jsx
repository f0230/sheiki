// src/pages/Home.jsx
import React from 'react';
import Header from "../components/Header";
import Hero from "../components/Hero";
import MainImage from "../components/MainImage";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";

import LoadingFallback from '../components/ui/LoadingFallback'; // 👈 import del nuevo loader


import img1 from '../assets/img1.webp';
import img2 from '../assets/img2.webp';

const Home = () => {

  
  return (

    
    <div className="w-full">

      <Header />
      <Hero />
      
      <MainImage />
      <div className="w-full max-w-[1440px] mx-auto">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 mt-4">
          <ProductCard title="Tu estilo en tu casa" imgSrc={img1} />
          <ProductCard imgSrc={img2} />
        </section>
      </div>

      <Footer />


    </div>
  );
};

export default Home;
