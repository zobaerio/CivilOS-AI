
CREATE POLICY "Admins view all profiles" ON public.profiles
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all projects" ON public.projects
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
