export type Locale = "da" | "en";

export const LOCALES: Locale[] = ["da", "en"];
export const DEFAULT_LOCALE: Locale = "da";
export const LOCALE_COOKIE = "nor_locale";

const da = {
  nav: {
    order: "Bestil",
    contact: "Kontakt",
    tracking: "Tracking",
    loginSignup: "Login / Opret",
    homeAria: "Nor Courier forsiden",
  },
  home: {
    headline: "Pris på få sekunder.",
    lead: "Beregn vejledende kurérpris her — eller log ind for jeres egne kundepriser.",
    whyEyebrow: "Hvorfor Nor Courier",
    whyTitle: "Det får du, når vi flytter dit gods",
    why: [
      {
        title: "Overblik",
        text: "Én fast kontaktperson og klare aftaler — fra pris til levering.",
      },
      {
        title: "Hurtig pris",
        text: "Se Nor Express og Nor Economy på sekunder — uden at vente på tilbud.",
      },
      {
        title: "Tracking",
        text: "Følg forsendelsen med trackingnummer direkte hos transportøren.",
      },
      {
        title: "Kundepriser",
        text: "Log ind og få jeres aftalte marginer — uden synlige underleverandører.",
      },
    ],
  },
  footer: {
    tagline:
      "Vi hedder Nor Courier, fordi vi er forankret i Nordjylland — og fordi vi arbejder med en Nordic Spirit: ordentlighed, struktur og aftaler der holder. Nu også til kurér.",
    cvr: "CVR-nr. 46 42 72 62",
    rights: "NOR Spedition",
    toTop: "Til toppen",
    hirtshals: "Hirtshals",
    copenhagen: "København",
  },
  contact: {
    title: "Kontakt os",
    lead: "Har du spørgsmål eller brug for hjælp? Du er altid velkommen til at kontakte os.",
    hours: "Hverdage 08–16",
    generalTitle: "Nor Courier",
    generalText:
      "Ring eller skriv — vi hjælper med priser, booking og status på forsendelser.",
    phoneLabel: "Tlf.",
    emailLabel: "E-mail",
    officesTitle: "Kontorer",
    hirtshals: "Hirtshals",
    copenhagen: "København",
    partnersTitle: "Direkte kontakt",
    cvr: "CVR-nr. 46 42 72 62",
  },
  tracking: {
    title: "Track forsendelse",
    lead: "Indtast trackingnummeret — vi slår op direkte hos transportøren (DHL, UPS m.fl.).",
    label: "Trackingnummer",
    placeholder: "F.eks. 1Z… eller DHL-nummer",
    carrierLabel: "Transportør (valgfrit)",
    carrierAuto: "Automatisk",
    submit: "Track",
    loading: "Søger…",
    empty: "Ingen status fundet for dette nummer.",
    eventsTitle: "Statushistorik",
    openCarrier: "Åbn på transportørens side",
    notConfigured:
      "Live tracking er ikke konfigureret endnu. Du kan stadig åbne sporing hos transportøren.",
  },
  auth: {
    loginTab: "Log ind",
    signupTab: "Opret",
    loginTitle: "Kunde-login",
    loginSubtitle: "Se jeres aftalte Nor Courier-priser og benchmark.",
    signupTitle: "Opret kundelogin",
    signupSubtitle:
      "Opret adgang til Nor Courier. Vi sætter standardmarginer — justeres efter aftale.",
    email: "Email",
    password: "Password",
    company: "Firmanavn",
    contactName: "Kontaktnavn",
    loginSubmit: "Log ind",
    loginLoading: "Logger ind…",
    signupSubmit: "Opret konto",
    signupLoading: "Opretter…",
    backHome: "Til forsiden",
    signupSuccess: "Konto oprettet — du er logget ind.",
  },
  quote: {
    eyebrow: "Hurtig pris",
    submit: "Beregn pris",
    loading: "Beregner…",
    loginCta: "Log ind for kundepriser",
  },
};

const en = {
  nav: {
    order: "Order",
    contact: "Contact",
    tracking: "Tracking",
    loginSignup: "Login / Sign up",
    homeAria: "Nor Courier home",
  },
  home: {
    headline: "Price in seconds.",
    lead: "Get an indicative courier price here — or sign in for your negotiated rates.",
    whyEyebrow: "Why Nor Courier",
    whyTitle: "What you get when we move your goods",
    why: [
      {
        title: "Overview",
        text: "One dedicated contact and clear agreements — from quote to delivery.",
      },
      {
        title: "Instant price",
        text: "See Nor Express and Nor Economy in seconds — no waiting for quotes.",
      },
      {
        title: "Tracking",
        text: "Follow the shipment with a tracking number straight from the carrier.",
      },
      {
        title: "Customer rates",
        text: "Sign in for your negotiated markups — without visible subcontractors.",
      },
    ],
  },
  footer: {
    tagline:
      "We’re Nor Courier because we’re rooted in Northern Jutland — and because we work with a Nordic Spirit: integrity, structure and agreements that hold. Now for courier too.",
    cvr: "CVR no. 46 42 72 62",
    rights: "NOR Spedition",
    toTop: "Back to top",
    hirtshals: "Hirtshals",
    copenhagen: "Copenhagen",
  },
  contact: {
    title: "Contact us",
    lead: "Questions or need help? You’re always welcome to get in touch.",
    hours: "Weekdays 08–16",
    generalTitle: "Nor Courier",
    generalText:
      "Call or write — we help with prices, booking and shipment status.",
    phoneLabel: "Phone",
    emailLabel: "Email",
    officesTitle: "Offices",
    hirtshals: "Hirtshals",
    copenhagen: "Copenhagen",
    partnersTitle: "Direct contact",
    cvr: "CVR no. 46 42 72 62",
  },
  tracking: {
    title: "Track shipment",
    lead: "Enter the tracking number — we look it up directly with the carrier (DHL, UPS and more).",
    label: "Tracking number",
    placeholder: "E.g. 1Z… or DHL number",
    carrierLabel: "Carrier (optional)",
    carrierAuto: "Automatic",
    submit: "Track",
    loading: "Searching…",
    empty: "No status found for this number.",
    eventsTitle: "Status history",
    openCarrier: "Open on carrier site",
    notConfigured:
      "Live tracking is not configured yet. You can still open tracking on the carrier’s site.",
  },
  auth: {
    loginTab: "Log in",
    signupTab: "Sign up",
    loginTitle: "Customer login",
    loginSubtitle: "See your negotiated Nor Courier prices and benchmark.",
    signupTitle: "Create customer login",
    signupSubtitle:
      "Create access to Nor Courier. We apply standard markups — adjusted by agreement.",
    email: "Email",
    password: "Password",
    company: "Company name",
    contactName: "Contact name",
    loginSubmit: "Log in",
    loginLoading: "Signing in…",
    signupSubmit: "Create account",
    signupLoading: "Creating…",
    backHome: "Back to home",
    signupSuccess: "Account created — you are signed in.",
  },
  quote: {
    eyebrow: "Quick quote",
    submit: "Get price",
    loading: "Calculating…",
    loginCta: "Sign in for customer rates",
  },
};

export type Dictionary = typeof da;

export const dictionaries: Record<Locale, Dictionary> = { da, en };

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "da" || value === "en";
}
