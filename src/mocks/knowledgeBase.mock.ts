export interface KnowledgeCategory {
  id: string;
  name: string;
  description: string;
  documentCount: number;
}

export const knowledgeCategories: KnowledgeCategory[] = [
  { id: '1', name: 'Contracts & Legal', description: 'Vendor agreements, NDAs, and compliance documents', documentCount: 42 },
  { id: '2', name: 'Market Research', description: 'Competitor analysis and industry reports', documentCount: 27 },
  { id: '3', name: 'Financial Reports', description: 'Quarterly statements and budget forecasts', documentCount: 63 },
  { id: '4', name: 'HR Policies', description: 'Employee handbooks and internal policy documents', documentCount: 15 },
  { id: '5', name: 'Product Specs', description: 'Technical specifications and roadmaps', documentCount: 38 },
  { id: '6', name: 'Meeting Notes', description: 'Decision logs and stakeholder meeting summaries', documentCount: 91 },
];
