-- =============================================================================
-- DEMO SEED DATA — for local development only. Do not run against production.
-- Run with: supabase db reset (applies migrations then this file automatically)
--
-- Only the "Plomberie" trade ships active initially (per the "start with
-- plumbers, scale to other trades later" launch plan) — the other trades
-- (Électricité, Peinture, Chauffage & Climatisation, Travaux généraux)
-- already exist as inactive rows from migration 0012. Activating one later
-- is a single UPDATE (or a click in /admin once that toggle is added),
-- plus adding services for it — no schema change needed.
-- =============================================================================

insert into cities (name, slug, postcode_prefixes) values
  ('Paris', 'paris', array['75']),
  ('Lyon', 'lyon', array['69']),
  ('Marseille', 'marseille', array['13']),
  ('Toulouse', 'toulouse', array['31']),
  ('Bordeaux', 'bordeaux', array['33']),
  ('Lille', 'lille', array['59']),
  ('Nantes', 'nantes', array['44']),
  ('Nice', 'nice', array['06'])
on conflict (slug) do nothing;

insert into services (name, slug, description, category, default_pricing_type, sort_order, trade_id)
select v.name, v.slug, v.description, v.category, v.default_pricing_type::pricing_type, v.sort_order,
       (select id from trades where slug_singular = 'plombier')
from (values
  ('Réparation de fuite', 'reparation-fuite', 'Intervention pour réparer une fuite d''eau standard.', 'reparation', 'fixed', 1),
  ('Débouchage', 'debouchage', 'Débouchage de canalisations, éviers, WC.', 'reparation', 'fixed', 2),
  ('Réparation de WC', 'reparation-wc', 'Réparation ou remplacement de mécanisme de chasse d''eau.', 'reparation', 'fixed', 3),
  ('Installation de robinet', 'installation-robinet', 'Installation d''un robinet neuf.', 'installation', 'fixed', 4),
  ('Remplacement de robinet', 'remplacement-robinet', 'Remplacement d''un robinet existant.', 'installation', 'fixed', 5),
  ('Réparation de douche', 'reparation-douche', 'Réparation de robinetterie ou de bac de douche.', 'reparation', 'fixed', 6),
  ('Réparation de lavabo', 'reparation-lavabo', 'Réparation de lavabo ou vasque.', 'reparation', 'fixed', 7),
  ('Réparation de canalisation', 'reparation-canalisation', 'Réparation de canalisation endommagée.', 'reparation', 'quote', 8),
  ('Recherche de fuite', 'recherche-fuite', 'Détection de fuite non localisée.', 'diagnostic', 'quote', 9),
  ('Installation de chauffe-eau', 'installation-chauffe-eau', 'Installation d''un chauffe-eau neuf.', 'installation', 'quote', 10),
  ('Réparation de chauffe-eau', 'reparation-chauffe-eau', 'Réparation d''un chauffe-eau existant.', 'reparation', 'quote', 11),
  ('Remplacement de tuyaux', 'remplacement-tuyaux', 'Remplacement de tuyauterie.', 'installation', 'quote', 12),
  ('Plomberie salle de bain', 'plomberie-salle-de-bain', 'Travaux de plomberie complets en salle de bain.', 'installation', 'quote', 13),
  ('Intervention d''urgence', 'intervention-urgence', 'Intervention rapide pour urgence plomberie.', 'urgence', 'fixed', 14),
  ('Autre', 'autre', 'Autre besoin de plomberie non listé.', 'autre', 'quote', 15)
) as v(name, slug, description, category, default_pricing_type, sort_order)
on conflict (slug) do nothing;

-- NOTE: demo professional accounts are NOT seeded here because they must
-- exist in auth.users first (Supabase Auth can't be seeded via plain SQL
-- inserts). Create one manually via the sign-up form at /inscription/professionnel
-- for local testing, then use /admin/professionnels to approve/activate it.
