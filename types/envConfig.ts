/*
Define the structure and types for environment configuration settings. These values are defined per environment in the config folder.
uses 
*/
export interface EnvConfig {
  baseUrl: string;
  xmlSitemapUrl?: string;
  robotsTxt?: string;
  searchUrl?: string;
  articleUrl?: string;
  bookingReference?: string;
  bookingSurname?: string;
  formTitle?: string;
  formFirstName?: string;
  formLastName?: string;
  formEmail?: string;
  formPhone?: string;
}

/*
What EnvironmentManager.getValue() actually returns: EnvConfig merged with config/defaults.ts,
so every field is guaranteed a real string — no `?? ''` / `|| ''` needed at the point of use.
*/
export type ResolvedConfig = Required<EnvConfig>;
