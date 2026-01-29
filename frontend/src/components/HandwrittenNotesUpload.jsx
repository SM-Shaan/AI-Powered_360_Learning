import { useState, useRef } from 'react';
import { Upload, X, Check, FileImage, Loader2, Eye } from 'lucide-react';
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage({ type: 'error', text: 'Please select an image file to upload' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });
    setOcrResult(null);

    try {
      const data = new FormData();
      data.append('file', file);
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null) {
          data.append(key, value);
        }
      });

      const response = await contentAPI.uploadHandwrittenNotes(data);

      setMessage({ type: 'success', text: 'Handwritten notes uploaded and processed successfully!' });

      // Show OCR result
      if (response.data?.data?.ocr_result) {
        setOcrResult(response.data.data.ocr_result);
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'theory',
        topic: '',
        week: '',
        tags: '',
        enhance_image: true
      });
      clearFile();

      onUploadSuccess && onUploadSuccess(response.data.data);
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || error.response?.data?.error || 'Failed to upload handwritten notes'
      });
    } finally {
      setUploading(false);
    }
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
          {message.text && (
            <div className={cn(
              "flex items-center gap-2 p-3 rounded-md font-medium",
              message.type === 'success' && "bg-green-500/20 text-green-600",
              message.type === 'error' && "bg-red-500/20 text-red-600"
            )}>
              {message.type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              {message.text}
            </div>
          )}

          {/* File Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
              preview ? "border-blue-300 bg-blue-50" : "border-gray-300 hover:border-blue-400"
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
                    onClick={clearFile}
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
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/bmp,image/tiff,image/webp"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              style={{ position: 'absolute', top: 0, left: 0 }}
            />
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
                onClick={() => fileInputRef.current?.click()}
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

          <Button
            type="submit"
            disabled={uploading || !file}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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

          {/* OCR Result Display */}
          {ocrResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-medium text-gray-700 flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4" />
                OCR Result
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Characters extracted:</span> {ocrResult.text_length}</p>
                <p><span className="font-medium">Confidence:</span> {(ocrResult.confidence * 100).toFixed(1)}%</p>
                <p><span className="font-medium">Engine:</span> {ocrResult.engine}</p>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

export default HandwrittenNotesUpload;
