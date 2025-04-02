// src/App.tsx
import React from 'react';
import { ChakraProvider, CSSReset } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FileManagement from './pages/FileManagement';
import FileResultsPage from './pages/FileResultsPage';
import ProductManagement from './pages/ProductManagement';
import ProductDetails from './components/product-management/ProductDetails';
import Layout from './components/common/Layout';

const App: React.FC = () => {
  return (
    <ChakraProvider>
      <CSSReset />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<FileManagement />} />
            <Route path="/files" element={<FileManagement />} />
            <Route path="/files/:fileId/results" element={<FileResultsPage />} />
            <Route path="/products" element={<ProductManagement />} />
            <Route path="/products/:productId" element={<ProductDetails />} />
          </Routes>
        </Layout>
      </Router>
    </ChakraProvider>
  );
};

export default App;