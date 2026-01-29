import { useState } from 'react';
import { Upload, X, Check } from 'lucide-react';
import { contentAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

function UploadForm({ onUploadSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'theory',
    content_type: 'pdf',
    topic: '',
    week: '',
    tags: ''
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!formData.title) {
        setFormData(prev => ({
          ...prev,
          title: selectedFile.name.replace(/\.[^/.]+$/, '')
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file to upload' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const data = new FormData();
      data.append('file', file);
      Object.entries(formData).forEach(([key, value]) => {
        if (value) data.append(key, value);
      });

      const response = await contentAPI.upload(data);

      setMessage({ type: 'success', text: 'Content uploaded successfully!' });
      setFormData({
        title: '',
        description: '',
        category: 'theory',
        content_type: 'pdf',
        topic: '',
        week: '',
        tags: ''
      });
      setFile(null);

      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';

      onUploadSuccess && onUploadSuccess(response.data.data);
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to upload content'
      });
    } finally {
      setUploading(false);
    }
  };

  const inputClasses = "w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500";
  const labelClasses = "block mb-2 text-sm font-medium text-gray-500";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Upload Course Material</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {message.text && (
            <div className={cn(
              "flex items-center gap-2 p-3 rounded-md font-medium",
              message.type === 'success' && "bg-emerald-500/20 text-emerald-600",
              message.type === 'error' && "bg-red-500/20 text-red-600"
            )}>
              {message.type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              {message.text}
            </div>
          )}

          <div>
            <label htmlFor="file-input" className={labelClasses}>File *</label>
            <input
              type="file"
              id="file-input"
              onChange={handleFileChange}
              accept=".pdf,.ppt,.pptx,.txt,.md,.py,.js,.ts,.java,.c,.cpp,.h,.cs,.go,.rs,.ipynb,.json,.html,.css"
              className={cn(
                inputClasses,
                "file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-500 file:text-white hover:file:bg-emerald-600 file:cursor-pointer cursor-pointer"
              )}
            />
            {file && <span className="text-sm text-gray-500 mt-1 block">{file.name}</span>}
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
                placeholder="Enter content title"
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
                placeholder="e.g., Machine Learning"
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
              placeholder="Brief description of the content"
              rows="3"
              className={cn(inputClasses, "resize-y min-h-[80px]")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <label htmlFor="content_type" className={labelClasses}>Content Type *</label>
              <select
                id="content_type"
                name="content_type"
                value={formData.content_type}
                onChange={handleInputChange}
                required
                className={inputClasses}
              >
                <option value="slides">Slides</option>
                <option value="pdf">PDF</option>
                <option value="code">Code</option>
                <option value="notes">Notes</option>
                <option value="reference">Reference</option>
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
              placeholder="e.g., neural-networks, deep-learning, python"
            />
          </div>

          <Button
            type="submit"
            disabled={uploading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {uploading ? (
              <>Uploading...</>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Content
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default UploadForm;
