export class CreateMaterialDto {
  type: 'page' | 'pdf';
  title: string;
  folderId: string;
  content?: string;
}