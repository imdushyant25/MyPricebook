// src/context/FileContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { File } from '../types/file.types';

interface FileContextProps {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  refreshFiles: () => Promise<void>;
}

const FileContext = createContext<FileContextProps | undefined>(undefined);

export const useFileContext = () => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error('useFileContext must be used within a FileProvider');
  }
  return context;
};

interface FileProviderProps {
  children: ReactNode;
}

export const FileProvider: React.FC<FileProviderProps> = ({ children }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  // Placeholder function - will be implemented when needed
  const refreshFiles = async () => {
    setLoading(true);
    try {
      // API call here
      // const data = await getFiles();
      // setFiles(data);
    } catch (error) {
      console.error('Error refreshing files:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FileContext.Provider value={{ files, setFiles, loading, setLoading, refreshFiles }}>
      {children}
    </FileContext.Provider>
  );
};

export default FileContext;