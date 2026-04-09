import React, { forwardRef, useCallback } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const modules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

const formats = ['header', 'bold', 'italic', 'list', 'link'];

const RichTextEditor = forwardRef<ReactQuill, RichTextEditorProps>(
  ({ value, onChange, placeholder }, ref) => {
    const handleChange = useCallback(
      (content: string) => {
        // Quill returns <p><br></p> for empty content
        const cleaned = content === '<p><br></p>' ? '' : content;
        onChange(cleaned);
      },
      [onChange]
    );

    return (
      <div className="rich-text-editor">
        <ReactQuill
          ref={ref}
          theme="snow"
          value={value}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder || 'Digite a descrição...'}
        />
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
