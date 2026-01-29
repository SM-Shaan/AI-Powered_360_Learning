import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadForm from '../components/UploadForm';
import HandwrittenNotesUpload from '../components/HandwrittenNotesUpload';
import ContentCard from '../components/ContentCard';

function Upload() {
  const navigate = useNavigate();
  const [uploadedContent, setUploadedContent] = useState([]);
  const [activeTab, setActiveTab] = useState('files'); // 'files' or 'handwritten'

  const handleUploadSuccess = (content) => {
    setUploadedContent(prev => [content, ...prev]);
  };

  const handleDelete = (id) => {
    setUploadedContent(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Upload Course Materials</h1>
        <p className="text-gray-500">Add new content for students to access</p>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('files')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'files'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Documents & Code
        </button>
        <button
          onClick={() => setActiveTab('handwritten')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'handwritten'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Handwritten Notes (OCR)
        </button>
      </div>

      {/* Upload Forms */}
      {activeTab === 'files' ? (
        <UploadForm onUploadSuccess={handleUploadSuccess} />
      ) : (
        <HandwrittenNotesUpload onUploadSuccess={handleUploadSuccess} />
      )}

      {uploadedContent.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Recently Uploaded</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {uploadedContent.map(content => (
              <ContentCard
                key={content.id}
                content={content}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Upload;
