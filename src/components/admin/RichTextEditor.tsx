import { useEffect, useRef, useState, useCallback } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Image as ImageIcon, Undo2, Redo2,
  Palette, RemoveFormatting, Code,
} from "lucide-react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";

type Props = {
  value: string;
  onChange: (html: string) => void;
  dir?: "ltr" | "rtl";
  placeholder?: string;
  minHeight?: number;
  bucket?: string; // storage bucket for inline images
};

const SANITIZE_OPTS = {
  ADD_ATTR: ["target", "rel", "style"],
  ALLOWED_TAGS: [
    "p","br","b","strong","i","em","u","s","strike","span","div",
    "h1","h2","h3","h4","h5","h6","blockquote","ul","ol","li",
    "a","img","figure","figcaption","hr","pre","code",
    "table","thead","tbody","tr","th","td",
  ],
} as const;

const clean = (html: string): string =>
  DOMPurify.sanitize(html, SANITIZE_OPTS as never) as unknown as string;

export function RichTextEditor({
  value, onChange, dir = "ltr", placeholder, minHeight = 280, bucket = "project-images",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  // Initialize once + when external value changes drastically
  useEffect(() => {
    if (!ref.current) return;
    if (ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = useCallback((cmd: string, val?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, val);
    if (ref.current) onChange(DOMPurify.sanitize(ref.current.innerHTML, SANITIZE_OPTS));
  }, [onChange]);

  const handleInput = () => {
    if (!ref.current) return;
    onChange(DOMPurify.sanitize(ref.current.innerHTML, SANITIZE_OPTS));
  };

  const insertHTML = (html: string) => {
    ref.current?.focus();
    document.execCommand("insertHTML", false, html);
    if (ref.current) onChange(DOMPurify.sanitize(ref.current.innerHTML, SANITIZE_OPTS));
  };

  const onAddLink = () => {
    const url = prompt(dir === "rtl" ? "أدخل الرابط (https://...)" : "Enter URL");
    if (!url) return;
    exec("createLink", url);
    // Add target=_blank to the just-created link
    setTimeout(() => {
      ref.current?.querySelectorAll("a").forEach((a) => {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      });
      if (ref.current) onChange(DOMPurify.sanitize(ref.current.innerHTML, SANITIZE_OPTS));
    }, 0);
  };

  const onPickImage = () => fileRef.current?.click();

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user?.id ?? "admin"}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type });
      if (error) {
        toast.error(error.message);
        return null;
      }
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    } finally {
      setUploading(false);
    }
  };

  const onImageFile = async (file: File) => {
    const url = await uploadImage(file);
    if (url) {
      insertHTML(
        `<figure style="margin:1rem 0;text-align:center"><img src="${url}" alt="" style="max-width:100%;height:auto;border-radius:0.5rem" /></figure><p><br/></p>`
      );
    }
  };

  const onPaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const it of Array.from(items)) {
      if (it.type.startsWith("image/")) {
        e.preventDefault();
        const file = it.getAsFile();
        if (file) await onImageFile(file);
        return;
      }
    }
  };

  const setColor = () => {
    const c = prompt(dir === "rtl" ? "اختر لون النص (مثال: #2563eb)" : "Pick text color (e.g. #2563eb)", "#2563eb");
    if (c) exec("foreColor", c);
  };

  const Btn = ({ onClick, title, children, active }: { onClick: () => void; title: string; children: React.ReactNode; active?: boolean }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`h-8 w-8 p-0 ${active ? "bg-secondary" : ""}`}
    >
      {children}
    </Button>
  );

  return (
    <div className="rounded-md border border-input bg-background overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 p-1.5" dir="ltr">
        <select
          onChange={(e) => { exec("formatBlock", e.target.value); e.currentTarget.value = ""; }}
          className="mr-1 h-8 rounded border border-input bg-background px-2 text-xs"
          defaultValue=""
        >
          <option value="" disabled>{dir === "rtl" ? "نمط" : "Style"}</option>
          <option value="p">{dir === "rtl" ? "فقرة" : "Paragraph"}</option>
          <option value="h1">H1</option>
          <option value="h2">H2</option>
          <option value="h3">H3</option>
          <option value="blockquote">{dir === "rtl" ? "اقتباس" : "Quote"}</option>
          <option value="pre">{dir === "rtl" ? "كود" : "Code"}</option>
        </select>
        <Btn onClick={() => exec("bold")} title="Bold (Ctrl+B)"><Bold className="h-4 w-4" /></Btn>
        <Btn onClick={() => exec("italic")} title="Italic"><Italic className="h-4 w-4" /></Btn>
        <Btn onClick={() => exec("underline")} title="Underline"><UnderlineIcon className="h-4 w-4" /></Btn>
        <Btn onClick={() => exec("strikeThrough")} title="Strike"><Strikethrough className="h-4 w-4" /></Btn>
        <Btn onClick={setColor} title="Color"><Palette className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-border" />
        <Btn onClick={() => exec("formatBlock", "h1")} title="H1"><Heading1 className="h-4 w-4" /></Btn>
        <Btn onClick={() => exec("formatBlock", "h2")} title="H2"><Heading2 className="h-4 w-4" /></Btn>
        <Btn onClick={() => exec("formatBlock", "h3")} title="H3"><Heading3 className="h-4 w-4" /></Btn>
        <Btn onClick={() => exec("formatBlock", "blockquote")} title="Quote"><Quote className="h-4 w-4" /></Btn>
        <Btn onClick={() => exec("formatBlock", "pre")} title="Code block"><Code className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-border" />
        <Btn onClick={() => exec("insertUnorderedList")} title="Bulleted list"><List className="h-4 w-4" /></Btn>
        <Btn onClick={() => exec("insertOrderedList")} title="Numbered list"><ListOrdered className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-border" />
        <Btn onClick={() => exec("justifyLeft")} title="Left"><AlignLeft className="h-4 w-4" /></Btn>
        <Btn onClick={() => exec("justifyCenter")} title="Center"><AlignCenter className="h-4 w-4" /></Btn>
        <Btn onClick={() => exec("justifyRight")} title="Right"><AlignRight className="h-4 w-4" /></Btn>
        <Btn onClick={() => exec("justifyFull")} title="Justify"><AlignJustify className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-border" />
        <Btn onClick={onAddLink} title="Insert link"><LinkIcon className="h-4 w-4" /></Btn>
        <Btn onClick={onPickImage} title="Insert image"><ImageIcon className="h-4 w-4" /></Btn>
        <Btn onClick={() => exec("removeFormat")} title="Clear formatting"><RemoveFormatting className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-border" />
        <Btn onClick={() => exec("undo")} title="Undo"><Undo2 className="h-4 w-4" /></Btn>
        <Btn onClick={() => exec("redo")} title="Redo"><Redo2 className="h-4 w-4" /></Btn>
        {uploading && <span className="ml-2 text-xs text-muted-foreground">…</span>}
      </div>
      <div
        ref={ref}
        dir={dir}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={onPaste}
        data-placeholder={placeholder}
        className="prose prose-sm max-w-none px-4 py-3 focus:outline-none [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded [&_a]:text-primary [&_a]:underline [&_img]:rounded-md [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ps-6 [&_ol]:ps-6 empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
        style={{ minHeight }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onImageFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE_OPTS);
}
