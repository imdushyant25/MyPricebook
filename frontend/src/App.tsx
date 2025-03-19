// src/App.tsx
import React from 'react';
import { ChakraProvider, Box, CSSReset } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FileManagement from './pages/FileManagement';
import FileResultsPage from './pages/FileResultsPage';
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
            {/* Add more routes as you implement them */}
          </Routes>
        </Layout>
      </Router>
    </ChakraProvider>
  );
};

export default App;