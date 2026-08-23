import type { Metadata } from 'next'
import { LegalShell } from '@/app/legal/legal-shell'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — PrivaDoc',
  description:
    "Comment PrivaDoc collecte, utilise et protège vos données personnelles, et comment exercer vos droits (RGPD).",
}

export default function ConfidentialitePage() {
  return (
    <LegalShell eyebrow="Vos données" title="Politique de confidentialité" updated="23 août 2026">
      <p>
        La présente politique explique quelles données personnelles PrivaDoc collecte, pourquoi, comment
        elles sont protégées, et les droits dont vous disposez conformément au Règlement général sur la
        protection des données (RGPD).
      </p>

      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement des données est&nbsp;: <strong>[À COMPLÉTER : nom / raison sociale de
        l&apos;éditeur]</strong>, joignable à l&apos;adresse{' '}
        <a href="mailto:[À COMPLÉTER : email de contact]">[À COMPLÉTER : email de contact]</a>.
      </p>

      <h2>2. Données que nous collectons</h2>
      <ul>
        <li>
          <strong>Données de compte&nbsp;:</strong> adresse e-mail, nom ou nom de cabinet, profession (pour
          les comptes professionnels).
        </li>
        <li>
          <strong>Documents et métadonnées&nbsp;:</strong> les fichiers que vous téléversez ou que vos
          clients déposent, ainsi que leur titre, taille, type et date.
        </li>
        <li>
          <strong>Données liées aux demandes de pièces&nbsp;:</strong> intitulés des pièces demandées,
          statut, échéances, et coordonnées des destinataires que vous saisissez.
        </li>
        <li>
          <strong>Données techniques&nbsp;:</strong> données strictement nécessaires au fonctionnement du
          service (session d&apos;authentification, journaux techniques de sécurité).
        </li>
      </ul>

      <h2>3. Finalités et bases légales</h2>
      <ul>
        <li>
          <strong>Fourniture du service</strong> (création de compte, stockage et partage de documents,
          demandes de pièces)&nbsp;: exécution du contrat.
        </li>
        <li>
          <strong>Notifications</strong> (e-mails de dépôt, d&apos;invitation, de suivi)&nbsp;: exécution du
          contrat et intérêt légitime à assurer le bon déroulement du service.
        </li>
        <li>
          <strong>Sécurité et prévention des abus</strong>&nbsp;: intérêt légitime.
        </li>
      </ul>

      <h2>4. Hébergement et sous-traitants</h2>
      <p>
        Vos données sont hébergées <strong>au sein de l&apos;Union européenne</strong>. Nous faisons appel
        aux sous-traitants suivants&nbsp;:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> — base de données et stockage des documents, région Europe (Stockholm,
          Suède).
        </li>
        <li>
          <strong>Vercel</strong> — hébergement de l&apos;application web, région Europe.
        </li>
        <li>
          <strong>Service d&apos;envoi d&apos;e-mails</strong> — acheminement des notifications
          transactionnelles.
        </li>
      </ul>
      <p>
        Vos documents ne sont jamais utilisés à des fins publicitaires ni pour entraîner des modèles
        d&apos;intelligence artificielle.
      </p>

      <h2>5. Durée de conservation</h2>
      <p>
        Vos données sont conservées tant que votre compte est actif. Vous pouvez supprimer vos documents à
        tout moment. À la fermeture du compte, vos données sont supprimées dans un délai raisonnable, sauf
        obligation légale de conservation.
      </p>

      <h2>6. Sécurité</h2>
      <p>
        L&apos;accès aux données est cloisonné par utilisateur au niveau de la base de données, les échanges
        sont chiffrés en transit (HTTPS), et les liens de partage peuvent expirer et être révoqués.
      </p>

      <h2>7. Vos droits</h2>
      <p>Conformément au RGPD, vous disposez des droits suivants&nbsp;:</p>
      <ul>
        <li>droit d&apos;accès à vos données&nbsp;;</li>
        <li>droit de rectification&nbsp;;</li>
        <li>droit à l&apos;effacement&nbsp;;</li>
        <li>droit à la limitation du traitement&nbsp;;</li>
        <li>droit à la portabilité&nbsp;;</li>
        <li>droit d&apos;opposition.</li>
      </ul>
      <p>
        Pour exercer ces droits, écrivez à{' '}
        <a href="mailto:[À COMPLÉTER : email de contact]">[À COMPLÉTER : email de contact]</a>. Vous pouvez
        également introduire une réclamation auprès de la{' '}
        <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">CNIL</a>.
      </p>

      <h2>8. Cookies</h2>
      <p>
        PrivaDoc n&apos;utilise que des cookies strictement nécessaires au fonctionnement du service
        (maintien de votre session). Aucun cookie publicitaire ni de suivi tiers n&apos;est déposé.
      </p>

      <h2>9. Modifications</h2>
      <p>
        Cette politique peut évoluer. En cas de changement important, la date de mise à jour ci-dessus sera
        modifiée.
      </p>
    </LegalShell>
  )
}
