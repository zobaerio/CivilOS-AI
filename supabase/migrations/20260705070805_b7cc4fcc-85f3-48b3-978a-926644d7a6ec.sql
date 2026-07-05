
CREATE POLICY "Members read project docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'project-documents' AND public.is_project_member((storage.foldername(name))[1]::uuid, auth.uid()));
CREATE POLICY "Engineers upload project docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-documents' AND public.get_project_role((storage.foldername(name))[1]::uuid, auth.uid()) IN ('admin','engineer'));
CREATE POLICY "Admins delete project docs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'project-documents' AND public.get_project_role((storage.foldername(name))[1]::uuid, auth.uid()) = 'admin');
