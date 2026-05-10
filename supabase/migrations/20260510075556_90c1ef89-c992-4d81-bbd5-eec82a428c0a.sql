CREATE POLICY "Quotes: admin or sales delete"
ON public.quote_requests
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_sales_perm(auth.uid(), 'can_manage_quotes'::text));