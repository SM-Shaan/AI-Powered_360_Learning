import { useState, useRef } from 'react';
import { Upload, X, Check, FileImage, Loader2, Eye, Code, FileText, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { contentAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

function HandwrittenNotesUpload({ onUploadSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'theory',
    topic: '',
    week: '',
    tags: '',
    enhance_image: true
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [ocrResult, setOcrResult] = useState(null);
  const [showRendered, setShowRendered] = useState(true);
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/bmp', 'image/tiff', 'image/webp'];
      if (!validTypes.includes(selectedFile.type)) {
        setMessage({ type: 'error', text: 'Please select a valid image file (JPG, PNG, BMP, TIFF, or WebP)' });
        return;
      }

      setFile(selectedFile);
      setOcrResult(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);

      // Auto-fill title if empty
      if (!formData.title) {
        setFormData(prev => ({
          ...prev,
          title: selectedFile.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
        }));
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const input = fileInputRef.current;
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(droppedFile);
      input.files = dataTransfer.files;
      handleFileChange({ target: { files: [droppedFile] } });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setOcrResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e, forceUpload = false) => {
    e?.preventDefault();

    if (!file) {
      setMessage({ type: 'error', text: 'Please select an image file to upload' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });
    setOcrResult(null);
    setDuplicateInfo(null);

    try {
      const data = new FormData();
      data.append('file', file);
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null) {
          data.append(key, value);
        }
      });

      const response = await contentAPI.uploadHandwrittenNotes(data, forceUpload);

      setMessage({ type: 'success', text: 'Handwritten notes uploaded and processed successfully!' });

      // Show OCR result
      console.log('Full response:', response.data);
      console.log('OCR result:', response.data?.data?.ocr_result);

      if (response.data?.data?.ocr_result) {
        setOcrResult(response.data.data.ocr_result);
      } else {
        console.error('No OCR result in response');
        setMessage({ type: 'error', text: 'OCR processing did not return results' });
      }

      onUploadSuccess && onUploadSuccess(response.data.data);
    } catch (error) {
      console.error('Upload error:', error);

      // Check if it's a duplicate error (409 Conflict)
      if (error.response?.status === 409) {
        const detail = error.response.data?.detail;
        setDuplicateInfo({
          message: detail?.message || 'A file with this name already exists',
          existing: detail?.existing,
          options: detail?.options
        });
        setMessage({ type: 'warning', text: 'Duplicate file detected' });
      } else {
        const errorMsg = error.response?.data?.detail;
        setMessage({
          type: 'error',
          text: typeof errorMsg === 'string' ? errorMsg : errorMsg?.message || 'Failed to upload handwritten notes'
        });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleForceUpload = () => {
    setDuplicateInfo(null);
    handleSubmit(null, true);
  };

  const handleCancelDuplicate = () => {
    setDuplicateInfo(null);
    setMessage({ type: '', text: '' });
  };

  const inputClasses = "w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const labelClasses = "block mb-2 text-sm font-medium text-gray-500";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <FileImage className="h-5 w-5 text-blue-600" />
          Upload Handwritten Notes
        </CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          Upload photos or scans of handwritten notes. Text will be automatically extracted using OCR.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Duplicate File Warning */}
          {duplicateInfo && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-amber-800">{duplicateInfo.message}</h4>
                  {duplicateInfo.existing && (
                    <div className="mt-2 text-sm text-amber-700">
                      <p><strong>Existing file:</strong> {duplicateInfo.existing.title}</p>
                      <p><strong>Category:</strong> {duplicateInfo.existing.category}</p>
                      <p><strong>Uploaded:</strong> {new Date(duplicateInfo.existing.created_at).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleForceUpload}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Replace Existing
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleCancelDuplicate}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {message.text && !duplicateInfo && (
            <div className={cn(
              "flex items-center gap-2 p-3 rounded-md font-medium",
              message.type === 'success' && "bg-green-500/20 text-green-600",
              message.type === 'error' && "bg-red-500/20 text-red-600",
              message.type === 'warning' && "bg-amber-500/20 text-amber-600"
            )}>
              {message.type === 'success' ? <Check className="h-4 w-4" /> :
               message.type === 'warning' ? <AlertTriangle className="h-4 w-4" /> :
               <X className="h-4 w-4" />}
              {message.text}
            </div>
          )}

          {/* File Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => !preview && fileInputRef.current?.click()}
            className={cn(
              "relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
              preview ? "border-blue-300 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
            )}
          >
            {preview ? (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-48 max-w-full rounded-lg shadow-md mx-auto"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFile();
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600">{file?.name}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <FileImage className="h-12 w-12 text-gray-400 mx-auto" />
                <p className="text-gray-600">Drag and drop an image here, or click to select</p>
                <p className="text-sm text-gray-400">Supports: JPG, PNG, BMP, TIFF, WebP</p>
              </div>
            )}
            {/* Hidden file input - only triggered programmatically */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/bmp,image/tiff,image/webp"
              className="hidden"
            />
            {!preview && (
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Select Image
              </Button>
            )}
          </div>

          {/* Image Enhancement Option */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enhance_image"
              name="enhance_image"
              checked={formData.enhance_image}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="enhance_image" className="text-sm text-gray-600">
              Enhance image for better OCR (recommended for low-quality scans)
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className={labelClasses}>Title *</label>
              <Input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter notes title"
                required
              />
            </div>

            <div>
              <label htmlFor="topic" className={labelClasses}>Topic</label>
              <Input
                type="text"
                id="topic"
                name="topic"
                value={formData.topic}
                onChange={handleInputChange}
                placeholder="e.g., Calculus, Data Structures"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className={labelClasses}>Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of the notes"
              rows="2"
              className={cn(inputClasses, "resize-y min-h-[60px]")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className={labelClasses}>Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className={inputClasses}
              >
                <option value="theory">Theory</option>
                <option value="lab">Lab</option>
              </select>
            </div>

            <div>
              <label htmlFor="week" className={labelClasses}>Week</label>
              <Input
                type="number"
                id="week"
                name="week"
                value={formData.week}
                onChange={handleInputChange}
                placeholder="e.g., 1"
                min="1"
                max="52"
              />
            </div>
          </div>

          <div>
            <label htmlFor="tags" className={labelClasses}>Tags (comma-separated)</label>
            <Input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="e.g., lecture-notes, exam-prep, formulas"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={uploading || !file}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing with OCR...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Extract Text
                </>
              )}
            </Button>
            {ocrResult && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOcrResult(null);
                  clearFile();
                  setMessage({ type: '', text: '' });
                  setFormData({
                    title: '',
                    description: '',
                    category: 'theory',
                    topic: '',
                    week: '',
                    tags: '',
                    enhance_image: true
                  });
                }}
              >
                Upload New
              </Button>
            )}
          </div>

          {/* OCR Result Display */}
          {ocrResult && (
            <div className="mt-4 space-y-4">
              {/* Metadata */}
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-700 flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4" />
                  Extraction Complete
                </h4>
                <div className="text-sm text-green-600 flex flex-wrap gap-4">
                  <span><strong>{ocrResult.text_length}</strong> characters</span>
                  <span><strong>{(ocrResult.confidence * 100).toFixed(0)}%</strong> confidence</span>
                  <span>Engine: <strong>{ocrResult.engine}</strong></span>
                  {ocrResult.structured && <span className="text-green-700 font-medium">Structured</span>}
                </div>
              </div>

              {/* Extracted Text Preview */}
              {ocrResult.text && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
                    <h4 className="font-medium text-gray-700">Extracted Academic Content</h4>
                    <div className="flex items-center gap-3">
                      {/* View Toggle */}
                      <div className="flex bg-gray-200 rounded-md p-0.5">
                        <button
                          type="button"
                          onClick={() => setShowRendered(true)}
                          className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                            showRendered ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600'
                          }`}
                        >
                          <FileText className="h-3 w-3" />
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowRendered(false)}
                          className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                            !showRendered ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600'
                          }`}
                        >
                          <Code className="h-3 w-3" />
                          Markdown
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(ocrResult.text);
                          alert('Copied to clipboard!');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="p-4 bg-white max-h-[500px] overflow-y-auto">
                    {showRendered ? (
                      <div className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded">
                        <ReactMarkdown>{ocrResult.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                        {ocrResult.text}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

export default HandwrittenNotesUpload;
