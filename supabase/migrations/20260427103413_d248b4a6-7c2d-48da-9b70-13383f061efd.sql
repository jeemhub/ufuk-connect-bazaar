-- Create bucket for quote attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('quote-attachments', 'quote-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Add attachments column to quote_requests (array of public URLs)
ALTER TABLE public.quote_requests
ADD COLUMN IF NOT EXISTS attachments text[] NOT NULL DEFAULT '{}';

-- Storage RLS policies for quote-attachments bucket
CREATE POLICY "Quote attachments: public read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'quote-attachments');

CREATE POLICY "Quote attachments: anyone can upload"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'quote-attachments');

CREATE POLICY "Quote attachments: admin delete"
ON storage.objects
FOR DELETE
USING (bucket_id = 'quote-attachments' AND public.has_role(auth.uid(), 'admin'));
