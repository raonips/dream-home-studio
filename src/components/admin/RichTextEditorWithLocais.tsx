import { forwardRef, useCallback, useRef, useState, useImperativeHandle } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import LocalSelectorDialog from "./LocalSelectorDialog";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const modules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ["bold", "italic"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const formats = ["header", "bold", "italic", "list", "link"];

const RichTextEditorWithLocais = forwardRef<ReactQuill, Props>(
  ({ value, onChange, placeholder }, ref) => {
    const quillRef = useRef<ReactQuill>(null);
    const [selectorOpen, setSelectorOpen] = useState(false);

    useImperativeHandle(ref, () => quillRef.current as ReactQuill);

    const handleChange = useCallback(
      (content: string) => {
        const cleaned = content === "<p><br></p>" ? "" : content;
        onChange(cleaned);
      },
      [onChange]
    );

    const handleInsertLocal = (id: string, nome: string) => {
      const editor = quillRef.current?.getEditor();
      if (!editor) return;
      const range = editor.getSelection(true);
      const idx = range ? range.index : editor.getLength();
      // Insere o marcador como texto em parágrafo próprio para o renderer reconhecer
      editor.insertText(idx, `\n[LOCAL_CARD: ${id}]\n`, "user");
      editor.setSelection(idx + `\n[LOCAL_CARD: ${id}]\n`.length, 0);
    };

    return (
      <div className="rich-text-editor space-y-2">
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setSelectorOpen(true)}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Inserir Card de Local
          </Button>
        </div>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder || "Digite a descrição..."}
        />
        <LocalSelectorDialog
          open={selectorOpen}
          onOpenChange={setSelectorOpen}
          onSelect={handleInsertLocal}
        />
      </div>
    );
  }
);

RichTextEditorWithLocais.displayName = "RichTextEditorWithLocais";

export default RichTextEditorWithLocais;
