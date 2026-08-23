import type { Metadata } from 'next'
import { LegalShell } from '@/app/legal/legal-shell'

export const metadata: Metadata = {
  title: 'Mentions légales — PrivaDoc',
  description: "Éditeur, hébergeur et informations légales du service PrivaDoc.",
}

export default function MentionsLegalesPage() {
  return (
    <LegalShell eyebrow="Informations légales" title="Mentions légales" updated="23 août 2026">
      <h2>Éditeur du site</h2>
      <ul>
        <li>
          <strong>Éditeur&nbsp;:</strong> [À COMPLÉTER : nom / raison sociale]
        </li>
        <li>
          <strong>Statut&nbsp;:</strong> [À COMPLÉTER : ex. auto-entrepreneur, SAS, SARL…]
        </li>
        <li>
          <strong>Adresse&nbsp;:</strong> [À COMPLÉTER : adresse postale]
        </li>
        <li>
          <strong>SIREN / SIRET&nbsp;:</strong> [À COMPLÉTER, le cas échéant]
        </li>
        <li>
          <strong>Contact&nbsp;:</strong>{' '}
          <a href="mailto:[À COMPLÉTER : email de contact]">[À COMPLÉTER : email de contact]</a>
        </li>
      </ul>

      <h2>Directeur de la publication</h2>
      <p>[À COMPLÉTER : nom du responsable de la publication]</p>

      <h2>Hébergement</h2>
      <p>L&apos;application et les données sont hébergées au sein de l&apos;Union européenne&nbsp;:</p>
      <ul>
        <li>
          <strong>Application web&nbsp;:</strong> Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789,
          États-Unis — déploiement en région Europe.{' '}
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>
        </li>
        <li>
          <strong>Base de données et stockage des documents&nbsp;:</strong> Supabase — région Europe
          (Stockholm, Suède).{' '}
          <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a>
        </li>
      </ul>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des éléments du site (marque, logo, textes, interface) est protégé. Les documents
        téléversés restent la propriété de leurs titulaires respectifs.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Le traitement de vos données personnelles est décrit dans notre{' '}
        <a href="/confidentialite">politique de confidentialité</a>.
      </p>

      <h2>Contact</h2>
      <p>
        Pour toute question, écrivez à{' '}
        <a href="mailto:[À COMPLÉTER : email de contact]">[À COMPLÉTER : email de contact]</a>.
      </p>
    </LegalShell>
  )
}
