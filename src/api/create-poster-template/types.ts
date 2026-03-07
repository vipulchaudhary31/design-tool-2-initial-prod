export interface CreatePosterTemplateRequest {
  title: string;
  raw_config: any;
}

export interface PosterTemplate {
  id: number;
  title: string;
  raw_config: any;
  [key: string]: any;
}
