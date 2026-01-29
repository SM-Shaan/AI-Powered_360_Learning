import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadForm from '../components/UploadForm';
import ContentCard from '../components/ContentCard';

function Upload() {
  const navigate = useNavigate();
  const [uploadedContent, setUploadedContent] = useState([]);

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

      <UploadForm onUploadSuccess={handleUploadSuccess} />

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
