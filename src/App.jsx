import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProgramCards } from './components/ProgramCards';
import { Footer } from './components/Footer';
import { FloatingWidget } from './components/FloatingWidget';
import { AuthModal } from './components/AuthModal';
import { Toast } from './components/Toast';

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <Navbar />
        <main>
          <Hero />
          <ProgramCards />
        </main>
        <Footer />
        <FloatingWidget />
        <AuthModal />
        <Toast />
      </div>
    </AuthProvider>
  );
}

export default App;
