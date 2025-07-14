import React, { useState } from 'react';
import { X, Upload, FileText, Download } from 'lucide-react';
import Button from '../ui/Button';
import Select from '../ui/Select';

interface ImportScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

const DATE_FORMAT_OPTIONS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY' },
  { value: 'MM-DD-YYYY', label: 'MM-DD-YYYY' },
];

const ImportScheduleModal: React.FC<ImportScheduleModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

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
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv') || file.name.endsWith('.ics')) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // Simulate file upload and processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onImportComplete();
      onClose();
      setSelectedFile(null);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a link to download the PDF template
    const link = document.createElement('a');
    link.href = '/template.pdf';
    link.download = 'schedule_template.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadNumbersTemplate = () => {
    // In a real implementation, this would download actual template files
    console.log('Downloading Apple Numbers template');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Import Schedule</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-6 space-y-6">
            {/* File Upload Section */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Upload your CSV or ICS file
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Use our template to batch upload your schedule. Download one of our template files,{' '}
                <span className="text-blue-600">fill it out</span>, save as CSV and upload it below. Or{' '}
                <span className="text-blue-600">download an ICS file from your league</span> and upload it below.
              </p>

              {/* Template Downloads */}
              <div className="flex flex-wrap gap-4 mb-6">
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Schedule Template (PDF)
                </button>
                <button
                  onClick={downloadNumbersTemplate}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Apple Numbers Template
                </button>
              </div>

              {/* Date Format Selector */}
              <div className="mb-6">
                <Select
                  label="Date Format"
                  value={dateFormat}
                  onChange={setDateFormat}
                  options={DATE_FORMAT_OPTIONS}
                />
              </div>

              {/* File Drop Zone */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : selectedFile
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".csv,.ics"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <div className="flex flex-col items-center">
                  <Upload className={`h-12 w-12 mb-4 ${
                    selectedFile ? 'text-green-500' : 'text-gray-400'
                  }`} />
                  
                  {selectedFile ? (
                    <div>
                      <p className="text-lg font-medium text-green-700 mb-1">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-green-600">
                        File selected successfully
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-medium text-blue-600 mb-1">
                        Upload a file or drag and drop
                      </p>
                      <p className="text-sm text-gray-500">
                        CSV or ICS file up to 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedFile && (
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleImport}
                    loading={uploading}
                    className="px-8 py-2"
                  >
                    Import Schedule
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportScheduleModal;