// components/FileUpload.tsx
'use client';

import { useState, useEffect, useRef } from 'react';

interface FileWithProgress {
  file: File;
  id: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  isSimulating: boolean;
  abortController: AbortController;
}

export default function FileUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [preview, setPreview] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      addFile(droppedFile);
      generatePreview(droppedFile);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      addFile(selectedFile);
      generatePreview(selectedFile);
    }
  };

  const addFile = (file: File) => {
    const abortController = new AbortController();
    const newFile: FileWithProgress = {
      file,
      id: Math.random().toString(36).substring(2, 9),
      progress: 0,
      status: 'uploading',
      isSimulating: true,
      abortController
    };
    setFiles(prev => [...prev, newFile]);
  };

  const generatePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const onButtonClick = () => {
    // Trigger file input click using DOM query
    const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(item => item.id === id);
      if (fileToRemove && fileToRemove.abortController) {
        fileToRemove.abortController.abort();
      }
      return prev.filter(item => item.id !== id);
    });
    // Limpiar preview si se elimina el archivo actual
    if (files.length === 1) {
      setPreview(null);
    }
  };

  const cancelUpload = (id: string) => {
    setFiles(prev => {
      const updatedFiles = [...prev];
      const fileIndex = updatedFiles.findIndex(item => item.id === id);

      if (fileIndex !== -1) {
        const fileToUpdate = updatedFiles[fileIndex];

        // Abortar la simulación
        if (fileToUpdate.abortController) {
          fileToUpdate.abortController.abort();
        }

        // Actualizar el estado del archivo
        updatedFiles[fileIndex] = {
          ...fileToUpdate,
          status: 'error',
          isSimulating: false,
          progress: 0
        };
      }

      return updatedFiles;
    });
  };

  // Simulación de progreso para cada archivo
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];

    files.forEach((fileItem) => {
      if (fileItem.isSimulating && fileItem.progress < 100) {
        const interval = setInterval(() => {
          setFiles(prev => {
            const updatedFiles = [...prev];
            const itemIndex = updatedFiles.findIndex(item => item.id === fileItem.id);

            if (itemIndex !== -1) {
              // Verificar si la operación ha sido abortada
              if (fileItem.abortController.signal.aborted) {
                clearInterval(interval);
                return updatedFiles.map(file =>
                  file.id === fileItem.id
                    ? { ...file, isSimulating: false }
                    : file
                );
              }

              const newProgress = updatedFiles[itemIndex].progress + 10;
              if (newProgress >= 100) {
                clearInterval(interval);
                updatedFiles[itemIndex] = {
                  ...updatedFiles[itemIndex],
                  progress: 100,
                  status: 'done',
                  isSimulating: false
                };
              } else {
                updatedFiles[itemIndex] = {
                  ...updatedFiles[itemIndex],
                  progress: newProgress
                };
              }
            }
            return updatedFiles;
          });
        }, 500);

        intervals.push(interval);
      }
    });

    return () => {
      intervals.forEach(interval => clearInterval(interval));
    };
  }, [files]);

  // Función para obtener el color del estado
  const getStatusColor = (status: 'uploading' | 'done' | 'error') => {
    switch(status) {
      case 'uploading': return 'bg-yellow-100 text-yellow-800';
      case 'done': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Función para obtener el texto del estado
  const getStatusText = (status: 'uploading' | 'done' | 'error') => {
    switch(status) {
      case 'uploading': return 'Subiendo...';
      case 'done': return 'Completado';
      case 'error': return 'Cancelado';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="w-full mx-auto p-6 bg-white rounded-xl shadow-lg">
      <form
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          id="file-upload-input"
          type="file"
          className="hidden"
          onChange={handleChange}
          accept="image/*,.pdf,.doc,.docx"
        />

        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>


          <button
            type="button"
            onClick={onButtonClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Seleccionar archivo
          </button>
          <p className="text-xs text-gray-500"> Drag and drop your files here or click to select them </p>
          <p className="text-xs text-gray-500">
            Accept Files: PDF
          </p>
        </div>

        {/* Preview Section */}
        {preview && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
            <img
              src={preview}
              alt="Vista previa del archivo"
              className="max-h-40 mx-auto rounded-md border"
            />
          </div>
        )}

        {files.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eliminar</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tamaño</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última modificación</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Extensión</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progreso</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cancelar</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.map((fileItem) => (
                  <tr key={fileItem.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => removeFile(fileItem.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        ❌
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-xs">{fileItem.file.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{fileItem.file.type || 'Desconocido'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{(fileItem.file.size / 1024 / 1024).toFixed(2)} MB</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(fileItem.file.lastModified).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {fileItem.file.name.split('.').pop()?.toUpperCase() || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${fileItem.progress}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-gray-700">{fileItem.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(fileItem.status)}`}>
                        {getStatusText(fileItem.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {fileItem.status === 'uploading' && (
                        <button
                          onClick={() => cancelUpload(fileItem.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </form>
    </div>
  );
}