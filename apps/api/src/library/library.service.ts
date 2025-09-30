import { Injectable } from '@nestjs/common';

@Injectable()
export class LibraryService {
  async getLibrary(query: any = {}) {
    const { include = 'all', depth = 2 } = query;
    
    // 模擬教材庫資料
    const mockLibrary = {
      folders: [
        {
          id: 'folder-001',
          name: 'English Materials',
          parentId: null,
          path: '/English Materials',
          children: [
            {
              id: 'folder-002',
              name: 'Beginner',
              parentId: 'folder-001',
              path: '/English Materials/Beginner',
              materials: [
                {
                  id: 'material-001',
                  type: 'page',
                  title: 'Basic Greetings',
                  content: 'Hello, how are you? Nice to meet you!'
                }
              ]
            },
            {
              id: 'folder-003',
              name: 'Intermediate',
              parentId: 'folder-001',
              path: '/English Materials/Intermediate',
              materials: [
                {
                  id: 'material-002',
                  type: 'page',
                  title: 'Daily Conversation',
                  content: 'What did you do yesterday? I went to the park.'
                }
              ]
            }
          ]
        }
      ]
    };

    if (include === 'flat') {
      // 返回扁平結構
      const flatMaterials = [];
      const extractMaterials = (folder) => {
        if (folder.materials) {
          flatMaterials.push(...folder.materials);
        }
        if (folder.children) {
          folder.children.forEach(extractMaterials);
        }
      };
      
      mockLibrary.folders.forEach(extractMaterials);
      return { materials: flatMaterials };
    }

    return mockLibrary;
  }

  async getMaterial(id: string) {
    // 模擬教材詳細資料
    const mockMaterials = {
      'material-001': {
        id: 'material-001',
        type: 'page',
        title: 'Basic Greetings',
        folderId: 'folder-002',
        content: 'Hello, how are you? Nice to meet you! My name is... What\'s your name?',
        meta: {
          difficulty: 'beginner',
          duration: 30,
          tags: ['greetings', 'introduction']
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      'material-002': {
        id: 'material-002',
        type: 'page',
        title: 'Daily Conversation',
        folderId: 'folder-003',
        content: 'What did you do yesterday? I went to the park. Did you have fun? Yes, it was great!',
        meta: {
          difficulty: 'intermediate',
          duration: 45,
          tags: ['conversation', 'past tense']
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    };

    const material = mockMaterials[id];
    if (!material) {
      throw new Error('Material not found');
    }

    return material;
  }
}
