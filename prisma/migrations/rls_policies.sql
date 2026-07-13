-- ═══════════════════════════════════════════════════════════════════════════════
-- Supabase RLS Policies — Organization-level data isolation
-- Run this in Supabase SQL Editor after deploying schema
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Helper function: get organizationId for the current JWT user ─────────────

CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_org_id TEXT;
BEGIN
  SELECT organization_id INTO v_org_id
  FROM public.users
  WHERE supabase_id = auth.uid()::TEXT
    AND deleted_at IS NULL
  LIMIT 1;
  RETURN v_org_id;
END;
$$;

-- ── Enable RLS on all multi-tenant tables ────────────────────────────────────

ALTER TABLE public.organizations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_nodes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_edges     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_tags       ENABLE ROW LEVEL SECURITY;

-- ── Organizations ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "org_select" ON public.organizations;
CREATE POLICY "org_select" ON public.organizations
  FOR SELECT USING (id = public.get_user_organization_id());

-- ── Users ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "users_select" ON public.users;
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (organization_id = public.get_user_organization_id());

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (supabase_id = auth.uid()::TEXT);

-- ── Equipment ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "equipment_org" ON public.equipment;
CREATE POLICY "equipment_org" ON public.equipment
  FOR ALL USING (organization_id = public.get_user_organization_id());

-- ── Documents ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "documents_org" ON public.documents;
CREATE POLICY "documents_org" ON public.documents
  FOR ALL USING (organization_id = public.get_user_organization_id());

-- Document chunks (join through document)
DROP POLICY IF EXISTS "chunks_org" ON public.document_chunks;
CREATE POLICY "chunks_org" ON public.document_chunks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id
        AND d.organization_id = public.get_user_organization_id()
    )
  );

-- ── Maintenance ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "maintenance_org" ON public.maintenance_records;
CREATE POLICY "maintenance_org" ON public.maintenance_records
  FOR ALL USING (organization_id = public.get_user_organization_id());

-- ── Incidents ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "incidents_org" ON public.incidents;
CREATE POLICY "incidents_org" ON public.incidents
  FOR ALL USING (organization_id = public.get_user_organization_id());

-- ── Inspections ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "inspections_org" ON public.inspections;
CREATE POLICY "inspections_org" ON public.inspections
  FOR ALL USING (organization_id = public.get_user_organization_id());

-- ── Compliance ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "compliance_org" ON public.compliance_records;
CREATE POLICY "compliance_org" ON public.compliance_records
  FOR ALL USING (organization_id = public.get_user_organization_id());

-- ── Conversations & Messages ──────────────────────────────────────────────────

DROP POLICY IF EXISTS "conversations_org" ON public.conversations;
CREATE POLICY "conversations_org" ON public.conversations
  FOR ALL USING (organization_id = public.get_user_organization_id());

DROP POLICY IF EXISTS "messages_org" ON public.messages;
CREATE POLICY "messages_org" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND c.organization_id = public.get_user_organization_id()
    )
  );

-- ── Bookings ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "bookings_org" ON public.bookings;
CREATE POLICY "bookings_org" ON public.bookings
  FOR ALL USING (organization_id = public.get_user_organization_id());

-- ── Notifications ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
CREATE POLICY "notifications_own" ON public.notifications
  FOR ALL USING (
    organization_id = public.get_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = user_id
        AND u.supabase_id = auth.uid()::TEXT
    )
  );

-- ── Knowledge Graph ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "knowledge_nodes_org" ON public.knowledge_nodes;
CREATE POLICY "knowledge_nodes_org" ON public.knowledge_nodes
  FOR ALL USING (organization_id = public.get_user_organization_id());

DROP POLICY IF EXISTS "knowledge_edges_org" ON public.knowledge_edges;
CREATE POLICY "knowledge_edges_org" ON public.knowledge_edges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.knowledge_nodes n
      WHERE n.id = from_node_id
        AND n.organization_id = public.get_user_organization_id()
    )
  );

-- ── Audit Logs ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "audit_logs_org" ON public.audit_logs;
CREATE POLICY "audit_logs_org" ON public.audit_logs
  FOR SELECT USING (organization_id = public.get_user_organization_id());

-- ── Tags ──────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "tags_org" ON public.tags;
CREATE POLICY "tags_org" ON public.tags
  FOR ALL USING (organization_id = public.get_user_organization_id());

DROP POLICY IF EXISTS "document_tags_org" ON public.document_tags;
CREATE POLICY "document_tags_org" ON public.document_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id
        AND d.organization_id = public.get_user_organization_id()
    )
  );

-- ── Storage: avatars bucket ───────────────────────────────────────────────────

-- Create the bucket if it doesn't exist (run via Supabase dashboard or API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
-- ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "avatars_select" ON storage.objects;
CREATE POLICY "avatars_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_insert" ON storage.objects;
CREATE POLICY "avatars_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND name = 'avatars/' || auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "avatars_update" ON storage.objects;
CREATE POLICY "avatars_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND name = 'avatars/' || auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "avatars_delete" ON storage.objects;
CREATE POLICY "avatars_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND name = 'avatars/' || auth.uid()::TEXT
  );

-- ── Industrial Documents bucket ───────────────────────────────────────────────

DROP POLICY IF EXISTS "docs_select" ON storage.objects;
CREATE POLICY "docs_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'industrial-documents'
    AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "docs_insert" ON storage.objects;
CREATE POLICY "docs_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'industrial-documents'
    AND auth.uid() IS NOT NULL
  );
