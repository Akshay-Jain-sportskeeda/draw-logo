export interface Template {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
}

export const templates: Template[] = [
  {
    id: 'bull-head',
    name: 'Bull Head',
    description: 'A fierce bull head ready for your creative remix. Add your unique style and colors to make it your own!',
    imageUrl: '/templates/bull-head.png',
    category: 'nfl'
  }
];

export function getTemplateById(id: string): Template | undefined {
  return templates.find(template => template.id === id);
}

export function getDefaultTemplate(): Template {
  return templates[0];
}
