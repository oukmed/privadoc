// Static UI translations. One flat key → string map per locale. Server code uses
// getT() (./server), client components use useT() (./client); both read the same
// dictionaries here. Dynamic user content (document titles, etc.) is NOT translated
// — it's private per-user data. Add new surfaces as new key groups below.

export const LOCALES = ['fr', 'es', 'en', 'de'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'fr'

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

/** Pick the best supported locale from an Accept-Language header, else the default. */
export function pickLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE
  for (const part of acceptLanguage.split(',')) {
    const base = part.trim().split(';')[0].split('-')[0].toLowerCase()
    if (isLocale(base)) return base
  }
  return DEFAULT_LOCALE
}

type Dict = Record<string, string>

const fr: Dict = {
  'auth.signup.title': 'Créer ton compte',
  'auth.signup.subtitle': 'Commence à stocker tes documents en privé.',
  'auth.signup.submit': 'Créer le compte',
  'auth.login.title': 'Bon retour',
  'auth.login.subtitle': 'Connecte-toi à ton coffre-fort.',
  'auth.login.submit': 'Se connecter',
  'auth.accountType': 'Type de compte',
  'auth.private': 'Particulier',
  'auth.privateHint': 'Coffre-fort personnel',
  'auth.pro': 'Professionnel',
  'auth.proHint': 'Demander des pièces',
  'auth.nameFull': 'Nom complet',
  'auth.nameOrg': 'Nom ou organisme',
  'auth.namePlaceholderPrivate': 'Jean Dupont',
  'auth.namePlaceholderPro': 'Cabinet Dupont & Associés',
  'auth.proPending': 'Le compte professionnel est activé après validation par un administrateur.',
  'auth.email': 'Email',
  'auth.password': 'Mot de passe',
  'auth.forgot': 'Mot de passe oublié ?',
  'auth.showPassword': 'Afficher le mot de passe',
  'auth.hidePassword': 'Masquer le mot de passe',
  'auth.pleaseWait': 'Veuillez patienter…',
  'auth.haveAccount': 'Déjà un compte ?',
  'auth.noAccount': 'Pas encore de compte ?',
  'auth.toLogin': 'Se connecter',
  'auth.toSignup': 'Créer un compte',
}

const es: Dict = {
  'auth.signup.title': 'Crea tu cuenta',
  'auth.signup.subtitle': 'Empieza a guardar tus documentos en privado.',
  'auth.signup.submit': 'Crear la cuenta',
  'auth.login.title': 'Bienvenido de nuevo',
  'auth.login.subtitle': 'Accede a tu caja fuerte.',
  'auth.login.submit': 'Iniciar sesión',
  'auth.accountType': 'Tipo de cuenta',
  'auth.private': 'Particular',
  'auth.privateHint': 'Caja fuerte personal',
  'auth.pro': 'Profesional',
  'auth.proHint': 'Solicitar documentos',
  'auth.nameFull': 'Nombre completo',
  'auth.nameOrg': 'Nombre u organización',
  'auth.namePlaceholderPrivate': 'Juan Pérez',
  'auth.namePlaceholderPro': 'Despacho Pérez y Asociados',
  'auth.proPending': 'La cuenta profesional se activa tras la validación de un administrador.',
  'auth.email': 'Correo electrónico',
  'auth.password': 'Contraseña',
  'auth.forgot': '¿Olvidaste tu contraseña?',
  'auth.showPassword': 'Mostrar la contraseña',
  'auth.hidePassword': 'Ocultar la contraseña',
  'auth.pleaseWait': 'Espera un momento…',
  'auth.haveAccount': '¿Ya tienes una cuenta?',
  'auth.noAccount': '¿Aún no tienes una cuenta?',
  'auth.toLogin': 'Iniciar sesión',
  'auth.toSignup': 'Crear una cuenta',
}

const en: Dict = {
  'auth.signup.title': 'Create your account',
  'auth.signup.subtitle': 'Start storing your documents privately.',
  'auth.signup.submit': 'Create account',
  'auth.login.title': 'Welcome back',
  'auth.login.subtitle': 'Sign in to your vault.',
  'auth.login.submit': 'Sign in',
  'auth.accountType': 'Account type',
  'auth.private': 'Individual',
  'auth.privateHint': 'Personal vault',
  'auth.pro': 'Professional',
  'auth.proHint': 'Request documents',
  'auth.nameFull': 'Full name',
  'auth.nameOrg': 'Name or organisation',
  'auth.namePlaceholderPrivate': 'John Smith',
  'auth.namePlaceholderPro': 'Smith & Partners',
  'auth.proPending': 'Professional accounts are activated after an administrator approves them.',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.forgot': 'Forgot your password?',
  'auth.showPassword': 'Show password',
  'auth.hidePassword': 'Hide password',
  'auth.pleaseWait': 'Please wait…',
  'auth.haveAccount': 'Already have an account?',
  'auth.noAccount': "Don't have an account yet?",
  'auth.toLogin': 'Sign in',
  'auth.toSignup': 'Create an account',
}

const de: Dict = {
  'auth.signup.title': 'Konto erstellen',
  'auth.signup.subtitle': 'Speichere deine Dokumente privat.',
  'auth.signup.submit': 'Konto erstellen',
  'auth.login.title': 'Willkommen zurück',
  'auth.login.subtitle': 'Melde dich bei deinem Tresor an.',
  'auth.login.submit': 'Anmelden',
  'auth.accountType': 'Kontotyp',
  'auth.private': 'Privatperson',
  'auth.privateHint': 'Persönlicher Tresor',
  'auth.pro': 'Fachkraft',
  'auth.proHint': 'Dokumente anfordern',
  'auth.nameFull': 'Vollständiger Name',
  'auth.nameOrg': 'Name oder Organisation',
  'auth.namePlaceholderPrivate': 'Max Mustermann',
  'auth.namePlaceholderPro': 'Kanzlei Mustermann & Partner',
  'auth.proPending': 'Geschäftskonten werden nach Freigabe durch einen Administrator aktiviert.',
  'auth.email': 'E-Mail',
  'auth.password': 'Passwort',
  'auth.forgot': 'Passwort vergessen?',
  'auth.showPassword': 'Passwort anzeigen',
  'auth.hidePassword': 'Passwort verbergen',
  'auth.pleaseWait': 'Bitte warten…',
  'auth.haveAccount': 'Schon ein Konto?',
  'auth.noAccount': 'Noch kein Konto?',
  'auth.toLogin': 'Anmelden',
  'auth.toSignup': 'Konto erstellen',
}

const DICTIONARIES: Record<Locale, Dict> = { fr, es, en, de }

export function getDictionary(locale: Locale): Dict {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE]
}

/** Look up a key, falling back to French then the raw key. Supports {var} interpolation. */
export function translate(dict: Dict, key: string, vars?: Record<string, string | number>): string {
  let text = dict[key] ?? DICTIONARIES[DEFAULT_LOCALE][key] ?? key
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
  }
  return text
}
